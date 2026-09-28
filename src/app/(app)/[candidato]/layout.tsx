import { getCandidatoPorSlug } from "@/server/queries/candidatos";

/** Só valida que o slug da URL corresponde a um candidato ativo (404 se
 * não) — cada página filha chama getCandidatoPorSlug(slug) de novo pra
 * pegar os dados (memoizado por requisição, não duplica a query). */
export default async function CandidatoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ candidato: string }>;
}) {
  const { candidato: slug } = await params;
  await getCandidatoPorSlug(slug);
  return <>{children}</>;
}
