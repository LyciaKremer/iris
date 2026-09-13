import "server-only";
import ws from "ws";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

// Node < 22 não tem WebSocket global; o driver do Neon precisa de um pra transações.
neonConfig.webSocketConstructor ??= ws;
// Roteia queries simples via HTTP fetch (evita socket ocioso derrubado pelo Neon).
neonConfig.poolQueryViaFetch = true;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL não está definida. Copie .env.example para .env e preencha.",
    );
  }
  return new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

/** Singleton preguiçoso — o client (e a checagem de env) só é criado no
 *  primeiro uso, não na importação, pra `next build` conseguir coletar
 *  rotas sem precisar de DATABASE_URL. */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = (globalForPrisma.prisma ??= createClient());
    const value = Reflect.get(client, prop);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
