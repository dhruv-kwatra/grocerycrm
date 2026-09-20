import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/config";
import { mintEdgeToken } from "@/lib/auth/edge-token";

const { auth } = NextAuth(authConfig);

// Retail-only app: the ONLY backend prefix this frontend proxies is /api/retail
// (see next.config.ts rewrites). Client-direct calls to it get a minted Bearer;
// server-side apiGet/apiSend hit the backend directly with their own token.
const isRetailApi = (p: string) => p === "/api/retail" || p.startsWith("/api/retail/");

export default auth(async (req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (req.auth?.user as any) ?? null;

  // Backend object storage public serve (avatars / HMAC-gated files) — browser
  // direct, no Bearer.
  if (pathname === "/api/uploads/serve" || pathname === "/api/uploads/avatar") {
    return NextResponse.next();
  }

  // Retail API: authenticate by minting + injecting a Bearer. 401 (not a login
  // redirect) for unauthenticated API calls.
  if (isRetailApi(pathname)) {
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const headers = new Headers(req.headers);
    const token = await mintEdgeToken(user);
    if (token) headers.set("authorization", `Bearer ${token}`);
    return NextResponse.next({ request: { headers } });
  }

  // NextAuth's own routes.
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  // Public marketing landing at the root ("Enter RetailIQ" → the app).
  if (pathname === "/") return NextResponse.next();

  // Login page: always accessible so users can view credentials, switch roles, or create dummy IDs.
  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  // Everything else requires a session → the retail login.
  if (!user) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("callbackUrl", nextUrl.href);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Static assets are matched by extension rather than by name. The list used
    // to spell out individual files (UF.png, icon.png, icon.svg), so every new
    // image under public/ was auth-gated by default: the landing page is public
    // but its hero art 307'd to /login, and next/image then reported the
    // redirect HTML as "not a valid image". Anything served from public/ is
    // public by definition — user uploads go through /api/uploads/serve, which
    // is a route, not a file, and stays behind the session check.
    "/((?!_next/static|_next/image|favicon.ico|avatars|public|uploads|.*\\.(?:png|jpe?g|gif|svg|webp|avif|ico|txt|xml|woff2?)$).*)",
  ],
};
