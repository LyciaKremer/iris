-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Noticia" (
    "id" TEXT NOT NULL,
    "noticiaId" TEXT NOT NULL,
    "dataExecucao" TEXT NOT NULL,
    "veiculo" TEXT NOT NULL,
    "tipoVeiculo" TEXT NOT NULL,
    "tituloOriginal" TEXT NOT NULL,
    "transcricao" TEXT,
    "urlMidia" TEXT,
    "linkDireto" TEXT,
    "sentimentoOriginal" TEXT NOT NULL,
    "dataPublicacao" TIMESTAMP(3) NOT NULL,
    "resumo" TEXT,
    "relevante" BOOLEAN,
    "sentimentoFinal" TEXT,
    "secretaria" TEXT,
    "revisadoPelaIa" BOOLEAN NOT NULL DEFAULT false,
    "resumoOriginal" TEXT,
    "problemaDetectado" TEXT,
    "revisadoManualmente" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Noticia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Noticia_dataExecucao_idx" ON "Noticia"("dataExecucao");

-- CreateIndex
CREATE UNIQUE INDEX "Noticia_noticiaId_dataExecucao_key" ON "Noticia"("noticiaId", "dataExecucao");
