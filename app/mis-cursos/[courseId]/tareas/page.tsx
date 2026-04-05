import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { CourseRoleActionGrid } from "@/app/components/course-role-action-grid";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { logger } from "@/lib/logger";
import {
  getAssignments,
  getAssignmentGrades,
  getAssignmentSubmissions,
  isAccessException,
  getUserCourses,
  isAuthenticationError,
  resolveUserAccessProfile,
  type MoodleCourseAccessProfile,
} from "@/lib/moodle";
import type {
  MoodleAssignment,
  MoodleAssignmentGradeRecord,
  MoodleAssignmentSubmissionRecord,
} from "@/lib/moodle";
import {
  getActivityRoleActions,
  getCourseRoleLabel,
  getCourseRoleTone,
  shouldShowStudentParticipationActions,
} from "@/lib/course-roles";
import { getSession } from "@/lib/session";

type AssignmentsPageProps = {
  params: Promise<{
    courseId: string;
  }>;
  searchParams: Promise<{
    status?: string;
  }>;
};

function formatDate(value?: number) {
  if (!value) return null;
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value * 1000));
}

function dueDateTone(dueDate?: number) {
  if (!dueDate) return "text-[var(--color-muted)]";
  const now = Date.now() / 1000;
  if (dueDate < now) return "text-[var(--color-danger)]";
  if (dueDate - now < 3 * 24 * 3600) return "text-[var(--warning)]";
  return "text-[var(--color-muted)]";
}

function summarizeAssignmentSubmissions(
  submissions: MoodleAssignmentSubmissionRecord[]
) {
  return {
    total: submissions.length,
    submitted: submissions.filter((item) => item.status === "submitted").length,
    drafts: submissions.filter((item) => item.status === "draft").length,
    latestActivity:
      submissions.reduce((latest, item) => {
        const current = item.timeModified || item.timeCreated || 0;
        return current > latest ? current : latest;
      }, 0) || undefined,
  };
}

function summarizeAssignmentGrades(grades: MoodleAssignmentGradeRecord[]) {
  return {
    graded: grades.filter((grade) => Boolean(grade.grade)).length,
    latestReview:
      grades.reduce((latest, grade) => {
        const current = grade.timeModified || grade.timeCreated || 0;
        return current > latest ? current : latest;
      }, 0) || undefined,
  };
}

function matchesTeacherTaskFilter(
  filter: string,
  submissionSummary: ReturnType<typeof summarizeAssignmentSubmissions>,
  gradeSummary: ReturnType<typeof summarizeAssignmentGrades>
) {
  switch (filter) {
    case "pending-review":
      return submissionSummary.submitted > gradeSummary.graded;
    case "drafts":
      return submissionSummary.drafts > 0;
    case "inactive":
      return submissionSummary.total === 0;
    case "reviewed":
      return gradeSummary.graded > 0;
    default:
      return true;
  }
}

