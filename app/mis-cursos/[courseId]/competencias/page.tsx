import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { RichHtml } from "@/app/components/rich-html";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { logger } from "@/lib/logger";
import { getCoursCompetencies, getUserCompetencyInCourse, getUserCourses, isAuthenticationError } from "@/lib/moodle";
import { getSession } from "@/lib/session";

type CompetenciasPageProps = {
  params: Promise<{
    courseId: string;
  }>;
};

export default async function CompetenciasPage({ params }: CompetenciasPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const { courseId } = await params;
  const parsedCourseId = Number(courseId);

  if (!Number.isInteger(parsedCourseId) || parsedCourseId <= 0) {
    notFound();
  }

  let courses = [] as Awaited<ReturnType<typeof getUserCourses>>;
  let competencies = [] as Awaited<ReturnType<typeof getCoursCompetencies>>;
  let statuses = new Map<number, { proficient: boolean; grade?: number }>();
  let errorMessage: string | null = null;
  let expiredSession = false;

  try {
    const [coursesResult, competenciesResult] = await Promise.all([
      getUserCourses(session.token, session.userId),
      getCoursCompetencies(session.token, parsedCourseId),
    ]);

    courses = coursesResult;
    competencies = competenciesResult;

    // Fetch user status for each competency
    const statusResults = await Promise.allSettled(
      competencies.map((c) =>
        getUserCompetencyInCourse(session.token, parsedCourseId, session.userId, c.id)
      )
    );

    for (const result of statusResults) {
      if (result.status === "fulfilled") {
        statuses.set(result.value.competencyId, {
          proficient: result.value.proficient,
          grade: result.value.grade,
        });
      }
    }
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Competencies page load failed", {
      userId: session.userId,
      courseId: parsedCourseId,
      error,
    });
    errorMessage = "No se pudieron cargar las competencias del curso.";
  }

  const course = courses.find((item) => item.id === parsedCourseId);

  if (!course && !errorMessage) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-1 px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          sectionLabel="Competencias"
          actions={
            <div className="flex items-center gap-3 text-sm">
              <Link
                href={`/mis-cursos/${parsedCourseId}`}
                className="text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
              >
                Volver al curso
              </Link>
            </div>
          }
        />

        <div className="animate-rise-in">
          <Link
            href={`/mis-cursos/${parsedCourseId}`}
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
          >
            &larr; Volver al curso
          </Link>

          <h1 className="mt-3 text-2xl font-semibold text-[var(--color-foreground)]">
            Competencias
          </h1>

          {course ? (
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {course.fullname}
            </p>
          ) : null}
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            <p className="font-semibold">
              {expiredSession
                ? "La sesión ya no es válida."
                : "No se pudieron cargar las competencias."}
            </p>
            <p className="mt-1 opacity-80">{errorMessage}</p>
          </div>
        ) : null}

        {competencies.length > 0 ? (
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              Competencias del curso ({competencies.length})
            </h2>

            {competencies.map((competency, index) => {
              const status = statuses.get(competency.id);
              const isProficient = status?.proficient ?? false;

              return (
                <Card
                  key={competency.id}
                  className="animate-rise-in rounded-xl"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <CardContent className="px-5 py-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--color-foreground)]">
                          {competency.shortName}
                        </p>

                        {competency.description ? (
                          <RichHtml
                            html={competency.description}
                            className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]"
                          />
                        ) : null}
                      </div>

                      <div className="shrink-0">
                        {isProficient ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Competente
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-[var(--color-foreground)]/5 px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
                            Pendiente
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </section>
        ) : !errorMessage ? (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            Este curso no tiene competencias asignadas.
          </p>
        ) : null}
      </div>
    </main>
  );
}
