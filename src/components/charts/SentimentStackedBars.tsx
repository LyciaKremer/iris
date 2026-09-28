const CORES: Record<"positivo" | "negativo" | "neutro", string> = {
  negativo: "var(--negative)",
  neutro: "var(--neutro)",
  positivo: "var(--positive)",
};

const ROTULOS: Record<keyof typeof CORES, string> = {
  negativo: "Negativo",
  neutro: "Neutro",
  positivo: "Positivo",
};

export function SentimentStackedBars({
  linhas,
  percentual,
}: {
  linhas: { nome: string; positivo: number; negativo: number; neutro: number }[];
  percentual?: boolean;
}) {
  if (linhas.length === 0) {
    return <p className="text-sm italic text-[var(--muted-foreground)]">Nenhum registro no período.</p>;
  }

  const maxTotal = percentual ? 100 : Math.max(1, ...linhas.map((l) => l.positivo + l.negativo + l.neutro));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
        {(Object.keys(CORES) as (keyof typeof CORES)[]).map((chave) => (
          <span key={chave} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: CORES[chave] }} />
            {ROTULOS[chave]}
          </span>
        ))}
      </div>

      <div className="space-y-2">
        {linhas.map((linha) => {
          const total = linha.positivo + linha.negativo + linha.neutro;
          return (
            <div key={linha.nome} className="grid grid-cols-[minmax(0,180px)_1fr] items-center gap-3 text-sm">
              <span className="truncate text-right text-[var(--muted-foreground)]" title={linha.nome}>
                {linha.nome}
              </span>
              <div className="flex h-4 gap-0.5">
                {(["negativo", "neutro", "positivo"] as const).map((chave) => {
                  const valor = linha[chave];
                  if (valor <= 0) return null;
                  return (
                    <div
                      key={chave}
                      className="h-4 first:rounded-l-[4px] last:rounded-r-[4px]"
                      style={{ width: `${(valor / maxTotal) * 100}%`, background: CORES[chave] }}
                      title={`${ROTULOS[chave]}: ${percentual ? `${Math.round(valor)}%` : valor}`}
                    />
                  );
                })}
                {total === 0 && <div className="h-4 w-full rounded-[4px] bg-[var(--muted)]" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
