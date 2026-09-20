// Result shape retail server actions return (instead of throwing), so the
// client wrapper can toast success/error. Pure types — safe to import from both
// server actions and client components.
export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };
