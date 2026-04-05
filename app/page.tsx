import { redirect } from "next/navigation";
import { BrandLogo } from "@/app/components/brand-logo";
import { LoginForm } from "@/app/components/login-form";
import { RichHtml } from "@/app/components/rich-html";
import { Button, LinkButton } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { logger } from "@/lib/logger";
import { getSiteForceLogin } from "@/lib/moodle-brand";
import {
  hasPublicCourseCatalogAccess,
  searchCoursesWithServerToken,
} from "@/lib/moodle";
import { getSession } from "@/lib/session";

type HomeProps = {
  searchParams: Promise<{
    q?: string;
    reason?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const session = await getSession();

  if (session) {
    redirect("/mis-cursos");
  }

  const [{ q, reason }, forceLogin] = await Promise.all([
    searchParams,
    getSiteForceLogin(),
  ]);

  const sessionExpired = reason === "session-expired";

  // Moodle has forcelogin enabled — show only the login form
  if (forceLogin) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-[var(--background)] px-5 py-10">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center gap-4">
            <BrandLogo priority size="lg" />
          </div>

          <div className="surface-card rounded-2xl px-6 py-7">
            <div className="mb-6 space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
                Inicia sesión
              </h1>
              <p className="text-sm text-[var(--muted)]">
                Esta plataforma requiere autenticación para acceder.
              </p>
            </div>

            <LoginForm sessionExpired={sessionExpired} />
          </div>
        </div>
      </main>
    );
  }

  // Moodle does not force login — show the public catalog
  const query = q?.trim() || "";
  const publicCatalogEnabled = hasPublicCourseCatalogAccess();
  let courses = [] as Awaited<ReturnType<typeof searchCoursesWithServerToken>>;
  let errorMessage: string | null = null;

  if (query && publicCatalogEnabled) {
    try {
      courses = await searchCoursesWithServerToken(query);
    } catch (error) {
      logger.error("Public catalog search failed", { query, error });
      errorMessage = "No se pudieron cargar los cursos disponibles ahora mismo.";
    }
  } else if (query && !publicCatalogEnabled) {
    errorMessage = "El catálogo público no está disponible en esta instalación.";
  }

  return (
    <div className="flex min-h-svh flex-col bg-[var(--background)]">
      {/* Public topbar — matches AppTopbar layout without auth */}
      <header className="topbar-panel sticky top-0 z-10 px-5 md:px-8">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4">
          <BrandLogo priority compact />
          <nav className="flex flex-1 items-center gap-5 text-sm">
            <LinkButton href="/catalogo" variant="ghost" size="sm">
              Catálogo
            </LinkButton>
          </nav>
          <LinkButton href="#login" variant="primary" size="sm">
            Entrar
          </LinkButton>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-5 py-8 md:px-8 md:py-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_360px]">
          {/* Left: search + catalog preview */}
          <section className="animate-rise-in flex flex-col gap-6">
            <div className="space-y-3">
              <span className="chip chip-muted">Acceso abierto</span>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] md:text-4xl">
                Explora cursos antes de iniciar sesión.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
                Busca la oferta formativa, revisa descripciones y entra cuando
                necesites tu espacio personal.
              </p>
            </div>

            <form action="/" method="GET" className="flex flex-col gap-3 sm:flex-row">
              <Input
                type="search"
                name="q"
                placeholder="Buscar cursos, áreas o palabras clave..."
                defaultValue={query}
                className="h-11 flex-1"
              />
              <Button type="submit" variant="primary" className="sm:min-w-28">
                Buscar
              </Button>
            </form>

            {errorMessage ? (
              <div className="banner-danger">{errorMessage}</div>
            ) : null}

            {query && !errorMessage ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      Resultados para &ldquo;{query}&rdquo;
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      {courses.length > 0
                        ? `${courses.length} cursos encontrados`
                        : "Sin coincidencias por ahora"}
                    </p>
                  </div>
                  <LinkButton
                    href={`/catalogo?q=${encodeURIComponent(query)}`}
                    variant="outline"
                    size="sm"
                  >
                    Abrir catálogo
                  </LinkButton>
                </div>

                {courses.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {courses.slice(0, 4).map((course) => (
                      <Card key={course.id}>
                        <CardContent className="flex h-full flex-col gap-3 p-5">
                          <div className="space-y-1">
                            {course.shortname &&
                            course.shortname !== course.fullname ? (
                              <p className="text-xs text-[var(--muted)]">
                                {course.shortname}
                              </p>
                            ) : null}
                            <h2 className="text-base font-semibold leading-snug text-[var(--foreground)]">
                              {course.fullname}
                            </h2>
                            {course.categoryName ? (
                              <p className="text-xs text-[var(--muted)]">
                                {course.categoryName}
                              </p>
                            ) : null}
                          </div>

                          {course.summary ? (
                            <RichHtml
                              html={course.summary}
                              className="line-clamp-3 text-sm leading-6 text-[var(--muted)]"
                            />
                          ) : null}

                          <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                            <p className="text-xs text-[var(--muted)]">
                              {course.enrolledUsersCount} inscritos
                            </p>
                            <LinkButton
                              href={`/catalogo?q=${encodeURIComponent(query)}`}
                              variant="outline"
                              size="sm"
                            >
                              Ver detalle
                            </LinkButton>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-[var(--line)] px-4 py-8 text-center text-sm text-[var(--muted)]">
                    Prueba con otro término o entra al catálogo completo para
                    ampliar la búsqueda.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  {
                    title: "Catálogo primero",
                    body: "Explora cursos antes de que la plataforma te pida credenciales.",
                  },
                  {
                    title: "Entrada adaptativa",
                    body: "Al iniciar sesión, la app muestra docencia, edición o gestión según tus permisos reales.",
                  },
                  {
                    title: "Sin callejones sin salida",
                    body: "Los accesos de navegación se ajustan a lo que Moodle permite para cada cuenta.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5"
                  >
                    <h2 className="text-sm font-semibold text-[var(--foreground)]">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Right: login form */}
          <aside
            id="login"
            className="animate-rise-in rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-6 py-7"
            style={{ animationDelay: "80ms" }}
          >
            <div className="mb-6 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Acceso personal
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
                Inicia sesión
              </h2>
              <p className="text-sm leading-6 text-[var(--muted)]">
                Entra para ver tu portada adaptativa, mensajes, calendario y
                accesos del rol que Moodle te conceda.
              </p>
            </div>

            <LoginForm sessionExpired={sessionExpired} />
          </aside>
        </div>
      </main>
    </div>
  );
}
