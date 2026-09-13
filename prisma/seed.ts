import "dotenv/config";
import ws from "ws";
import { hash } from "@node-rs/argon2";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

neonConfig.webSocketConstructor ??= ws;

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const email = process.env.SEED_EMAIL ?? "dev@iris.local";
  const senha = process.env.SEED_PASSWORD ?? "iris1234";

  const passwordHash = await hash(senha, {
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Lycia", passwordHash },
  });

  console.log(`Usuário pronto: ${user.email} (senha: ${senha} se acabou de ser criado)`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
