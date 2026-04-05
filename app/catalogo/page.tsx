import Link from "next/link";
import { redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { CourseCard } from "@/app/components/course-card";
import { PublicCourseCatalog } from "@/app/components/public-course-catalog";
import { PublicTopbar } from "@/app/components/public-topbar";
import { Button, LinkButton } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { logger } from "@/lib/logger";
import { getSiteForceLogin } from "@/lib/moodle-brand";
import {
  getPublicCatalogCoursesWithServerToken,
  getUserCourses,
  hasPublicCourseCatalogAccess,
  isAuthenticationError,
  searchCourses,
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

  let publicCourses: Awaited<ReturnType<typeof getPublicCatalogCoursesWithServerToken>> = [];
  let courses: Awaited<ReturnType<typeof searchCourses>> = [];
  let enrolledCourseIds = new Set<number>();
  let errorMessage: string | null = null;

  if (session && query) {
    try {
      const [searchResults, userCourses] = await Promise.all([
        searchCourses(session.token, query),
        getUserCourses(session.token, session.userId),
      ]);

      courses = searchResults;
      enrolledCourseIds = new Set(userCourses.map((c) => c.id));
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
  } else if (!session) {
    if (publicCatalogEnabled) {
      try {
        publicCourses = await getPublicCatalogCoursesWithServerToken();
      } catch (error) {
        if (isAuthenticationError(error)) {
          errorMessage = "El catálogo público no está disponible en esta instalación.";
        } else {
          logger.error("Public catalog load failed", { error });
          errorMessage = "No se pudieron cargar los cursos disponibles ahora mismo.";
        }
      }
    } else {
      errorMessage = "El catálogo público no está disponible en esta instalación.";
    }
  }

  if (!session) {
    return (
      <div className="flex min-h-svh flex-col bg-[var(--background)]">
        <PublicTopbar />

        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-5 py-8 md:px-8 md:py-10">
          {errorMessage ? (
            <div className="banner-danger">{errorMessage}</div>
          ) : null}

          {!errorMessage ? (
            <PublicCourseCatalog courses={publicCourses} initialQuery={query} pageSize={12} />
          ) : null}
        </main>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-1 px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          breadcrumbs={[{ label: "Catálogo" }]}
        />

        <div className="animate-rise-in">
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            Catálogo de cursos
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Busca cursos disponibles e inscríbete.
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
          <Button type="submit" className="h-11">
            Buscar
          </Button>
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
                  <CourseCard
                    key={course.id}
                    course={course}
                    animationDelay={index * 70}
                    action={
                      isEnrolled ? (
                        <span className="chip chip-accent">Inscrito</span>
                      ) : (
                        <Link href={`/catalogo/inscribir?courseId=${course.id}`}>
                          <Button size="sm" className="w-full">Inscribirse</Button>
                        </Link>
                      )
                    }
                  />
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
