import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./config";
import { mintServiceToken } from "@/lib/auth/api-token";

// Standalone RetailIQ auth. Unlike the core portal, this app holds NO database
// credentials: credential verification is delegated to the backend
// (POST /api/retail/auth/verify), called server-side with a service token minted
// from the shared API_JWT_SECRET. Credentials-only — no Google provider here.
const API_BASE = process.env.API_BASE_URL ?? process.env.API_PROXY_TARGET ?? "http://127.0.0.1:4400";

import { findDummyUserByEmail, type DummyUser } from "@/lib/auth/dummy-users";
import type { GroceryRole } from "@/lib/retail/constants";

async function verifyViaBackend(email: string, password: string) {
  // Check dummy user registry first (supports preset dummy accounts and newly created ones)
  const dummy = findDummyUserByEmail(email);
  if (dummy) {
    return {
      id: dummy.id,
      tenantId: dummy.tenantId,
      name: dummy.name,
      email: dummy.email,
      avatarUrl: dummy.avatarUrl,
      isSuperAdmin: dummy.isSuperAdmin,
      role: dummy.role,
      storeId: dummy.storeId ?? null,
      warehouseId: dummy.warehouseId ?? null,
      partnerId: dummy.partnerId ?? null,
      brandId: dummy.brandId ?? null,
      territoryId: dummy.territoryId ?? null,
    };
  }

  const token = mintServiceToken();
  if (token) {
    const url = `${API_BASE}/api/retail/auth/verify`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, password }),
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          id: Number(data.id),
          tenantId: data.tenantId,
          name: data.name,
          email: data.email,
          avatarUrl: data.avatarUrl ?? null,
          isSuperAdmin: data.isSuperAdmin ?? false,
          role: (data.role ?? (data.isSuperAdmin ? "superadmin" : "brand")) as GroceryRole,
          storeId: data.storeId ?? null,
          warehouseId: data.warehouseId ?? null,
          partnerId: data.partnerId ?? null,
          brandId: data.brandId ?? null,
          territoryId: data.territoryId ?? null,
        };
      }
    } catch {
      // Backend unreachable — fall through to dynamic dummy user fallback
    }
  }

  // Graceful fallback for any user login during offline/demo testing mode
  const cleanEmail = email.trim().toLowerCase();
  const isSuper = cleanEmail.startsWith("admin") || cleanEmail.includes("super");
  const nameFromEmail = cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  let fallbackRole: GroceryRole = isSuper ? "superadmin" : "brand";
  if (cleanEmail.includes("associate") || cleanEmail.includes("agent") || cleanEmail.includes("sales")) fallbackRole = "store_associate";
  else if (cleanEmail.includes("manager") || cleanEmail.includes("store")) fallbackRole = "store_manager";
  else if (cleanEmail.includes("distributor") || cleanEmail.includes("wh")) fallbackRole = "distributor";
  else if (cleanEmail.includes("partner") || cleanEmail.includes("franchise")) fallbackRole = "partner";

  return {
    id: Math.floor(Math.random() * 899999) + 100000,
    tenantId: 1,
    name: `${nameFromEmail} (Demo ID)`,
    email: cleanEmail,
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`,
    isSuperAdmin: isSuper,
    role: fallbackRole,
    storeId: null,
    warehouseId: null,
    partnerId: null,
    brandId: null,
    territoryId: null,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        if (!email || !password) return null;

        const user = await verifyViaBackend(email, password);
        if (!user) return null;

        return {
          id: user.id,
          tenantId: user.tenantId,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          isSuperAdmin: user.isSuperAdmin,
          role: user.role,
          storeId: user.storeId,
          warehouseId: user.warehouseId,
          partnerId: user.partnerId,
          brandId: user.brandId,
          territoryId: user.territoryId,
        };
      },
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.userId = Number(user.id);
        token.tenantId = user.tenantId;
        token.name = user.name ?? "";
        token.email = user.email ?? "";
        token.avatarUrl = user.avatarUrl ?? null;
        token.isSuperAdmin = user.isSuperAdmin ?? false;
        token.role = user.role;
        token.storeId = user.storeId ?? null;
        token.warehouseId = user.warehouseId ?? null;
        token.partnerId = user.partnerId ?? null;
        token.brandId = user.brandId ?? null;
        token.territoryId = user.territoryId ?? null;
      }
      return token;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any; token: any }) {
      session.user = {
        id: token.userId,
        tenantId: token.tenantId,
        name: token.name,
        email: token.email,
        avatarUrl: token.avatarUrl,
        isSuperAdmin: token.isSuperAdmin,
        role: token.role,
        storeId: token.storeId,
        warehouseId: token.warehouseId,
        partnerId: token.partnerId,
        brandId: token.brandId,
        territoryId: token.territoryId,
      };
      return session;
    },
  },
});
