import Link from "next/link";
import { redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { BrandLogo } from "@/app/components/brand-logo";
import { RichHtml } from "@/app/components/rich-html";
import { Button, LinkButton } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Separator } from "@/app/components/ui/separator";
import { logger } from "@/lib/logger";
import { getSiteForceLogin } from "@/lib/moodle-brand";
import {
  getUserCourses,
  hasPublicCourseCatalogAccess,
  isAuthenticationError,
  searchCourses,
  searchCoursesWithServerToken,
} from "@/lib/moodle";
import { getSession } from "@/lib/session";

type CatalogoPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function CatalogoPage({ searchParams }: CatalogoPageProps) {
  const [session, { q }, forceLogin] = await Promise.all([
    getSession(),
    searchParams,
    getSiteForceLogin(),
  ]);

  if (forceLogin && !session) {
    redirect("/");
  }

  const query = q?.trim() || "";
  const publicCatalogEnabled = hasPublicCourseCatalogAccess();

  let courses: Awaited<ReturnType<typeof searchCoursesWithServerToken>> = [];
  let enrolledCourseIds = new Set<number>();
  let errorMessage: string | null = null;

  if (query) {
    try {
      if (session) {
        const [searchResults, userCourses] = await Promise.all([
          searchCourses(session.token, query),
          getUserCourses(session.token, session.userId),
        ]);

        courses = searchResults;
        enrolledCourseIds = new Set(userCourses.map((c) => c.id));
      } else if (publicCatalogEnabled) {
        courses = await searchCoursesWithServerToken(query);
      } else {
        errorMessage = "El catálogo público no está disponible en esta instalación.";
      }
    } catch (error) {
      if (session && isAuthenticationError(error)) {
        errorMessage = "Tu sesión ha expirado. Inicia sesión de nuevo para continuar.";
      } else {
        logger.error("Course catalog search failed", {
          userId: session?.userId,
          query,
          error,
        });
        errorMessage = "No se pudieron buscar los cursos en este momento.";
      }
    }
  }

  return (
    <main className="flex min-h-screen flex-1 px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        {session ? (
          <AppTopbar
            fullName={session.fullName}
            userPictureUrl={session.userPictureUrl}
            breadcrumbs={[{ label: "Catálogo" }]}
          />
        ) : (
          <header className="flex flex-col gap-4 rounded-[1.75rem] border border-[var(--line)] bg-[var(--surface)] px-5 py-5 md:flex-row md:items-center md:justify-between">
            <BrandLogo priority compact={false} size="lg" />
            <div className="flex flex-wrap items-center gap-3">
              <LinkButton href="/" variant="ghost">Portada</LinkButton>
              <LinkButton href="/#login" variant="primary">Entrar</LinkButton>
            </div>
          </header>
        )}

        <div className="animate-rise-in">
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            Catálogo de cursos
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {session
              ? "Busca cursos disponibles e inscríbete."
              : "Explora la oferta formativa antes de autenticarte."}
          </p>
        </div>

        <form action="/catalogo" method="GET" className="flex gap-3">
          <Input
            type="search"
            name="q"
            placeholder="Buscar cursos..."
            defaultValue={query}
            className="flex-1"
          />
          <Button type="submit">Buscar</Button>
        </form>

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            <p>{errorMessage}</p>
          </div>
        ) : null}

        {query && !errorMessage ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {courses.length > 0 ? (
              courses.map((course, index) => {
                const isEnrolled = enrolledCourseIds.has(course.id);

                return (
                  <Card
                    key={course.id}
                    className="animate-rise-in rounded-xl transition duration-300"
                    style={{ animationDelay: `${index * 70}ms` }}
                  >
                    <CardContent className="flex h-full flex-col px-5 py-5">
                      {course.shortname && course.shortname !== course.fullname ? (
                        <p className="text-xs text-[var(--color-muted)]">
                          {course.shortname}
                        </p>
                      ) : null}

                      <h2 className="mt-1 text-base font-semibold leading-snug text-[var(--color-foreground)]">
                        {course.fullname}
                      </h2>

                      {course.categoryName ? (
                        <p className="mt-1 text-xs text-[var(--color-muted)]">
                          {course.categoryName}
                        </p>
                      ) : null}

                      <p className="mt-2 text-xs text-[var(--color-muted)]">
                        {course.enrolledUsersCount}{" "}
                        {course.enrolledUsersCount === 1
                          ? "estudiante inscrito"
                          : "estudiantes inscritos"}
                      </p>

                      {course.summary ? (
                        <>
                          <Separator className="my-4" />
                          <RichHtml
                            html={course.summary}
                            className="line-clamp-3 text-sm leading-relaxed text-[var(--color-muted)]"
                          />
                        </>
                      ) : null}

                      <div className="mt-auto pt-4">
                        {isEnrolled ? (
                          <span className="inline-block rounded-lg bg-[var(--color-accent)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-accent)]">
                            Inscrito
                          </span>
                        ) : session ? (
                          <Link href={`/catalogo/inscribir?courseId=${course.id}`}>
                            <Button size="sm" className="w-full">
                              Inscribirse
                            </Button>
                          </Link>
                        ) : (
                          <LinkButton href="/#login" size="sm" variant="outline" className="w-full">Inicia sesión para inscribirte</LinkButton>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <p className="col-span-full py-12 text-center text-sm text-[var(--color-muted)]">
                No se encontraron cursos para &ldquo;{query}&rdquo;.
              </p>
            )}
          </section>
        ) : !query && !errorMessage ? (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            Escribe un término de búsqueda para explorar los cursos disponibles.
          </p>
        ) : null}
      </div>
    </main>
  );
}
