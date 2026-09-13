import { requireUser } from "@/lib/dal";
import { logoutAction } from "@/server/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Nav } from "./nav";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-full">
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Nav />
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
