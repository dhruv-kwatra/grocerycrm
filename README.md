# Retail CRM — standalone frontend

A separate Next.js app serving **only** the Retail CRM. It reuses the core
portal's backend (NestJS) and database — existing retail logins work unchanged —
but has its own retail-themed login and its own deploy, so retail users never
touch the core portal.

- **Routes:** `/login` (retail-themed) + `/retail/*`. No core/hrms/crm surfaces.
- **Auth:** credentials-only NextAuth. This app holds **no DB credentials** —
  login is verified by the backend (`POST /api/retail/auth/verify`, called
  server-side with a service token). Role/scope is resolved by the backend as
  before.
- **API:** only `/api/retail/*` is proxied to the backend (see `next.config.ts`).
- **Gate:** `src/proxy.ts` — unauthenticated requests bounce to `/login`; the
  app has no other modules, so the core dashboard is unreachable by construction.

## Run

```bash
cd platform/retailcrm
cp .env.local.example .env.local   # only API_BASE_URL + API_JWT_SECRET (no DB)
npm install
npm run dev          # http://localhost:4001
# prod: npm run build && npm run start   (or: pm2 start ecosystem.config.js)
```

Backend must be running (`platform/backend`, port 4400). `API_JWT_SECRET` MUST
match the backend so minted API tokens verify.

## Host separately (subdomain)

Point a subdomain at this app (port **4001**); the core portal stays on 4000.

```nginx
server {
  server_name retail.your-domain;
  location / { proxy_pass http://127.0.0.1:4001; proxy_set_header Host $host; }
}
```

Set `AUTH_URL=https://retail.your-domain` in `.env.local` for HTTPS (re-enables
the Secure session cookie).

## Relationship to the core portal

Retail source here is **copied** from `platform/portal/src/app/(retail)/retail`
(+ the small shared infra: `lib/api`, `lib/auth`, `lib/toast`, `server/db`,
`components/ui/Loader`). The portal's `/retail` routes are left intact. If retail
changes in the portal, port them here (or delete the portal copy to make this the
single source).
