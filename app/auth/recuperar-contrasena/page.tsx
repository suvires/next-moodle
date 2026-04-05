import { ForgotPasswordForm } from "@/app/components/forgot-password-form";

export default function RecuperarContrasenaPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="surface-card w-full max-w-sm p-8">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-xl font-bold text-[var(--color-foreground)]">
            Recuperar contraseña
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Te enviaremos un email de Moodle para restablecer tu contraseña.
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
