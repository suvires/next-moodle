import { redirect } from "next/navigation";
import { BrandLogo } from "@/app/components/brand-logo";
import { LoginForm } from "@/app/components/login-form";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { getSession } from "@/lib/session";

type HomeProps = {
  searchParams: Promise<{
    reason?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const session = await getSession();

  if (session) {
    redirect("/mis-cursos");
  }

  const { reason } = await searchParams;
  const sessionExpired = reason === "session-expired";

  return (
    <main className="grain-overlay relative flex min-h-screen flex-1 items-center justify-center overflow-x-hidden px-5 py-10 md:px-8">
      <div className="ambient-orb ambient-orb-blue left-[-6rem] top-[8%] h-56 w-56 md:h-80 md:w-80" />
      <div className="ambient-orb ambient-orb-white right-[-4rem] top-[8%] h-52 w-52 md:h-72 md:w-72" />
      <div className="ambient-orb ambient-orb-blue bottom-[-7rem] right-[10%] h-64 w-64 md:h-96 md:w-96" />

      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_minmax(0,460px)] lg:items-center">
        <section className="animate-rise-in hidden lg:block">
          <div className="hero-panel surface-card rounded-[2.2rem] border border-white/8 px-8 py-9 xl:px-10 xl:py-10">
            <div className="relative z-10 flex max-w-xl flex-col gap-8">
              <BrandLogo priority />
              <div className="space-y-4">
                <p className="text-[0.72rem] font-semibold tracking-[0.28em] text-[var(--color-accent-soft)] uppercase">
                  Plataforma académica
                </p>
                <h1 className="display-face text-balance text-6xl leading-[0.92] text-[var(--color-foreground)] xl:text-7xl">
                  Un acceso serio, claro y listo para trabajar.
                </h1>
                <p className="max-w-lg text-base leading-8 text-[var(--color-muted)]">
                  Cursos, recursos, foros y contenidos SCORM dentro de una experiencia más limpia,
                  más rápida y visualmente profesional.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="metric-chip rounded-[1rem] px-4 py-3">
                  <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-[var(--color-accent-soft)] uppercase">
                    Acceso
                  </p>
                  <p className="mt-2 text-sm text-[var(--color-foreground)]">
                    Usuario o email
                  </p>
                </div>
                <div className="metric-chip rounded-[1rem] px-4 py-3">
                  <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-[var(--color-accent-soft)] uppercase">
                    Integración
                  </p>
                  <p className="mt-2 text-sm text-[var(--color-foreground)]">Conectada por API</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Card className="animate-rise-in relative w-full rounded-[2.2rem]">
          <CardContent className="px-6 py-7 md:px-8 md:py-8">
            <div className="flex items-center justify-between">
              <BrandLogo compact className="border-transparent bg-transparent px-0 py-0 hover:bg-transparent" />
              <span className="metric-chip rounded-full px-3 py-1 text-[0.66rem] font-semibold tracking-[0.22em] text-[var(--color-accent-soft)] uppercase">
                Acceso
              </span>
            </div>

            <div className="mt-10 space-y-3">
              <h1 className="display-face text-5xl leading-none text-[var(--color-foreground)] md:text-6xl">
                Inicia sesión
              </h1>
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                Entra en tu campus con tu usuario o, si Moodle lo admite en este flujo, también con tu email.
              </p>
            </div>

            <Separator className="my-8" />

            <LoginForm sessionExpired={sessionExpired} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
