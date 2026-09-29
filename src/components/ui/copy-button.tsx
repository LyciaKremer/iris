"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";

/** Botão de copiar genérico — mostra um check por 1.5s após copiar, pra
 * confirmar visualmente sem precisar de toast em toda tela que usa. */
export function CopyButton({
  texto,
  variant = "outline",
  size = "sm",
  className = "",
  children = "Copiar",
}: {
  texto: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children?: React.ReactNode;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      toast.error("Não consegui copiar — copie manualmente.");
    }
  }

  return (
    <Button onClick={copiar} variant={variant} size={size} className={`shrink-0 ${className}`}>
      {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copiado ? "Copiado!" : children}
    </Button>
  );
}
