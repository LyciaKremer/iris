import { PageLoader } from "@/components/page-loader";

/**
 * Fallback automático do Next.js (convenção loading.tsx) — envolve
 * `{children}` do layout deste grupo de rotas numa Suspense boundary.
 * Como TODA página do app (candidatos, localizações, relatório geral, e
 * tudo sob [candidato]) renderiza como filha desse layout, esse arquivo
 * sozinho cobre qualquer troca de tela: sem ele, o Next mantém a tela
 * atual visível e paradinha até o RSC da próxima terminar, sem nenhum
 * sinal de que algo está acontecendo — exatamente o problema relatado.
 */
export default function Loading() {
  return <PageLoader />;
}
