import toast from "react-hot-toast";

// Centralized toast helpers for the portal. Import `{ notify }` in any client
// component and call notify.success / notify.error / notify.warning. The base
// dark theme + success/error icon colors live on <PortalToaster> (mounted in
// the root layout); react-hot-toast has no native "warning", so it's a custom
// amber toast here.
export const notify = {
  success: (message: string) => toast.success(message),

  error: (message: string) => toast.error(message),

  warning: (message: string) =>
    toast(message, {
      icon: "⚠️",
      style: { border: "1px solid rgba(245,176,21,0.55)" },
    }),

  // Pass-throughs for less common cases (e.g. optimistic loading → resolve).
  loading: (message: string) => toast.loading(message),
  dismiss: (id?: string) => toast.dismiss(id),
};

/**
 * Extract a human-readable message from an RTK Query / fetch error
 * (`{ data: { error } }`) with a sensible fallback. Handy in mutation catches:
 *   catch (e) { notify.error(errorMessage(e, "Could not save")); }
 */
export function errorMessage(e: unknown, fallback = "Something went wrong"): string {
  const data = (e as { data?: { error?: string } })?.data;
  if (data && typeof data.error === "string") return data.error;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}
