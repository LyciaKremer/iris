import { LoginForm } from "./login-form";

export default function EntrarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Iris</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Entre para continuar.</p>
      </div>
      <LoginForm />
    </div>
  );
}
