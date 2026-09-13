"use client";

import * as React from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/lib/validations";

type FormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Embrulha uma Server Action com `useActionState`, dispara `onSuccess` uma
 * vez quando a action retorna `{ ok: true }`, e mostra um toast em
 * `{ ok: false }` (exceto quando há fieldErrors, que renderizam inline).
 */
export function useAction(action: FormAction, opts: { onSuccess?: () => void } = {}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);
  const handled = React.useRef<ActionState>(null);
  const onSuccess = React.useRef(opts.onSuccess);

  React.useEffect(() => {
    onSuccess.current = opts.onSuccess;
  });

  React.useEffect(() => {
    if (!state || state === handled.current) return;
    handled.current = state;
    if (state.ok) {
      onSuccess.current?.();
    } else if (!state.fieldErrors) {
      toast.error(state.message);
    }
  }, [state]);

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;
  const errorMessage = state && !state.ok && !state.fieldErrors ? state.message : undefined;

  return { state, formAction, pending, fieldErrors, errorMessage };
}
