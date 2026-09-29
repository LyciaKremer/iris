import { forwardRef } from "react";

/**
 * Campo de texto único pro app inteiro — mesma motivação do Button
 * (button.tsx): altura e padding vinham inconsistentes tela a tela (h-9
 * explícito em algumas, implícito via py-1/py-2 em outras, o que rende
 * alturas diferentes por causa do line-height). Toda entrada de uma linha
 * (texto, data, número) usa a MESMA altura (h-9) — Select segue junto,
 * pra um formulário com os dois lado a lado não ficar desalinhado.
 */
const CAMPO_BASE =
  "w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] " +
  "placeholder:text-[var(--muted-foreground)] transition-colors " +
  "focus:outline-none focus:ring-2 focus:ring-[var(--ring)] " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...props }, ref) {
    return <input ref={ref} className={`h-9 ${CAMPO_BASE} ${className}`} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = "", ...props }, ref) {
    return <select ref={ref} className={`h-9 cursor-pointer ${CAMPO_BASE} ${className}`} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = "", ...props }, ref) {
    return <textarea ref={ref} className={`py-2 ${CAMPO_BASE} ${className}`} {...props} />;
  },
);
