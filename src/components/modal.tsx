"use client";

import { useEffect } from "react";

/** Overlay + card genérico — mesmo padrão visual já usado em
 * checklist-flutuante.tsx (ESC fecha, clique fora fecha, clique dentro
 * não propaga), extraído aqui pra ser reaproveitado por qualquer modal. */
export function Modal({
  titulo,
  onClose,
  children,
  largura = "max-w-lg",
}: {
  titulo: string;
  onClose: () => void;
  children: React.ReactNode;
  largura?: string;
}) {
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${largura} max-h-[85vh] overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--card)] p-5`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{titulo}</h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-sm text-[var(--muted-foreground)]"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
