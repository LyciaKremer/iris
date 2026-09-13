import "server-only";
import { hash, verify } from "@node-rs/argon2";

// Parâmetros argon2id na linha do OWASP, confortáveis pra uma aplicação pequena.
const OPTS = {
  memoryCost: 19_456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, OPTS);
}

export function verifyPassword(hashString: string, plain: string): Promise<boolean> {
  return verify(hashString, plain, OPTS);
}
