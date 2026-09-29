"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [montado, setMontado] = useState(false);

  // Evita mismatch de hidratação: só sabe o tema real depois de montar no cliente.
  useEffect(() => setMontado(true), []);

  if (!montado) return <div className="h-8 w-9" />;

  const escuro = resolvedTheme === "dark";

  return (
    <Button
      onClick={() => setTheme(escuro ? "light" : "dark")}
      aria-label={escuro ? "Ativar modo claro" : "Ativar modo escuro"}
      variant="outline"
      size="sm"
      className="w-9 px-0"
    >
      {escuro ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
