"use client";

import { useEffect, useState } from "react";

export function VoltarAoTopo() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    function aoRolar() {
      setVisivel(window.scrollY > 400);
    }
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  if (!visivel) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Voltar ao topo"
      className="fixed bottom-6 left-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-lg shadow-lg"
    >
      ↑
    </button>
  );
}
