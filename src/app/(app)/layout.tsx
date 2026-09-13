import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { logoutAction } from "@/server/auth";
import { ThemeToggle } from "@/components/theme-toggle";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-full">
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className="font-semibold">
              Iris
            </Link>
            <Link href="/importar" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              Importar
            </Link>
            <Link href="/revisar" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              Revisar
            </Link>
            <Link href="/exportar" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              Exportar
            </Link>
          </nav>
          <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
            <span>{user.email}</span>
            <ThemeToggle />
            <form action={logoutAction}>
              <button type="submit" className="hover:text-[var(--foreground)]">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}
