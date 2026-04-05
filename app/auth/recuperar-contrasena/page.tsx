import { BrandLogo } from "@/app/components/brand-logo";
import { ForgotPasswordForm } from "@/app/components/forgot-password-form";
import { LinkButton } from "@/app/components/ui/button";

export default function RecuperarContrasenaPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[var(--background)] px-5 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <BrandLogo priority size="xl" />
        </div>

        <div className="surface-card rounded-2xl px-6 py-7">
          <div className="mb-4 space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Recuperar contraseña
            </h1>
            <p className="text-sm text-[var(--muted)]">
              Te enviaremos un email para restablecer tu contraseña.
            </p>
          </div>

          <ForgotPasswordForm />
        </div>

        <div className="flex justify-center">
          <LinkButton href="/login" variant="ghost" size="sm">
            Volver al inicio de sesión
          </LinkButton>
        </div>
      </div>
    </main>
  );
}
