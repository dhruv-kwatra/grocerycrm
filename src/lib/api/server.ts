import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth/session";
import { mintApiToken } from "@/lib/auth/api-token";

// Server-side fetch helpers for calling the platform HTTP API from Server
// Components and Server Actions. Same-origin base (the edge routes `/api/<mod>/*`
// to the NestJS backend, everything else to Next.js). Sends BOTH:
//   • the Auth.js session cookie  — for routes still served by Next.js
//   • `Authorization: Bearer <token>` — for routes served by the backend, which
//     does NOT read the cookie (minted from the session via lib/auth/api-token).
// This lets RSC reads be migrated to the backend one prefix at a time.

async function requestContext() {
  const h = await headers();
  const cookie = h.get("cookie") ?? "";
  // RSC reads hit the backend DIRECTLY (one hop), never same-origin through this
  // server's own middleware + rewrite (which doubles connections + JWT-minting
  // under SSR, and depends on the rewrite being configured). Prefer an explicit
  // API_BASE_URL, else API_PROXY_TARGET, else default to the backend on its
  // standard local port (4400) — the single-VM deploy runs the backend on the
  // same host, and so does local dev, so this works with zero env config.
  const base = process.env.API_BASE_URL ?? process.env.API_PROXY_TARGET ?? "http://127.0.0.1:4400";
  let authorization = "";
  try {
    const user = await getCurrentUser();
    const minted = mintApiToken(user);
    if (minted) authorization = `Bearer ${minted.token}`;
  } catch {
    /* unauthenticated context — fall back to cookie-only */
  }
  return { base, cookie, authorization };
}

function authHeaders(cookie: string, authorization: string): Record<string, string> {
  const out: Record<string, string> = { cookie };
  if (authorization) out.authorization = authorization;
  return out;
}

async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    // NestJS puts the specific reason in `message` (string or validation array)
    // and only the HTTP status name in `error` — prefer the former.
    if (typeof body?.message === "string" && body.message) return body.message;
    if (Array.isArray(body?.message) && body.message.length) return body.message.join(", ");
    if (typeof body?.error === "string" && body.error) return body.error;
  } catch {
    /* non-JSON error body */
  }
  return fallback;
}

// Fail fast instead of hanging on undici's 5-minute headers timeout when the
// backend is unreachable or stuck (e.g. its own DB call never returns). Override
// with API_TIMEOUT_MS.
const API_TIMEOUT_MS = Number(process.env.API_TIMEOUT_MS ?? 15000);

// Wrap fetch so a connection failure / timeout surfaces a clear, fast error that
// names the backend, instead of a cryptic 5-minute `UND_ERR_HEADERS_TIMEOUT`.
async function apiFetch(base: string, path: string, init: RequestInit): Promise<Response> {
  const primaryUrl = `${base}${path}`;
  const fallbackBase =
    base.includes("://localhost:")
      ? base.replace("://localhost:", "://127.0.0.1:")
      : base.includes("://127.0.0.1:")
        ? base.replace("://127.0.0.1:", "://localhost:")
        : null;
  try {
    return await fetch(primaryUrl, { ...init, signal: AbortSignal.timeout(API_TIMEOUT_MS) });
  } catch (err) {
    if (fallbackBase) {
      try {
        return await fetch(`${fallbackBase}${path}`, { ...init, signal: AbortSignal.timeout(API_TIMEOUT_MS) });
      } catch {
        // Let the original error shape determine the message below.
      }
    }
    const reason =
      err instanceof Error && err.name === "TimeoutError"
        ? `timed out after ${API_TIMEOUT_MS}ms`
        : "connection failed";
    throw new Error(
      `Backend ${reason}: ${primaryUrl}. Is the backend running and reachable? ` +
        `(set API_BASE_URL / API_PROXY_TARGET, default http://127.0.0.1:4400)`,
    );
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const { base, cookie, authorization } = await requestContext();
  const res = await apiFetch(base, path, {
    headers: authHeaders(cookie, authorization),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(await parseError(res, `GET ${path} failed (${res.status})`));
  }
  return res.json() as Promise<T>;
}

export async function apiSend<T>(
  path: string,
  method: "POST" | "PATCH" | "DELETE" | "PUT",
  body?: unknown
): Promise<T> {
  const { base, cookie, authorization } = await requestContext();
  const res = await apiFetch(base, path, {
    method,
    headers: { ...authHeaders(cookie, authorization), "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(await parseError(res, `${method} ${path} failed (${res.status})`));
  }
  return res.json() as Promise<T>;
}
