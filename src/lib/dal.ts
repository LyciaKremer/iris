import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/session";

/**
 * Data Access Layer. Toda query/action que toca dado de usuário deve passar
 * por `requireUser()` (ou `getUser()`) — nunca confiar num id vindo do cliente.
 */

export const getUser = cache(async () => {
  const session = await readSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, createdAt: true },
  });
  return user;
});

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/entrar");
  return user;
}

/** Para Server Actions: lança erro em vez de redirecionar, pra virar mensagem no cliente. */
export async function requireUserId(): Promise<string> {
  const session = await readSession();
  if (!session) throw new Error("Não autenticado.");
  return session.userId;
}
