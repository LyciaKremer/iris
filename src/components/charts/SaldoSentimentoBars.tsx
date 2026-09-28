/** Barras divergentes a partir do zero — saldo de sentimento (%
 * positivo − % negativo). Usa os mesmos tokens de positivo/negativo já
 * usados nos badges de sentimento em todo o app, em vez de uma paleta
 * divergente à parte. */
export function SaldoSentimentoBars({ dados }: { dados: { nome: string; valor: number }[] }) {
  if (dados.length === 0) {
    return <p className="text-sm italic text-[var(--muted-foreground)]">Nenhum registro no período.</p>;
  }

  const maxAbs = Math.max(1, ...dados.map((d) => Math.abs(d.valor)));

  return (
    <div className="space-y-2">
      {dados.map((d) => (
        <div key={d.nome} className="grid grid-cols-[minmax(0,160px)_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-right text-[var(--muted-foreground)]" title={d.nome}>
            {d.nome}
          </span>
          <div className="relative h-4">
            <div className="absolute inset-y-0 left-1/2 w-px bg-[var(--border)]" />
            {d.valor >= 0 ? (
              <div
                className="absolute inset-y-0 left-1/2 h-4 rounded-r-[4px]"
                style={{ width: `${(Math.abs(d.valor) / maxAbs / 2) * 100}%`, background: "var(--positive)" }}
              />
            ) : (
              <div
                className="absolute inset-y-0 right-1/2 h-4 rounded-l-[4px]"
                style={{ width: `${(Math.abs(d.valor) / maxAbs / 2) * 100}%`, background: "var(--negative)" }}
              />
            )}
          </div>
          <span className="tabular-nums text-[var(--foreground)]">{d.valor > 0 ? `+${d.valor}` : d.valor}</span>
        </div>
      ))}
    </div>
  );
}
