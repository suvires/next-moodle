import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ManualCompletionToggle } from "@/app/components/manual-completion-toggle";
import { AppTopbar } from "@/app/components/app-topbar";
import { ReactiveExternalLink } from "@/app/components/reactive-external-link";
import { RichHtml } from "@/app/components/rich-html";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { logger } from "@/lib/logger";
import {
  getActivitiesCompletionStatus,
  computeCourseProgress,
  getCourseContents,
  getCourseUpdatesSince,
  getUserCourses,
  isAuthenticationError,
  resolveUserAccessProfile,
  type MoodleCourseAccessProfile,
} from "@/lib/moodle";
import { ProgressBar } from "@/app/components/progress-bar";
import { getCourseRoleLabel, getCourseRoleTone, getCourseRoleDescription } from "@/lib/course-roles";
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

function getCourseActionItems(
  courseId: number,
  courseAccess: MoodleCourseAccessProfile
) {
  const items = [
    {
      href: `/mis-cursos/${courseId}/tareas`,
      label: "Tareas",
      body: "Consulta el tablero de tareas del curso.",
    },
    {
      href: `/mis-cursos/${courseId}/calificaciones`,
      label: "Calificaciones",
      body: "Revisa la información de evaluación disponible en la app.",
    },
  ];

  if (courseAccess.roleBucket !== "student") {
    items.push({
      href: "/buscar",
      label: "Buscar contenido",
      body: "Busca materiales o actividad del campus mientras trabajas este curso.",
    });
  }

  if (courseAccess.roleBucket === "course_manager") {
    items.push({
      href: "/catalogo",
      label: "Catálogo",
      body: "Comprueba cómo se presenta la oferta formativa fuera del curso.",
    });
  }

  return items.slice(0, 4);
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

  if (module.modname === "assign" && module.instance) {
    return `/mis-cursos/${courseId}/tareas/${module.instance}`;
  }

  if (module.modname === "quiz" && module.instance) {
    return `/mis-cursos/${courseId}/quiz/${module.instance}`;
  }

  if (module.modname === "folder") {
    return `/mis-cursos/${courseId}/recursos/${module.id}`;
  }

  if (module.modname === "page") {
    return `/mis-cursos/${courseId}/recursos/${module.id}`;
  }

  if (module.modname === "book" && module.instance) {
    return `/mis-cursos/${courseId}/libro/${module.instance}`;
  }

  if (module.modname === "glossary" && module.instance) {
    return `/mis-cursos/${courseId}/glosario/${module.instance}`;
  }

  if (module.modname === "wiki" && module.instance) {
    return `/mis-cursos/${courseId}/wiki/${module.instance}`;
  }

  if (module.modname === "choice" && module.instance) {
    return `/mis-cursos/${courseId}/votacion/${module.instance}`;
  }

  if (module.modname === "feedback" && module.instance) {
    return `/mis-cursos/${courseId}/encuesta/${module.instance}`;
  }

  if (module.modname === "lesson" && module.instance) {
    return `/mis-cursos/${courseId}/leccion/${module.instance}`;
  }

  if (module.modname === "data" && module.instance) {
    return `/mis-cursos/${courseId}/base-datos/${module.instance}`;
  }

  if (module.modname === "workshop" && module.instance) {
    return `/mis-cursos/${courseId}/taller/${module.instance}`;
  }

  if (module.modname === "chat" && module.instance) {
    return `/mis-cursos/${courseId}/chat/${module.instance}`;
  }

  if (module.modname === "lti" && module.instance) {
    return `/mis-cursos/${courseId}/externo/${module.instance}`;
  }

  if (module.modname === "h5pactivity" && module.instance) {
    return `/mis-cursos/${courseId}/h5p/${module.instance}`;
  }

  if (module.modname === "survey" && module.instance) {
    return `/mis-cursos/${courseId}/encuesta-predefinida/${module.instance}`;
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
  let progress = { completed: 0, total: 0, percentage: 0 };
  let courseUpdates: Awaited<ReturnType<typeof getCourseUpdatesSince>> = [];
  let courseAccess: MoodleCourseAccessProfile | null = null;

  try {
    const oneWeekAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 3600;

    const [coursesResult, sectionsResult, completionStatuses, updatesResult, accessProfile] =
      await Promise.all([
        getUserCourses(session.token, session.userId),
        getCourseContents(session.token, parsedCourseId),
        getActivitiesCompletionStatus(
          session.token,
          parsedCourseId,
          session.userId
        ).catch(() => []),
        getCourseUpdatesSince(session.token, parsedCourseId, oneWeekAgo).catch(() => []),
        resolveUserAccessProfile(session.token, session.userId).catch(() => null),
      ]);

    courses = coursesResult;
    sections = sectionsResult;
    progress = computeCourseProgress(completionStatuses);
    courseUpdates = updatesResult;
    courseAccess =
      accessProfile?.courseCapabilities.find(
        (course) => course.courseId === parsedCourseId
      ) || null;
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

  const effectiveCourseAccess: MoodleCourseAccessProfile =
    courseAccess || {
      courseId: parsedCourseId,
      fullname: course?.fullname || "Curso",
      shortname: course?.shortname || undefined,
      summary: course?.summary || undefined,
      roleBucket: "student",
      roles: [],
      canTeach: false,
      canEdit: false,
      canManageCourse: false,
      canManageParticipants: false,
      canViewGrades: true,
      canViewReports: false,
      adminOptions: {},
      navigationOptions: {},
    };
  const courseActionItems = getCourseActionItems(
    parsedCourseId,
    effectiveCourseAccess
  );

  return (
    <div className="flex min-h-screen flex-col">
      <AppTopbar
        fullName={session.fullName}
        userPictureUrl={session.userPictureUrl}
        breadcrumbs={[
          { label: "Mis cursos", href: "/mis-cursos" },
          { label: course?.fullname ?? "Curso" },
        ]}
        actions={
          <>
            <Link href={`/mis-cursos/${parsedCourseId}/tareas`} className="text-[var(--muted)] transition hover:text-[var(--foreground)]">
              Tareas
            </Link>
            <Link href={`/mis-cursos/${parsedCourseId}/calificaciones`} className="text-[var(--muted)] transition hover:text-[var(--foreground)]">
              Calificaciones
            </Link>
            {effectiveCourseAccess.roleBucket !== "student" ? (
              <Link href="/buscar" className="text-[var(--muted)] transition hover:text-[var(--foreground)]">
                Buscar
              </Link>
            ) : null}
          </>
        }
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 md:px-8 md:py-10">
        <div className="animate-rise-in mb-8">
          <div className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getCourseRoleTone(effectiveCourseAccess.roleBucket)}`}>
            {getCourseRoleLabel(effectiveCourseAccess.roleBucket)}
          </div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            {course?.fullname || "Curso"}
          </h1>

          {course?.shortname && course.shortname !== course.fullname && (
            <p className="mt-1 text-[var(--muted)]">{course.shortname}</p>
          )}

          {progress.total > 0 && (
            <div className="mt-4 flex items-center gap-4">
              <ProgressBar percentage={progress.percentage} className="max-w-xs flex-1" />
              <span className="text-sm text-[var(--muted)]">
                {progress.completed}/{progress.total} completadas
              </span>
            </div>
          )}

          {courseUpdates.length > 0 && (
            <p className="mt-2 text-sm text-[var(--muted)]">
              {courseUpdates.length} {courseUpdates.length === 1 ? "novedad" : "novedades"} en los últimos 7 días
            </p>
          )}
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            {getCourseRoleDescription(effectiveCourseAccess)}
          </p>
        </div>

        {errorMessage && (
          <div className="banner-danger mb-6">
            <p className="font-semibold">
              {expiredSession ? "La sesión ya no es válida." : "No se pudo cargar el contenido."}
            </p>
            <p className="mt-1 opacity-80">{errorMessage}</p>
          </div>
        )}

        <section className="mb-8 grid gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <Card className="rounded-2xl">
            <CardContent className="px-5 py-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${getCourseRoleTone(effectiveCourseAccess.roleBucket)}`}>
                  {getCourseRoleLabel(effectiveCourseAccess.roleBucket)}
                </span>
                {effectiveCourseAccess.roles
                  .map((role) => role.name)
                  .filter(Boolean)
                  .filter((role, index, roles) => roles.indexOf(role) === index)
                  .slice(0, 3)
                  .map((role) => (
                    <span
                      key={role}
                      className="rounded-full bg-[var(--surface-strong)] px-3 py-1 text-xs font-medium text-[var(--muted)]"
                    >
                      {role}
                    </span>
                  ))}
              </div>

              <h2 className="mt-4 text-lg font-semibold text-[var(--foreground)]">
                Tu acceso en este curso
              </h2>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                {effectiveCourseAccess.roleBucket === "student"
                  ? "La vista prioriza seguimiento, progreso y acceso rápido a las actividades del curso."
                  : effectiveCourseAccess.roleBucket === "teacher"
                    ? "La vista prioriza seguimiento docente, tareas y revisión del contenido del curso."
                    : effectiveCourseAccess.roleBucket === "editing_teacher"
                      ? "La vista prioriza docencia con edición y acceso rápido a áreas académicas ya soportadas por la app."
                      : "La vista prioriza gestión del curso junto con las áreas académicas disponibles."}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                    Módulos
                  </p>
                  <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">
                    {sections.reduce((total, section) => total + section.modules.length, 0)}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                    Progreso
                  </p>
                  <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">
                    {progress.percentage}%
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                    Novedades
                  </p>
                  <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">
                    {courseUpdates.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="px-5 py-5">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Accesos rápidos
              </h2>
              <div className="mt-4 flex flex-col gap-3">
                {courseActionItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 transition hover:border-[var(--line-strong)]"
                  >
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                      {item.body}
                    </p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="flex flex-col gap-4">
          {sections.length > 0 ? (
            sections.map((section, sectionIndex) => (
              <div
                key={section.id}
                className="animate-rise-in"
                style={{ animationDelay: `${sectionIndex * 60}ms` }}
              >
                <h2 className="mb-3 text-lg font-bold text-[var(--foreground)]">
                  {section.name}
                </h2>
                {section.summary && (
                  <RichHtml
                    html={section.summary}
                    className="mb-4 text-sm leading-relaxed text-[var(--muted)]"
                  />
                )}

                {section.modules.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {section.modules.map((module) => {
                      const completionBadge = getCompletionBadge(module);
                      const actionHref = getActionHref(parsedCourseId, module);

                      return (
                        <article
                          key={module.id}
                          className="relative rounded-xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4 transition hover:border-[var(--line-strong)] hover:shadow-sm"
                        >
                          {actionHref ? (
                            module.modname === "forum" ||
                            module.modname === "resource" ||
                            module.modname === "scorm" ||
                            module.modname === "book" ||
                            module.modname === "glossary" ||
                            module.modname === "wiki" ||
                            module.modname === "choice" ||
                            module.modname === "feedback" ||
                            module.modname === "lesson" ||
                            module.modname === "data" ||
                            module.modname === "workshop" ||
                            module.modname === "chat" ||
                            module.modname === "lti" ||
                            module.modname === "h5pactivity" ||
                            module.modname === "survey" ? (
                              <Link
                                href={actionHref}
                                aria-label={`Abrir ${module.name}`}
                                className="absolute inset-0 z-[1] rounded-xl"
                              />
                            ) : module.modname === "url" ? (
                              <ReactiveExternalLink
                                href={actionHref}
                                ariaLabel={`Abrir ${module.name}`}
                                className="absolute inset-0 z-[1] rounded-xl"
                              />
                            ) : (
                              <a
                                href={actionHref}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Abrir ${module.name}`}
                                className="absolute inset-0 z-[1] rounded-xl"
                              />
                            )
                          ) : null}

                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="chip chip-muted">{module.modname}</span>
                                {completionBadge && (
                                  <span
                                    className={
                                      completionBadge.tone === "success"
                                        ? "chip chip-success"
                                        : completionBadge.tone === "danger"
                                          ? "chip chip-danger"
                                          : "chip chip-muted"
                                    }
                                  >
                                    {completionBadge.label}
                                  </span>
                                )}
                                {!module.userVisible && (
                                  <span className="chip chip-warning">Restringida</span>
                                )}
                              </div>

                              <p className="mt-2 font-medium text-[var(--foreground)]">
                                {module.name}
                              </p>
                              {module.description && (
                                <RichHtml
                                  html={module.description}
                                  className="mt-1 text-sm leading-relaxed text-[var(--muted)]"
                                />
                              )}

                              {(module.availabilityInfo || module.dates.length > 0 || module.completionTime) && (
                                <div className="mt-3 flex flex-col gap-1.5 text-sm text-[var(--muted)]">
                                  {module.availabilityInfo && (
                                    <div>
                                      <p className="font-medium text-[var(--foreground)]">Restricciones de acceso</p>
                                      <RichHtml
                                        html={module.availabilityInfo}
                                        className="mt-0.5 text-sm leading-relaxed text-[var(--muted)]"
                                        stripMoodleLinks
                                      />
                                    </div>
                                  )}
                                  {module.dates.length > 0 && (
                                    <div className="flex flex-wrap gap-3">
                                      {module.dates.map((date) => (
                                        <span key={`${module.id}-${date.label}-${date.timestamp}`}>
                                          <span className="font-medium text-[var(--foreground)]">{date.label}:</span>{" "}
                                          {formatDate(date.timestamp)}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {module.completionTime && (
                                    <span>
                                      <span className="font-medium text-[var(--foreground)]">Completada el:</span>{" "}
                                      {formatDate(module.completionTime)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="relative z-10 flex shrink-0 items-center gap-2">
                              {module.canManuallyToggleCompletion && (
                                <ManualCompletionToggle
                                  courseModuleId={module.id}
                                  isCompleted={module.completionState !== "incomplete"}
                                  returnPath={`/mis-cursos/${parsedCourseId}`}
                                />
                              )}
                              {!actionHref && !module.userVisible && (
                                <Button variant="outline" size="sm" disabled>
                                  No disponible
                                </Button>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="py-16 text-center text-[var(--muted)]">
              Este curso no tiene elementos visibles.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