export default async function AssignmentsPage({
  params,
  searchParams,
}: AssignmentsPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const { courseId } = await params;
  const query = await searchParams;
  const parsedCourseId = Number(courseId);

  if (!Number.isInteger(parsedCourseId) || parsedCourseId <= 0) {
    notFound();
  }

  let courses = [] as Awaited<ReturnType<typeof getUserCourses>>;
  let assignments: MoodleAssignment[] = [];
  const submissionsByAssignment = new Map<number, MoodleAssignmentSubmissionRecord[]>();
  const gradesByAssignment = new Map<number, MoodleAssignmentGradeRecord[]>();
  let submissionsAccessError: string | null = null;
  let gradesAccessError: string | null = null;
  let errorMessage: string | null = null;
  let expiredSession = false;
  let courseAccess: MoodleCourseAccessProfile | null = null;

  try {
    const [coursesResult, assignResult, accessProfile] = await Promise.all([
      getUserCourses(session.token, session.userId),
      getAssignments(session.token, [parsedCourseId]),
      resolveUserAccessProfile(session.token, session.userId).catch(() => null),
    ]);

    courses = coursesResult;
    assignments =
      assignResult.find((c) => c.courseId === parsedCourseId)?.assignments || [];
    courseAccess =
      accessProfile?.courseCapabilities.find(
        (course) => course.courseId === parsedCourseId
      ) || null;

    if (
      courseAccess &&
      !shouldShowStudentParticipationActions(courseAccess) &&
      assignments.length > 0
    ) {
      const submissionResults = await Promise.allSettled(
        assignments.map((assignment) =>
          getAssignmentSubmissions(session.token, assignment.id).then(
            (submissions) => [assignment.id, submissions] as const
          )
        )
      );
      const gradeResults = await Promise.allSettled(
        assignments.map((assignment) =>
          getAssignmentGrades(session.token, assignment.id).then(
            (grades) => [assignment.id, grades] as const
          )
        )
      );

      for (const result of submissionResults) {
        if (result.status === "fulfilled") {
          submissionsByAssignment.set(result.value[0], result.value[1]);
          continue;
        }

        if (isAccessException(result.reason)) {
          submissionsAccessError =
            "Tu cuenta no puede consultar todos los envíos de este curso.";
        } else {
          logger.warn("Assignment submissions summary load failed", {
            userId: session.userId,
            courseId: parsedCourseId,
            error: result.reason,
          });
          submissionsAccessError =
            "No se pudieron cargar todos los resúmenes de envíos del curso.";
        }
      }

      for (const result of gradeResults) {
        if (result.status === "fulfilled") {
          gradesByAssignment.set(result.value[0], result.value[1]);
          continue;
        }

        if (isAccessException(result.reason)) {
          gradesAccessError =
            "Tu cuenta no puede consultar todas las calificaciones de este curso.";
        } else {
          logger.warn("Assignment grades summary load failed", {
            userId: session.userId,
            courseId: parsedCourseId,
            error: result.reason,
          });
          gradesAccessError =
            "No se pudieron cargar todos los resúmenes de revisión del curso.";
        }
      }
    }
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Assignments page load failed", {
      userId: session.userId,
      courseId: parsedCourseId,
      error,
    });
    errorMessage = "No se pudieron cargar las tareas.";
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
  const roleActionSection = {
    title:
      effectiveCourseAccess.roleBucket === "student"
        ? "Intento, entrega y consulta"
        : effectiveCourseAccess.roleBucket === "teacher"
          ? "Seguimiento y revisión"
          : effectiveCourseAccess.roleBucket === "editing_teacher"
            ? "Edición ligera"
            : "Administración del curso",
    description:
      effectiveCourseAccess.roleBucket === "student"
        ? "Accesos rápidos para seguir tareas, entregar trabajo y consultar resultados."
        : effectiveCourseAccess.roleBucket === "teacher"
          ? "Accesos disponibles hoy para revisar la actividad de tareas del curso."
          : effectiveCourseAccess.roleBucket === "editing_teacher"
            ? "Accesos disponibles hoy para docencia con edición dentro de la app."
            : "Accesos amplios ya disponibles para supervisión de tareas y evaluación.",
    tone:
      effectiveCourseAccess.roleBucket === "student"
        ? "success"
        : effectiveCourseAccess.roleBucket === "course_manager"
          ? "warning"
          : "accent",
    actions: getActivityRoleActions({
      courseId: parsedCourseId,
      courseAccess: effectiveCourseAccess,
      activityType: "assignment_list",
    }),
  } as const;
  const teacherFilter = query.status || "all";
  const visibleAssignments = assignments.filter((assign) => {
    if (shouldShowStudentParticipationActions(effectiveCourseAccess)) {
      return true;
    }

    const submissionSummary = summarizeAssignmentSubmissions(
      submissionsByAssignment.get(assign.id) || []
    );
    const gradeSummary = summarizeAssignmentGrades(
      gradesByAssignment.get(assign.id) || []
    );

    return matchesTeacherTaskFilter(
      teacherFilter,
      submissionSummary,
      gradeSummary
    );
  });

  return (
    <main className="flex min-h-screen flex-1 px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          breadcrumbs={[
            { label: "Mis cursos", href: "/mis-cursos" },
            { label: course?.fullname ?? "Curso", href: `/mis-cursos/${parsedCourseId}` },
            { label: "Tareas" },
          ]}
        />

        <div>
          <div className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getCourseRoleTone(effectiveCourseAccess.roleBucket)}`}>
            {getCourseRoleLabel(effectiveCourseAccess.roleBucket)}
          </div>
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            Tareas
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {course?.fullname || "Curso"} — {assignments.length}{" "}
            {assignments.length === 1 ? "tarea" : "tareas"}
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
            {effectiveCourseAccess.roleBucket === "student"
              ? "Esta vista está orientada al seguimiento y entrega de tus tareas."
              : "Esta vista te ayuda a revisar rápidamente las tareas disponibles dentro del curso."}
          </p>
        </div>

        <CourseRoleActionGrid sections={[roleActionSection]} />

        {!shouldShowStudentParticipationActions(effectiveCourseAccess) ? (
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "Todas" },
              { key: "pending-review", label: "Pendientes" },
              { key: "drafts", label: "Borradores" },
              { key: "reviewed", label: "Revisadas" },
              { key: "inactive", label: "Sin envíos" },
            ].map((filter) => {
              const isActive = teacherFilter === filter.key;
              return (
                <Link
                  key={filter.key}
                  href={
                    filter.key === "all"
                      ? `/mis-cursos/${parsedCourseId}/tareas`
                      : `/mis-cursos/${parsedCourseId}/tareas?status=${filter.key}`
                  }
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    isActive
                      ? "border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      : "border-[var(--color-line)] text-[var(--color-muted)]"
                  }`}
                >
                  {filter.label}
                </Link>
              );
            })}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            {expiredSession
              ? "La sesion ya no es valida."
              : "No se pudieron cargar las tareas."}
          </div>
        ) : null}

        {submissionsAccessError ? (
          <div className="rounded-lg border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/8 px-4 py-3 text-sm text-[var(--color-warning)]">
            {submissionsAccessError}
          </div>
        ) : null}

        {gradesAccessError ? (
          <div className="rounded-lg border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/8 px-4 py-3 text-sm text-[var(--color-warning)]">
            {gradesAccessError}
          </div>
        ) : null}

        {visibleAssignments.length > 0 ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Listado de tareas</h2>
              <Separator className="my-3" />
              <div className="flex flex-col gap-1">
                {visibleAssignments.map((assign) => {
                  const submissionSummary = summarizeAssignmentSubmissions(
                    submissionsByAssignment.get(assign.id) || []
                  );
                  const gradeSummary = summarizeAssignmentGrades(
                    gradesByAssignment.get(assign.id) || []
                  );

                  return (
                  <Link
                    key={assign.id}
                    href={`/mis-cursos/${parsedCourseId}/tareas/${assign.id}`}
                    className="group rounded-lg px-4 py-3 transition hover:bg-[var(--color-accent)]/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-[var(--color-foreground)] group-hover:text-[var(--color-accent)]">
                          {assign.name}
                        </p>
                        {!shouldShowStudentParticipationActions(
                          effectiveCourseAccess
                        ) ? (
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
                            <span className="rounded-full border border-[var(--color-line)] px-2.5 py-0.5">
                              {submissionSummary.total}{" "}
                              {submissionSummary.total === 1
                                ? "envío"
                                : "envíos"}
                            </span>
                            <span className="rounded-full border border-[var(--success-soft)] bg-[var(--success-soft)] px-2.5 py-0.5 text-[var(--success)]">
                              {submissionSummary.submitted} enviadas
                            </span>
                            <span className="rounded-full border border-[var(--warning-soft)] bg-[var(--warning-soft)] px-2.5 py-0.5 text-[var(--warning)]">
                              {submissionSummary.drafts} borradores
                            </span>
                            <span className="rounded-full border border-[var(--accent-cool)]/20 bg-[var(--accent-cool)]/10 px-2.5 py-0.5 text-[var(--accent-cool)]">
                              {gradeSummary.graded} revisadas
                            </span>
                            {submissionSummary.latestActivity ? (
                              <span className="rounded-full border border-[var(--color-line)] px-2.5 py-0.5">
                                Última actividad:{" "}
                                {formatDate(submissionSummary.latestActivity)}
                              </span>
                            ) : null}
                            {gradeSummary.latestReview ? (
                              <span className="rounded-full border border-[var(--color-line)] px-2.5 py-0.5">
                                Última revisión:{" "}
                                {formatDate(gradeSummary.latestReview)}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      <span
                        className={`shrink-0 pl-4 text-xs ${dueDateTone(assign.dueDate)}`}
                      >
                        {assign.dueDate
                          ? formatDate(assign.dueDate)
                          : "Sin fecha limite"}
                      </span>
                    </div>
                  </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : !errorMessage ? (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            {shouldShowStudentParticipationActions(effectiveCourseAccess)
              ? "No hay tareas en este curso."
              : "No hay tareas que coincidan con el filtro actual."}
          </p>
        ) : null}
      </div>
    </main>
  );
}
