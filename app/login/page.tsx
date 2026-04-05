import { redirect } from "next/navigation";
import { BrandLogo } from "@/app/components/brand-logo";
import { LoginForm } from "@/app/components/login-form";
import { LinkButton } from "@/app/components/ui/button";
import { getSiteForceLogin } from "@/lib/moodle-brand";
import { getSession } from "@/lib/session";

type LoginPageProps = {
  searchParams: Promise<{
    reason?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [session, { reason }, forceLogin] = await Promise.all([
    getSession(),
    searchParams,
    getSiteForceLogin(),
  ]);

  if (session) {
    redirect("/mis-cursos");
  }

  const sessionExpired = reason === "session-expired";

  return (
    <main className="flex min-h-svh items-center justify-center bg-[var(--background)] px-5 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <BrandLogo priority size="xl" />
        </div>

        <div className="surface-card rounded-2xl px-6 py-7">
          <div className="mb-6 space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Inicia sesión
            </h1>
            {forceLogin && (
              <p className="text-sm text-[var(--muted)]">
                Esta plataforma requiere autenticación para acceder.
              </p>
            )}
          </div>

          <LoginForm sessionExpired={sessionExpired} />
        </div>

        {!forceLogin && (
          <div className="flex justify-center">
            <LinkButton href="/" variant="ghost" size="sm">
              Volver
            </LinkButton>
          </div>
        )}
      </div>
    </main>
  );
}
