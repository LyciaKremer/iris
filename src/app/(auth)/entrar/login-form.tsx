"use client";

import { useRouter } from "next/navigation";
import { useAction } from "@/hooks/use-action";
import { loginAction } from "@/server/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
        <Input id="email" name="email" type="email" autoComplete="email" className="mt-1" />
        {fieldErrors?.email && (
          <p className="mt-1 text-sm text-[var(--negative)]">{fieldErrors.email[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Senha
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="mt-1"
        />
        {fieldErrors?.password && (
          <p className="mt-1 text-sm text-[var(--negative)]">{fieldErrors.password[0]}</p>
        )}
      </div>

      {errorMessage && <p className="text-sm text-[var(--negative)]">{errorMessage}</p>}

      <Button type="submit" loading={pending} className="w-full">
        {pending ? "Entrando…" : "Entrar"}
      </Button>
      <noscript>
        <Button type="submit" variant="outline" className="w-full">
          Entrar
        </Button>
      </noscript>
    </form>
  );
}
