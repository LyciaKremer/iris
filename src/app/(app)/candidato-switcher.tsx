"use client";

import { useRouter, usePathname } from "next/navigation";
import { Select } from "@/components/ui/input";

type CandidatoOpcao = { slug: string; nome: string };

/** Troca de candidato mantendo a mesma sub-página (ex: de /veneziano/revisar
 * pra /andre/revisar) — só substitui o primeiro segmento da URL. */
export function CandidatoSwitcher({
  candidatos,
  atual,
}: {
  candidatos: CandidatoOpcao[];
  atual?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function trocar(novoSlug: string) {
    const resto = atual ? pathname.replace(`/${atual}`, "") : "";
    router.push(`/${novoSlug}${resto || "/revisar"}`);
  }

  if (candidatos.length === 0) return null;

  return (
    <Select value={atual ?? ""} onChange={(e) => trocar(e.target.value)}>
      {!atual && <option value="" disabled>Selecione um candidato</option>}
      {candidatos.map((c) => (
        <option key={c.slug} value={c.slug}>
          {c.nome}
        </option>
      ))}
    </Select>
  );
}
