"use client";

import { useRouter } from "next/navigation";
import { useAction } from "@/hooks/use-action";
import { loginAction } from "@/server/auth";

export function LoginForm() {
  const router = useRouter();
  const { formAction, pending, fieldErrors, errorMessage } = useAction(loginAction, {
    onSuccess: () => router.push("/"),
  });

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
        />
        {fieldErrors?.email && (
          <p className="mt-1 text-sm text-[var(--negative)]">{fieldErrors.email[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
        />
        {fieldErrors?.password && (
          <p className="mt-1 text-sm text-[var(--negative)]">{fieldErrors.password[0]}</p>
        )}
      </div>

      {errorMessage && <p className="text-sm text-[var(--negative)]">{errorMessage}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
      <noscript>
        <button type="submit" className="w-full rounded-md border px-3 py-2 text-sm">
          Entrar
        </button>
      </noscript>
    </form>
  );
}
