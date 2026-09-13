import { redirect } from "next/navigation";
import { getUser } from "@/lib/dal";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (user) redirect("/");

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
