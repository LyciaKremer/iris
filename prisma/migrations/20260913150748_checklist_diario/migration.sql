-- CreateTable
CREATE TABLE "ChecklistDia" (
    "data" TEXT NOT NULL,
    "itens" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistDia_pkey" PRIMARY KEY ("data")
);
