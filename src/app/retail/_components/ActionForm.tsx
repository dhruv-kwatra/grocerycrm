"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { notify } from "@/lib/toast";
import type { ActionResult } from "./action-types";

// Wraps a retail server action in a <form> that shows a pending state and
// toasts success/error (using the portal's existing notify helpers). The action
// must return an ActionResult, not throw — see each module's actions.ts.
export function ActionForm({
  action,
  success,
  className,
  children,
}: {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  success: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(action, null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) notify.success(state.message ?? success);
    else notify.error(state.error);
  }, [state, success]);

  return (
    <form action={formAction} className={className}>
      {children}
    </form>
  );
}

// Submit button that disables itself while the parent ActionForm is pending.
// name/value are forwarded so multi-button forms (approve/reject) work.
export function SubmitButton({
  children,
  className = "",
  name,
  value,
  // Callers can block submission on their own validity rule (the walk-in form
  // uses it to require an outcome). Always OR'd with `pending`, never replaces
  // it, so a caller can't accidentally re-enable a mid-flight button.
  disabled = false,
}: {
  children: React.ReactNode;
  className?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending || disabled}
      aria-busy={pending}
      className={`${className} disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}
