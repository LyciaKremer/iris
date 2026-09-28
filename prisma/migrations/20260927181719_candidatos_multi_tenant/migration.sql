-- CreateTable
CREATE TABLE "Candidato" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "clippingMonitoringId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidato_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Candidato_slug_key" ON "Candidato"("slug");

-- Seed: a PMJP é o único candidato com dado real hoje (tipo "instituicao").
-- Todos os outros nascem vazios, cadastrados depois pela tela /candidatos.
INSERT INTO "Candidato" ("id", "slug", "nome", "tipo", "ativo", "createdAt", "updatedAt")
VALUES ('cand_prefeitura', 'prefeitura', 'Prefeitura Municipal de João Pessoa (PMJP)', 'instituicao', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AlterTable: candidatoId nasce nullable pra poder popular as 582 linhas
-- existentes antes de virar NOT NULL (não dá pra fazer isso em um passo só
-- quando já existem linhas).
ALTER TABLE "Noticia" ADD COLUMN "candidatoId" TEXT;

-- Backfill: toda Noticia existente hoje é da PMJP (não havia outro
-- candidato no Iris antes desta migration).
UPDATE "Noticia" SET "candidatoId" = 'cand_prefeitura' WHERE "candidatoId" IS NULL;

-- AlterTable
ALTER TABLE "Noticia" ALTER COLUMN "candidatoId" SET NOT NULL;

-- DropIndex
DROP INDEX "Noticia_dataExecucao_idx";

-- DropIndex
DROP INDEX "Noticia_noticiaId_dataExecucao_key";

-- CreateIndex
CREATE INDEX "Noticia_candidatoId_dataExecucao_idx" ON "Noticia"("candidatoId", "dataExecucao");

-- CreateIndex
CREATE UNIQUE INDEX "Noticia_candidatoId_noticiaId_dataExecucao_key" ON "Noticia"("candidatoId", "noticiaId", "dataExecucao");

-- AddForeignKey
ALTER TABLE "Noticia" ADD CONSTRAINT "Noticia_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "Candidato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
