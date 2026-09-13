import { z } from "zod";

export type ActionState =
  | { ok: true; message?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> }
  | null;

export const loginSchema = z.object({
  email: z.string().min(1, "Informe o e-mail.").email("E-mail inválido."),
  password: z.string().min(1, "Informe a senha."),
});
