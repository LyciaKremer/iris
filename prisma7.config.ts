import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
    // Neon: `prisma migrate dev` precisa de um shadow DB pra criar/derrubar.
    // Se a role principal não puder, aponte isso pra um segundo banco Neon vazio.
    shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"],
  },
});
