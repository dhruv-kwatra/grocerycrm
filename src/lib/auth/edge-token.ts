// Edge-runtime minting of the backend "API token" (HS256, signed with
// API_JWT_SECRET) using Web Crypto — the proxy/middleware can't use node:crypto.
// Same claim shape the backend JwtAuthGuard verifies and that `mintApiToken`
// (node side) produces, so a token from either path is interchangeable.

const TTL_SECONDS = 60 * 60; // 1 hour

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlJson(obj: unknown): string {
  return b64url(new TextEncoder().encode(JSON.stringify(obj)));
}

export type EdgeTokenUser = {
  id: number;
  tenantId: number;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  isSuperAdmin?: boolean;
};

/** Mint a 1-hour backend API token for a session user; null if secret unset. */
export async function mintEdgeToken(user: EdgeTokenUser): Promise<string | null> {
  const secret = process.env.API_JWT_SECRET;
  if (!secret) return null;

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: user.id,
    id: user.id,
    tenantId: user.tenantId,
    name: user.name ?? "",
    email: user.email ?? "",
    avatarUrl: user.avatarUrl ?? null,
    isSuperAdmin: user.isSuperAdmin ?? false,
    iat: now,
    exp: now + TTL_SECONDS,
  };

  const data = `${b64urlJson({ alg: "HS256", typ: "JWT" })}.${b64urlJson(payload)}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return `${data}.${b64url(new Uint8Array(sig))}`;
}
