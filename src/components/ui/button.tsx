import { forwardRef } from "react";
import { RainbowLoader } from "@/components/rainbow-loader";

export type ButtonVariant = "solid" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md";

/**
 * Botão único pro app inteiro — antes cada tela reescrevia
 * padding/altura/tamanho de fonte à mão (px-2/px-2.5/px-3/px-4 com
 * py-1/py-1.5/py-2 em combinações diferentes), o que fazia botões do
 * mesmo peso visual renderizarem com alturas ligeiramente diferentes
 * entre telas. Duas escalas só: "md" (padrão, ações primárias de tela) e
 * "sm" (ação secundária dentro de uma linha/card, ex: "Editar").
 *
 * `cursor: pointer` já vem de uma regra global (globals.css), mas fica
 * redundante aqui de propósito — o componente não deve depender de uma
 * regra externa pra se comportar como botão.
 */
const BASE =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium " +
  "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
};

const VARIANTS: Record<ButtonVariant, string> = {
  solid: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90",
  outline: "border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]",
  ghost: "text-[var(--foreground)] hover:bg-[var(--muted)]",
  destructive: "bg-[var(--negative)] text-white hover:opacity-90",
};

/** Mesmas classes do <Button>, pra um elemento que precisa ter CARA de
 * botão mas não pode ser um <button> de verdade — hoje só o caso de
 * "Abrir mídia" (um link, `<a>`, que abre em nova aba). Nunca use isso
 * pra fugir de um <button> real num clique comum — Button de propósito
 * não aceita `asChild`, exatamente pra não normalizar esse desvio. */
export function buttonVariants(variant: ButtonVariant = "outline", size: ButtonSize = "sm"): string {
  return `${BASE} ${SIZES[size]} ${VARIANTS[variant]}`;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Troca o conteúdo por um spinner + o próprio texto (passe o texto de
   * "carregando" em `children` condicionalmente, como já era feito antes)
   * e desabilita o botão — mesmo padrão que toda tela já seguia à mão. */
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "solid", size = "md", loading = false, disabled, className = "", children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`${BASE} ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading && <RainbowLoader size={size === "sm" ? 12 : 14} />}
      {children}
    </button>
  );
});
