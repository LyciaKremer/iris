"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  { href: "/importar", label: "Importar" },
  { href: "/revisar", label: "Revisar" },
  { href: "/exportar", label: "Exportar" },
  { href: "/relatorio", label: "Relatório" },
  { href: "/auditoria", label: "Auditoria" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-4 text-sm">
      <Link href="/" className="font-semibold">
        Iris
      </Link>
      {ITENS.map((item) => {
        const ativo = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo ? "page" : undefined}
            className={
              ativo
                ? "font-medium text-[var(--foreground)] underline decoration-[var(--primary)] decoration-2 underline-offset-4"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
