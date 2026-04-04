import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ManualCompletionToggle } from "@/app/components/manual-completion-toggle";
import { AppTopbar } from "@/app/components/app-topbar";
import { ReactiveExternalLink } from "@/app/components/reactive-external-link";
import { RichHtml } from "@/app/components/rich-html";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { logger } from "@/lib/logger";
import {
  getCourseContents,
  getUserCourses,
  isAuthenticationError,
} from "@/lib/moodle";
import { getSession } from "@/lib/session";

type CourseDetailPageProps = {
  params: Promise<{
    courseId: string;
  }>;
};

function formatDate(value?: number) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value * 1000));
}

function getCompletionBadge(module: Awaited<ReturnType<typeof getCourseContents>>[number]["modules"][number]) {
  if (module.completionTracking === "none") {
    return null;
  }

  if (module.completionState === "complete-pass") {
    return { label: "Superada", tone: "success" as const };
  }

  if (module.completionState === "complete-fail") {
    return { label: "No superada", tone: "danger" as const };
  }

  if (module.completionState === "complete") {
    return { label: "Hecha", tone: "success" as const };
  }

  return { label: "Pendiente", tone: "muted" as const };
}

function getActionHref(courseId: number, module: Awaited<ReturnType<typeof getCourseContents>>[number]["modules"][number]) {
  if (!module.userVisible) {
    return null;
  }

  if (module.modname === "forum" && module.instance) {
    return `/foros/${module.instance}?courseId=${courseId}`;
  }

  if (module.modname === "resource") {
    return `/mis-cursos/${courseId}/recursos/${module.id}`;
  }

  if (module.modname === "scorm") {
    return `/mis-cursos/${courseId}/scorm/${module.id}`;
  }

  return module.url
    ? `/mis-cursos/${courseId}/modulos/${module.id}/abrir`
    : null;
}

export default async function CourseDetailPage({
  params,
}: CourseDetailPageProps) {
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
  let sections = [] as Awaited<ReturnType<typeof getCourseContents>>;
  let errorMessage: string | null = null;
  let expiredSession = false;

  try {
    [courses, sections] = await Promise.all([
      getUserCourses(session.token, session.userId),
      getCourseContents(session.token, parsedCourseId),
    ]);
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Course detail load failed", {
      userId: session.userId,
      courseId: parsedCourseId,
      error,
    });
    errorMessage = "No se pudo cargar el contenido del curso.";
  }

  const course = courses.find((item) => item.id === parsedCourseId);

  if (!course && !errorMessage) {
    notFound();
  }

  return (
    <main className="grain-overlay relative flex min-h-screen flex-1 overflow-x-hidden px-5 py-6 md:px-8 md:py-8">
      <div className="ambient-orb ambient-orb-white left-[-6rem] top-[-2rem] h-52 w-52 md:h-72 md:w-72" />
      <div className="ambient-orb ambient-orb-blue right-[-8rem] top-12 h-72 w-72 md:h-[28rem] md:w-[28rem]" />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          sectionLabel="Curso"
          actions={
            <Button asChild variant="outline" size="sm">
              <Link href="/mis-cursos">Todos los cursos</Link>
            </Button>
          }
        />

        <Card className="hero-panel rounded-[2rem]">
          <CardContent className="relative z-10 px-6 py-8 md:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl">
                <Button asChild variant="ghost" size="sm" className="w-fit px-0 normal-case tracking-normal">
                  <Link href="/mis-cursos">Volver</Link>
                </Button>

                {course?.shortname && course.shortname !== course.fullname ? (
                  <p className="mt-6 text-[0.72rem] font-semibold tracking-[0.28em] text-[var(--color-accent-soft)] uppercase">
                    {course.shortname}
                  </p>
                ) : null}
                <h1 className="display-face mt-4 text-balance text-5xl leading-[0.94] text-[var(--color-foreground)] md:text-6xl">
                  {course?.fullname || "Contenido del curso"}
                </h1>
                {course?.summary ? (
                  <>
                    <Separator className="my-5 max-w-xl" />
                    <RichHtml
                      html={course.summary}
                      className="max-w-3xl text-sm leading-8 text-[var(--color-muted)]"
                    />
                  </>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[17rem] lg:grid-cols-1">
                <div className="metric-chip rounded-[1.2rem] px-4 py-4">
                  <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-[var(--color-accent-soft)] uppercase">
                    Secciones
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-[var(--color-foreground)]">
                    {sections.length}
                  </p>
                </div>
                <div className="metric-chip rounded-[1.2rem] px-4 py-4">
                  <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-[var(--color-accent-soft)] uppercase">
                    Curso
                  </p>
                  <p className="mt-2 text-sm text-[var(--color-foreground)]">
                    Contenido y actividades
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {errorMessage ? (
          <Card className="rounded-[1.5rem] border-[rgba(255,124,124,0.24)] bg-[rgba(255,124,124,0.08)]">
            <CardContent className="px-6 py-5 text-sm leading-7 text-[var(--color-danger)]">
              <p className="font-semibold">
                {expiredSession
                  ? "La sesión ya no es válida."
                  : "No se pudo cargar el contenido."}
              </p>
              <p className="mt-1 opacity-80">{errorMessage}</p>
            </CardContent>
          </Card>
        ) : null}

        <section className="flex flex-col gap-4">
          {sections.length > 0 ? (
            sections.map((section, sectionIndex) => (
              <Card
                key={section.id}
                className="animate-rise-in rounded-[1.7rem]"
                style={{ animationDelay: `${sectionIndex * 60}ms` }}
              >
                <CardContent className="px-6 py-6">
                  <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
                    <div className="lg:pr-3">
                      <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-[var(--color-accent-soft)] uppercase">
                        {section.name}
                      </p>
                      {section.summary ? (
                        <RichHtml
                          html={section.summary}
                          className="mt-4 text-sm leading-7 text-[var(--color-muted)]"
                        />
                      ) : (
                        <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                          Sin resumen visible.
                        </p>
                      )}
                    </div>

                    <div className="grid gap-3">
                      {section.modules.map((module) => {
                        const completionBadge = getCompletionBadge(module);
                        const actionHref = getActionHref(parsedCourseId, module);

                        return (
                          <article
                            key={module.id}
                            className="relative rounded-[1.35rem] border border-white/8 bg-white/4 px-4 py-4 transition hover:border-[var(--color-accent-cool)]/40 hover:bg-white/6"
                          >
                            {actionHref ? (
                              module.modname === "forum" ||
                              module.modname === "resource" ||
                              module.modname === "scorm" ? (
                                <Link
                                  href={actionHref}
                                  aria-label={`Abrir ${module.name}`}
                                  className="absolute inset-0 rounded-[1.35rem]"
                                />
                              ) : module.modname === "url" ? (
                                <ReactiveExternalLink
                                  href={actionHref}
                                  ariaLabel={`Abrir ${module.name}`}
                                  className="absolute inset-0 rounded-[1.35rem]"
                                />
                              ) : (
                                <a
                                  href={actionHref}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label={`Abrir ${module.name}`}
                                  className="absolute inset-0 rounded-[1.35rem]"
                                />
                              )
                            ) : null}
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="relative z-10 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="metric-chip rounded-full px-3 py-1 text-[0.66rem] font-semibold tracking-[0.22em] text-[var(--color-accent-soft)] uppercase">
                                    {module.modname}
                                  </span>
                                  {completionBadge ? (
                                    <span
                                      className={
                                        completionBadge.tone === "success"
                                          ? "metric-chip rounded-full px-3 py-1 text-[0.66rem] font-semibold tracking-[0.22em] text-emerald-300 uppercase"
                                          : completionBadge.tone === "danger"
                                            ? "metric-chip rounded-full px-3 py-1 text-[0.66rem] font-semibold tracking-[0.22em] text-rose-300 uppercase"
                                            : "metric-chip rounded-full px-3 py-1 text-[0.66rem] font-semibold tracking-[0.22em] text-[var(--color-muted)] uppercase"
                                      }
                                    >
                                      {completionBadge.label}
                                    </span>
                                  ) : null}
                                  {!module.userVisible ? (
                                    <span className="metric-chip rounded-full px-3 py-1 text-[0.66rem] font-semibold tracking-[0.22em] text-amber-200 uppercase">
                                      Restringida
                                    </span>
                                  ) : null}
                                </div>

                                <h2 className="mt-4 text-lg font-semibold text-[var(--color-foreground)]">
                                  {module.name}
                                </h2>
                                {module.description ? (
                                  <RichHtml
                                    html={module.description}
                                    className="mt-3 text-sm leading-7 text-[var(--color-muted)]"
                                  />
                                ) : null}

                                {(module.availabilityInfo || module.dates.length > 0 || module.completionTime) ? (
                                  <div className="mt-4 flex flex-col gap-3 rounded-[1rem] border border-white/8 bg-white/4 px-4 py-4">
                                    {module.availabilityInfo ? (
                                      <div>
                                        <p className="text-[0.68rem] font-semibold tracking-[0.22em] text-[var(--color-accent-soft)] uppercase">
                                          Restricciones de acceso
                                        </p>
                                        <RichHtml
                                          html={module.availabilityInfo}
                                          className="mt-2 text-sm leading-7 text-[var(--color-muted)]"
                                          stripMoodleLinks
                                        />
                                      </div>
                                    ) : null}

                                    {module.dates.length > 0 ? (
                                      <div className="grid gap-2 md:grid-cols-2">
                                        {module.dates.map((date) => (
                                          <div
                                            key={`${module.id}-${date.label}-${date.timestamp}`}
                                            className="rounded-[0.95rem] border border-white/7 bg-black/10 px-3 py-3"
                                          >
                                            <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-[var(--color-accent-soft)] uppercase">
                                              {date.label}
                                            </p>
                                            <p className="mt-2 text-sm text-[var(--color-foreground)]">
                                              {formatDate(date.timestamp)}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    ) : null}

                                    {module.completionTime ? (
                                      <div className="rounded-[0.95rem] border border-white/7 bg-black/10 px-3 py-3">
                                        <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-[var(--color-accent-soft)] uppercase">
                                          Completada el
                                        </p>
                                        <p className="mt-2 text-sm text-[var(--color-foreground)]">
                                          {formatDate(module.completionTime)}
                                        </p>
                                      </div>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>

                              <div className="relative z-10 flex shrink-0 flex-col items-stretch gap-3 lg:min-w-[10rem]">
                                {module.canManuallyToggleCompletion ? (
                                  <ManualCompletionToggle
                                    courseModuleId={module.id}
                                    isCompleted={module.completionState !== "incomplete"}
                                    returnPath={`/mis-cursos/${parsedCourseId}`}
                                  />
                                ) : null}
                                {!actionHref && !module.userVisible ? (
                                  <Button variant="outline" size="sm" className="shrink-0" disabled>
                                    No disponible
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="hero-panel rounded-[1.7rem]">
              <CardContent className="px-8 py-10">
                <p className="text-[0.72rem] font-semibold tracking-[0.24em] text-[var(--color-accent-soft)] uppercase">
                  Sin contenido
                </p>
                <h2 className="display-face mt-4 text-4xl text-[var(--color-foreground)]">
                  Este curso no tiene elementos visibles.
                </h2>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
}
