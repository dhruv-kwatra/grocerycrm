import type { NextAuthConfig } from "next-auth";

// Edge-safe config — no DB imports, no Node.js-only modules.
// Used by middleware (proxy.ts) for JWT-only auth checks.
export const authConfig: NextAuthConfig = {
  // Trust the host header so auth works behind the VM's public IP / any proxy.
  // Applies to both the middleware (proxy.ts) and the main handler (index.ts).
  trustHost: true,
  // Only mark the session/CSRF cookies `Secure` when we're actually served over
  // https (set AUTH_URL=https://… in production). Over plain http — e.g. the
  // demo box on http://<ip>:3005 opened from a phone — a `Secure` cookie is
  // silently dropped by the browser (localhost is exempt, which is why desktop
  // "works" but mobile login bounces). Defaulting to non-secure fixes mobile.
  // Must live in the SHARED config so middleware + handler pick the same cookie
  // name; a mismatch would also break the session.
  useSecureCookies: (process.env.AUTH_URL ?? "").startsWith("https"),
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  providers: [], // providers added in lib/auth/index.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // NextAuth's own API routes must always be accessible
      if (pathname.startsWith("/api/auth")) return true;

      // Public, unauthenticated support surfaces: customer ticket submission
      // (/help) and the token-based post-resolution feedback portal (/feedback).
      if (pathname.startsWith("/help") || pathname.startsWith("/feedback")) return true;

      // Redirect logged-in users away from login page
      if (pathname.startsWith("/login")) {
        if (isLoggedIn && nextUrl.searchParams.get("switch") !== "true") {
          return Response.redirect(new URL("/retail", nextUrl));
        }
        return true;
      }

      // All other routes require auth
      return isLoggedIn;
    },

    // Edge-safe: maps the JWT claims onto session.user so the middleware
    // (proxy.ts) can mint a backend API token. Mirrors the node-side callback.
    session({ session, token }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session as any).user = {
        id: token.userId,
        tenantId: token.tenantId,
        name: token.name,
        email: token.email,
        avatarUrl: token.avatarUrl,
        isSuperAdmin: token.isSuperAdmin,
      };
      return session;
    },
  },
};
