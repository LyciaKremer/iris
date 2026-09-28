-- CreateTable
CREATE TABLE "VeiculoLocalizacao" (
    "veiculo" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "regiao" TEXT NOT NULL,
    "tipoFonte" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VeiculoLocalizacao_pkey" PRIMARY KEY ("veiculo")
);
