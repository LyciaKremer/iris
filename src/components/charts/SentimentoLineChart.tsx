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

/**
 * SVG embutido direto na árvore React (não string via dangerouslySetInnerHTML)
 * — herda font-family/cor do resto da página normalmente, o que a versão
 * antiga (string de SVG gerada no servidor com fonte fixa) não fazia.
 */
export function SentimentoLineChart({
  eixoX,
  positivo,
  negativo,
  neutro,
}: {
  eixoX: string[];
  positivo: number[];
  negativo: number[];
  neutro: number[];
}) {
  if (eixoX.length === 0) {
    return <p className="text-sm italic text-[var(--muted-foreground)]">Nenhum registro no período.</p>;
  }

  const largura = 700;
  const altura = 220;
  const margemEsquerda = 8;
  const margemDireita = 8;
  const topo = 8;
  const base = altura - 24;
  const larguraGrafico = largura - margemEsquerda - margemDireita;
  const maxValor = Math.max(1, ...positivo, ...negativo, ...neutro);
  const passoX = eixoX.length > 1 ? larguraGrafico / (eixoX.length - 1) : 0;

  const linha = (valores: number[]) =>
    valores
      .map((v, i) => {
        const x = margemEsquerda + i * passoX;
        const y = base - (v / maxValor) * (base - topo);
        return `${x},${y}`;
      })
      .join(" ");

  const passoRotulo = eixoX.length > 8 ? Math.ceil(eixoX.length / 8) : 1;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
        {(["negativo", "neutro", "positivo"] as const).map((chave) => (
          <span key={chave} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: CORES[chave] }} />
            {ROTULOS[chave]}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${largura} ${altura}`} className="w-full text-[var(--muted-foreground)]" role="img">
        <line x1={margemEsquerda} y1={base} x2={largura - margemDireita} y2={base} stroke="var(--border)" />
        {(["negativo", "neutro", "positivo"] as const).map((chave) => {
          const valores = { negativo, neutro, positivo }[chave];
          return (
            <polyline key={chave} points={linha(valores)} fill="none" stroke={CORES[chave]} strokeWidth={2} />
          );
        })}
        {eixoX.map((rotulo, i) => {
          if (i % passoRotulo !== 0) return null;
          const x = margemEsquerda + i * passoX;
          return (
            <text key={rotulo} x={x} y={altura - 6} fontSize={10} textAnchor="middle" fill="currentColor">
              {rotulo.slice(5)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
