import { forwardRef } from "react";

/**
 * Campo de texto único pro app inteiro — mesma motivação do Button
 * (button.tsx): altura e padding vinham inconsistentes tela a tela (h-9
 * explícito em algumas, implícito via py-1/py-2 em outras, o que rende
 * alturas diferentes por causa do line-height). Toda entrada de uma linha
 * (texto, data, número) usa a MESMA altura (h-9) — Select segue junto,
 * pra um formulário com os dois lado a lado não ficar desalinhado.
 *
 * Sem largura/padding aqui de propósito: Tailwind não garante que a
 * última classe passada "ganha" quando duas classes mexem na mesma
 * propriedade (ex: w-full de um lado, w-32 do outro) — quem decide isso é
 * a ordem em que as classes foram geradas no build, não a ordem no
 * `className`. Cada variante abaixo declara a própria largura/padding uma
 * vez só, sem nenhuma outra classe do componente disputando a mesma
 * propriedade.
 */
const CAMPO_BASE =
  "rounded-md border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--foreground)] " +
  "placeholder:text-[var(--muted-foreground)] transition-colors " +
  "focus:outline-none focus:ring-2 focus:ring-[var(--ring)] " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...props }, ref) {
    return <input ref={ref} className={`h-9 w-full px-3 ${CAMPO_BASE} ${className}`} {...props} />;
  },
);

/**
 * Select com seta própria — o navegador desenha a seta nativa colada na
 * borda direita, ignorando qualquer padding que a gente dê (por isso
 * ficava com a seta grudada, sem respiro). `appearance-none` tira a seta
 * nativa e desenhamos uma por cima (ícone com `pointer-events-none`,
 * clique continua indo pro <select> por baixo).
 *
 * `className` controla a largura do CONTAINER (não do <select> em si, que
 * sempre preenche 100% dele) — assim `className="w-auto"`/`"w-32"` fazem
 * o efeito esperado sem competir com o w-full interno do campo.
 */
export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = "", ...props }, ref) {
    return (
      <div className={`relative ${className}`}>
        <select
          ref={ref}
          className={`h-9 w-full cursor-pointer appearance-none pl-3 pr-8 ${CAMPO_BASE}`}
          {...props}
        />
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]"
        >
          <path
            d="M5.5 7.5l4.5 4.5 4.5-4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = "", ...props }, ref) {
    return <textarea ref={ref} className={`w-full px-3 py-2 ${CAMPO_BASE} ${className}`} {...props} />;
  },
);
