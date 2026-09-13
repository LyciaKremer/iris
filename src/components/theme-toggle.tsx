"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [montado, setMontado] = useState(false);

  // Evita mismatch de hidratação: só sabe o tema real depois de montar no cliente.
  useEffect(() => setMontado(true), []);

  if (!montado) return <div className="h-8 w-8" />;

  const escuro = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(escuro ? "light" : "dark")}
      aria-label={escuro ? "Ativar modo claro" : "Ativar modo escuro"}
      className="rounded-md border border-[var(--border)] px-2 py-1 text-sm"
    >
      {escuro ? "☀️" : "🌙"}
    </button>
  );
}
