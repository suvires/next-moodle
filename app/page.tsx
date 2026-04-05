import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/app/components/brand-logo";
import { LoginForm } from "@/app/components/login-form";
import { RichHtml } from "@/app/components/rich-html";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { logger } from "@/lib/logger";
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

  const { q, reason } = await searchParams;
  const query = q?.trim() || "";
  const sessionExpired = reason === "session-expired";
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
    <main className="min-h-svh bg-[radial-gradient(circle_at_top_left,_rgba(240,173,78,0.18),_transparent_38%),linear-gradient(180deg,_var(--surface-strong)_0%,_transparent_32%)] px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-[var(--line)] bg-[var(--surface)]/95 px-6 py-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <BrandLogo priority size="lg" />
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/catalogo">Ver catálogo</Link>
            </Button>
            <Button asChild>
              <a href="#login">Entrar</a>
            </Button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_380px]">
          <section className="space-y-6 rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] px-6 py-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="space-y-4">
              <span className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Acceso abierto
              </span>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-[var(--foreground)] md:text-5xl">
                  Explora cursos antes de iniciar sesión.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[var(--muted)]">
                  La portada ya no te fuerza a autenticarte. Puedes buscar la
                  oferta formativa, revisar descripciones y entrar cuando
                  necesites tu espacio personal.
                </p>
              </div>
            </div>

            <form action="/" method="GET" className="flex flex-col gap-3 sm:flex-row">
              <Input
                type="search"
                name="q"
                placeholder="Buscar cursos, áreas o palabras clave..."
                defaultValue={query}
                className="h-12 flex-1 rounded-full px-5"
              />
              <Button type="submit" size="lg" className="sm:min-w-36">
                Buscar
              </Button>
            </form>

            {errorMessage ? (
              <div className="rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-3 text-sm text-[var(--danger)]">
                {errorMessage}
              </div>
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
                  <Button variant="outline" asChild>
                    <Link href={`/catalogo?q=${encodeURIComponent(query)}`}>
                      Abrir catálogo
                    </Link>
                  </Button>
                </div>

                {courses.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {courses.slice(0, 4).map((course) => (
                      <Card key={course.id} className="border-[var(--line)] bg-[var(--surface-strong)]">
                        <CardContent className="flex h-full flex-col gap-3 p-5">
                          <div className="space-y-1">
                            {course.shortname &&
                            course.shortname !== course.fullname ? (
                              <p className="text-xs text-[var(--muted)]">
                                {course.shortname}
                              </p>
                            ) : null}
                            <h2 className="text-lg font-semibold leading-snug text-[var(--foreground)]">
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
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/catalogo?q=${encodeURIComponent(query)}`}>
                                Ver detalle
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-8 text-center text-sm text-[var(--muted)]">
                    Prueba con otro término o entra al catálogo completo para
                    ampliar la búsqueda.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: "Catálogo primero",
                    body: "La portada pública prioriza explorar cursos antes de pedir credenciales.",
                  },
                  {
                    title: "Entrada adaptativa",
                    body: "Cuando inicias sesión, la app decide si mostrarte docencia, edición o gestión según permisos reales.",
                  },
                  {
                    title: "Sin callejones sin salida",
                    body: "Los accesos de navegación se ajustan a lo que Moodle realmente permite para cada cuenta.",
                  },
                ].map((item) => (
                  <Card key={item.title} className="border-[var(--line)] bg-[var(--surface-strong)]">
                    <CardContent className="space-y-2 p-5">
                      <h2 className="text-base font-semibold text-[var(--foreground)]">
                        {item.title}
                      </h2>
                      <p className="text-sm leading-6 text-[var(--muted)]">
                        {item.body}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <aside
            id="login"
            className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] px-6 py-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
          >
            <div className="mb-6 space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
                Acceso personal
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
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
      </div>
    </main>
  );
}
