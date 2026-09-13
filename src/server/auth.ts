"use server";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";
import { loginSchema, type ActionState } from "@/lib/validations";

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Dados inválidos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(user.passwordHash, password))) {
    return { ok: false, message: "E-mail ou senha incorretos." };
  }

  await createSession(user.id);
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
}
