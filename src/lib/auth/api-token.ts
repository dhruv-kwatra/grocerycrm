import { createHmac } from "crypto";
import type { CurrentUser } from "@/lib/auth/session";

// Mints the short-lived HS256 "API token" the standalone NestJS backend verifies
// (`Authorization: Bearer <token>`, claims shared with the backend JwtAuthGuard).
// Signed with API_JWT_SECRET via Node crypto — no JWT dependency. Used by the
// `/api/auth/api-token` route AND by the server-side apiGet/apiSend helpers so
// RSC → backend calls authenticate without the backend reading the Auth.js cookie.

const TTL_SECONDS = 60 * 60; // 1 hour

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export function signHs256(payload: Record<string, unknown>, secret: string): string {
  const encHeader = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const encPayload = b64url(JSON.stringify(payload));
  const data = `${encHeader}.${encPayload}`;
  const sig = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

/**
 * Mint a short-lived SERVICE token for server-to-server calls from a Next.js
 * route handler to the backend (e.g. the storage thin client). Not tied to a
 * session user — represents the portal itself. Server-side only.
 */
export function mintServiceToken(): string | null {
  const secret = process.env.API_JWT_SECRET;
  if (!secret) return null;
  const now = Math.floor(Date.now() / 1000);
  return signHs256(
    {
      sub: 0, id: 0, tenantId: 0, name: "portal-service",
      email: "service@portal.internal", isSuperAdmin: true,
      iat: now, exp: now + 300,
    },
    secret,
  );
}

/** Mint an API token for a session user. Returns null if API_JWT_SECRET is unset. */
export function mintApiToken(user: CurrentUser): { token: string; expiresAt: number } | null {
  const secret = process.env.API_JWT_SECRET;
  if (!secret) return null;
  const now = Math.floor(Date.now() / 1000);
  const exp = now + TTL_SECONDS;
  const token = signHs256(
    {
      sub: user.id, id: user.id, tenantId: user.tenantId, name: user.name,
      email: user.email, avatarUrl: user.avatarUrl, isSuperAdmin: user.isSuperAdmin,
      iat: now, exp,
    },
    secret,
  );
  return { token, expiresAt: exp * 1000 };
}
