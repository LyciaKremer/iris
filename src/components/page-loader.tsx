/**
 * Loader "grande" — pra troca de tela (Next.js loading.tsx), não pra dentro
 * de botão (isso continua sendo o RainbowLoader simples, rainbow-loader.tsx).
 * Ideia da usuária desde 13/09: uma "cartinha" voando deixando um rastro
 * arco-íris, inspirada no estilo de animação SVG em linha fina do CodePen
 * "Delivery Truck Loading" (codepen.io/jkantner/pen/yLWXOXd) — o traço fica
 * aqui, as cores são as mesmas do RainbowLoader (mesmo gradiente).
 *
 * Técnica: um <path> (a mesma curva usada no offset-path do envelope) é
 * "desenhado" via stroke-dashoffset enquanto o envelope viaja por cima dele
 * via CSS motion path (offset-path/offset-distance) — sem JS, sem depender
 * do tamanho real do path (stroke-dasharray generoso cobre a curva inteira).
 */
const CAMINHO = "M 4,40 C 44,10 84,70 120,40 S 176,10 196,40";

export function PageLoader({ mensagem = "Carregando…" }: { mensagem?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <div className="iris-mail relative" style={{ width: 200, height: 80 }}>
        <svg viewBox="0 0 200 80" width={200} height={80} className="absolute inset-0" aria-hidden>
          <defs>
            <linearGradient id="iris-mail-gradiente" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ff3b6b" />
              <stop offset="20%" stopColor="#ff9f43" />
              <stop offset="40%" stopColor="#ffd93d" />
              <stop offset="60%" stopColor="#4ade80" />
              <stop offset="80%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
          <path
            d={CAMINHO}
            fill="none"
            stroke="url(#iris-mail-gradiente)"
            strokeWidth={3}
            strokeLinecap="round"
            className="iris-mail__rastro"
          />
        </svg>

        <div className="iris-mail__envelope text-[var(--foreground)]" style={{ offsetPath: `path("${CAMINHO}")` }}>
          <svg viewBox="0 0 24 16" width={28} height={19} fill="none" aria-hidden>
            <rect x="1" y="1" width="22" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M1.5 2 12 10 22.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <p className="text-sm text-[var(--muted-foreground)]">{mensagem}</p>
    </div>
  );
}
