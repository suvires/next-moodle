import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AssignmentGradeForm } from "@/app/components/assignment-grade-form";
import { AssignmentSubmissionForm } from "@/app/components/assignment-submission-form";
import { AppTopbar } from "@/app/components/app-topbar";
import { CourseRoleActionGrid } from "@/app/components/course-role-action-grid";
import { RichHtml } from "@/app/components/rich-html";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { logger } from "@/lib/logger";
import {
  getAssignments,
  getAssignmentGrades,
  getAssignmentSubmissions,
  getSubmissionStatus,
  getUserCourses,
  isAccessException,
  isAuthenticationError,
  resolveUserAccessProfile,
  type MoodleCourseAccessProfile,
} from "@/lib/moodle";
import type {
  MoodleAssignment,
  MoodleAssignmentGradeRecord,
  MoodleAssignmentSubmissionRecord,
  MoodleSubmissionStatus,
} from "@/lib/moodle";
import {
  getActivityRoleActions,
  getCourseRoleLabel,
  getCourseRoleTone,
  shouldShowStudentParticipationActions,
} from "@/lib/course-roles";
import { getSession } from "@/lib/session";

type AssignDetailPageProps = {
  params: Promise<{
    courseId: string;
    assignId: string;
  }>;
  searchParams: Promise<{
    status?: string;
    review?: string;
  }>;
};

function formatDate(value?: number) {
  if (!value) return null;
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value * 1000));
}

function submissionStateBadge(state: MoodleSubmissionStatus["submissionState"]) {
  switch (state) {
    case "submitted":
      return {
        label: "Enviada",
        className:
          "border-[var(--success-soft)] bg-[var(--success-soft)] text-[var(--success)]",
      };
    case "draft":
      return {
        label: "Borrador",
        className:
          "border-[var(--warning-soft)] bg-[var(--warning-soft)] text-[var(--warning)]",
      };
    default:
      return {
        label: "Sin enviar",
        className:
          "border-[var(--line)] bg-[var(--surface-strong)] text-[var(--color-muted)]",
      };
  }
}

function dueDateTone(dueDate?: number) {
  if (!dueDate) return "text-[var(--color-muted)]";
  const now = Date.now() / 1000;
  if (dueDate < now) return "text-[var(--color-danger)]";
  if (dueDate - now < 3 * 24 * 3600) return "text-[var(--warning)]";
  return "text-[var(--color-muted)]";
}

function getInitials(name?: string) {
  return (
    name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

function teacherSubmissionBadge(status: MoodleAssignmentSubmissionRecord["status"]) {
  switch (status) {
    case "submitted":
      return {
        label: "Enviada",
        className:
          "border-[var(--success-soft)] bg-[var(--success-soft)] text-[var(--success)]",
      };
    case "draft":
      return {
        label: "Borrador",
        className:
          "border-[var(--warning-soft)] bg-[var(--warning-soft)] text-[var(--warning)]",
      };
    default:
      return {
        label: "Nueva",
        className:
          "border-[var(--line)] bg-[var(--surface-strong)] text-[var(--color-muted)]",
      };
  }
}

function buildAssignmentGradeKey(userId: number, attemptNumber: number) {
  return `${userId}:${attemptNumber}`;
}

export default async function AssignDetailPage({
  params,
  searchParams,
}: AssignDetailPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const { courseId, assignId } = await params;
  const query = await searchParams;
  const parsedCourseId = Number(courseId);
  const parsedAssignId = Number(assignId);

  if (
    !Number.isInteger(parsedCourseId) ||
    parsedCourseId <= 0 ||
    !Number.isInteger(parsedAssignId) ||
    parsedAssignId <= 0
  ) {
    notFound();
  }

  let courses = [] as Awaited<ReturnType<typeof getUserCourses>>;
  let assignment: MoodleAssignment | undefined;
  let submission: MoodleSubmissionStatus | undefined;
  let assignmentSubmissions: MoodleAssignmentSubmissionRecord[] = [];
  let assignmentGrades: MoodleAssignmentGradeRecord[] = [];
  let submissionsAccessError: string | null = null;
  let gradesAccessError: string | null = null;
  let errorMessage: string | null = null;
  let expiredSession = false;
  let courseAccess: MoodleCourseAccessProfile | null = null;

  try {
    const [coursesResult, assignResult, submissionResult, accessProfile] = await Promise.all([
      getUserCourses(session.token, session.userId),
      getAssignments(session.token, [parsedCourseId]),
      getSubmissionStatus(session.token, parsedAssignId).catch(() => undefined),
      resolveUserAccessProfile(session.token, session.userId).catch(() => null),
    ]);

    courses = coursesResult;
    assignment = assignResult
      .find((c) => c.courseId === parsedCourseId)
      ?.assignments.find((a) => a.id === parsedAssignId);
    submission = submissionResult;
    courseAccess =
      accessProfile?.courseCapabilities.find(
        (course) => course.courseId === parsedCourseId
      ) || null;

    if (
      courseAccess &&
      !shouldShowStudentParticipationActions(courseAccess)
    ) {
      const [submissionResult, gradesResult] = await Promise.allSettled([
        getAssignmentSubmissions(session.token, parsedAssignId),
        getAssignmentGrades(session.token, parsedAssignId),
      ]);

      if (submissionResult.status === "fulfilled") {
        assignmentSubmissions = submissionResult.value;
      } else if (isAccessException(submissionResult.reason)) {
        submissionsAccessError =
          "Tu cuenta no puede consultar los envíos de esta tarea.";
      } else {
        logger.warn("Assignment submissions load failed", {
          userId: session.userId,
          courseId: parsedCourseId,
          assignId: parsedAssignId,
          error: submissionResult.reason,
        });
        submissionsAccessError =
          "No se pudieron cargar los envíos registrados en esta tarea.";
      }

      if (gradesResult.status === "fulfilled") {
        assignmentGrades = gradesResult.value;
      } else if (isAccessException(gradesResult.reason)) {
        gradesAccessError =
          "Tu cuenta no puede consultar la revisión de esta tarea.";
      } else {
        logger.warn("Assignment grades load failed", {
          userId: session.userId,
          courseId: parsedCourseId,
          assignId: parsedAssignId,
          error: gradesResult.reason,
        });
        gradesAccessError =
          "No se pudieron cargar las calificaciones registradas en esta tarea.";
      }
    }
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Assignment detail load failed", {
      userId: session.userId,
      courseId: parsedCourseId,
      assignId: parsedAssignId,
      error,
    });
    errorMessage = "No se pudo cargar la tarea.";
  }

  const course = courses.find((item) => item.id === parsedCourseId);

  if (!course && !errorMessage) {
    notFound();
  }

  if (!assignment && !errorMessage) {
    notFound();
  }

  const badge = submission
    ? submissionStateBadge(submission.submissionState)
    : null;
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
  const canParticipateAsStudent = shouldShowStudentParticipationActions(
    effectiveCourseAccess
  );
  const gradesBySubmission = new Map(
    assignmentGrades.map((grade) => [
      buildAssignmentGradeKey(grade.userId, grade.attemptNumber),
      grade,
    ])
  );
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
        ? "Accesos rápidos para preparar tu entrega y seguir la evaluación."
        : effectiveCourseAccess.roleBucket === "teacher"
          ? "Accesos disponibles hoy para revisar la tarea y su contexto académico."
          : effectiveCourseAccess.roleBucket === "editing_teacher"
            ? "Accesos disponibles hoy para docencia con edición dentro de la app."
            : "Accesos amplios disponibles para supervisión de la actividad.",
    tone:
      effectiveCourseAccess.roleBucket === "student"
        ? "success"
        : effectiveCourseAccess.roleBucket === "course_manager"
          ? "warning"
          : "accent",
    actions: getActivityRoleActions({
      courseId: parsedCourseId,
      courseAccess: effectiveCourseAccess,
      activityType: "assignment_detail",
    }),
  } as const;
  const teacherReturnPath = `/mis-cursos/${parsedCourseId}/tareas/${parsedAssignId}`;
  const teacherStatusFilter = query.status || "all";
  const teacherReviewFilter = query.review || "all";
  const visibleTeacherSubmissions = assignmentSubmissions.filter((item) => {
    const grade = gradesBySubmission.get(
      buildAssignmentGradeKey(item.userId, item.attemptNumber)
    );

    const statusMatches =
      teacherStatusFilter === "all" ||
      item.status === teacherStatusFilter;
    const reviewMatches =
      teacherReviewFilter === "all" ||
      (teacherReviewFilter === "reviewed" && Boolean(grade?.grade)) ||
      (teacherReviewFilter === "unreviewed" && !grade?.grade);

    return statusMatches && reviewMatches;
  });

  return (
    <div className="flex min-h-screen flex-col">
      <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          sectionLabel="Tarea"
          actions={
            <Link
              href={`/mis-cursos/${parsedCourseId}/tareas`}
              className="text-[var(--muted)] transition hover:text-[var(--foreground)]"
            >
              Volver
            </Link>
          }
      />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-5 py-6 md:px-8 md:py-8">

        <div>
          <div className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getCourseRoleTone(effectiveCourseAccess.roleBucket)}`}>
            {getCourseRoleLabel(effectiveCourseAccess.roleBucket)}
          </div>
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            {assignment?.name || "Tarea"}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {course?.fullname || "Curso"}
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
            {effectiveCourseAccess.roleBucket === "student"
              ? "Esta vista está orientada a preparar y enviar tu entrega."
              : "Esta vista mantiene el flujo de entrega del alumno, pero ya refleja tu rol real dentro del curso."}
          </p>
        </div>

        <CourseRoleActionGrid sections={[roleActionSection]} />

        {!canParticipateAsStudent ? (
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "Todas", href: `/mis-cursos/${parsedCourseId}/tareas/${parsedAssignId}` },
              { key: "submitted", label: "Enviadas", href: `/mis-cursos/${parsedCourseId}/tareas/${parsedAssignId}?status=submitted` },
              { key: "draft", label: "Borradores", href: `/mis-cursos/${parsedCourseId}/tareas/${parsedAssignId}?status=draft` },
              { key: "new", label: "Nuevas", href: `/mis-cursos/${parsedCourseId}/tareas/${parsedAssignId}?status=new` },
            ].map((filter) => (
              <Link
                key={filter.key}
                href={filter.href}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  teacherStatusFilter === filter.key
                    ? "border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                    : "border-[var(--color-line)] text-[var(--color-muted)]"
                }`}
              >
                {filter.label}
              </Link>
            ))}
            {[
              { key: "all", label: "Toda revisión", href: `/mis-cursos/${parsedCourseId}/tareas/${parsedAssignId}${teacherStatusFilter === "all" ? "" : `?status=${teacherStatusFilter}`}` },
              { key: "reviewed", label: "Revisadas", href: `/mis-cursos/${parsedCourseId}/tareas/${parsedAssignId}?${teacherStatusFilter === "all" ? "" : `status=${teacherStatusFilter}&`}review=reviewed` },
              { key: "unreviewed", label: "Sin revisar", href: `/mis-cursos/${parsedCourseId}/tareas/${parsedAssignId}?${teacherStatusFilter === "all" ? "" : `status=${teacherStatusFilter}&`}review=unreviewed` },
            ].map((filter) => (
              <Link
                key={filter.key}
                href={filter.href.replace("?&", "?")}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  teacherReviewFilter === filter.key
                    ? "border-[var(--accent-cool)]/30 bg-[var(--accent-cool)]/10 text-[var(--accent-cool)]"
                    : "border-[var(--color-line)] text-[var(--color-muted)]"
                }`}
              >
                {filter.label}
              </Link>
            ))}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            {expiredSession
              ? "La sesion ya no es valida."
              : "No se pudo cargar la tarea."}
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

        {assignment?.intro ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Descripcion</h2>
              <Separator className="my-3" />
              <RichHtml
                html={assignment.intro}
                className="text-sm leading-7 text-[var(--color-muted)]"
              />
            </CardContent>
          </Card>
        ) : null}

        {submission ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Entrega</h2>
              <Separator className="my-3" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-[var(--color-muted)]">Estado</p>
                  <p className="mt-1">
                    <span
                      className={`rounded-full border px-3 py-1 text-sm font-semibold ${badge?.className}`}
                    >
                      {badge?.label}
                    </span>
                  </p>
                </div>

                {submission.isGraded ? (
                  <div>
                    <p className="text-xs text-[var(--color-muted)]">
                      Calificacion
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[var(--color-foreground)]">
                      {submission.gradeDisplay || "Calificada"}
                    </p>
                  </div>
                ) : null}

                {submission.timeModified ? (
                  <div>
                    <p className="text-xs text-[var(--color-muted)]">
                      Ultima modificacion
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-foreground)]">
                      {formatDate(submission.timeModified)}
                    </p>
                  </div>
                ) : null}

                <div>
                  <p className="text-xs text-[var(--color-muted)]">Intento</p>
                  <p className="mt-1 text-sm text-[var(--color-foreground)]">
                    {submission.attemptNumber + 1}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {assignment?.requiresSubmission && canParticipateAsStudent ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Realizar entrega</h2>
              <Separator className="my-3" />
              <AssignmentSubmissionForm
                assignId={parsedAssignId}
                returnPath={`/mis-cursos/${parsedCourseId}/tareas/${parsedAssignId}`}
              />
            </CardContent>
          </Card>
        ) : null}

        {assignment?.requiresSubmission && !canParticipateAsStudent ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Seguimiento docente</h2>
              <Separator className="my-3" />
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                El formulario de entrega se oculta en esta vista porque tu rol
                actual no es de alumno. Mantienes el contexto de seguimiento y
                revisión de la actividad.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {!canParticipateAsStudent && visibleTeacherSubmissions.length > 0 ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Envíos registrados</h2>
              <Separator className="my-3" />
              <div className="flex flex-col gap-3">
                {visibleTeacherSubmissions.map((item) => {
                  const badge = teacherSubmissionBadge(item.status);
                  const grade = gradesBySubmission.get(
                    buildAssignmentGradeKey(item.userId, item.attemptNumber)
                  );

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <Avatar className="h-10 w-10">
                            {item.userPictureUrl ? (
                              <AvatarImage
                                src={item.userPictureUrl}
                                alt={item.userFullName || `Usuario ${item.userId}`}
                              />
                            ) : null}
                            <AvatarFallback className="text-xs">
                              {getInitials(item.userFullName)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--color-foreground)]">
                              {item.userFullName || `Usuario ${item.userId}`}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span
                                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                              >
                                {badge.label}
                              </span>
                              <span className="rounded-full border border-[var(--color-line)] px-2.5 py-0.5 text-xs text-[var(--color-muted)]">
                                Intento {item.attemptNumber + 1}
                              </span>
                              {item.fileCount > 0 ? (
                                <span className="rounded-full border border-[var(--color-line)] px-2.5 py-0.5 text-xs text-[var(--color-muted)]">
                                  {item.fileCount}{" "}
                                  {item.fileCount === 1 ? "archivo" : "archivos"}
                                </span>
                              ) : null}
                              {grade?.grade ? (
                                <span className="rounded-full border border-[var(--accent-cool)]/20 bg-[var(--accent-cool)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--accent-cool)]">
                                  Nota: {grade.grade}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-1 text-sm text-[var(--color-muted)] md:text-right">
                          {item.timeModified ? (
                            <p>
                              <span className="font-medium text-[var(--color-foreground)]">
                                Última modificación:
                              </span>{" "}
                              {formatDate(item.timeModified)}
                            </p>
                          ) : null}
                          {item.timeCreated ? (
                            <p>
                              <span className="font-medium text-[var(--color-foreground)]">
                                Creada:
                              </span>{" "}
                              {formatDate(item.timeCreated)}
                            </p>
                          ) : null}
                          {grade?.timeModified || grade?.timeCreated ? (
                            <p>
                              <span className="font-medium text-[var(--color-foreground)]">
                                Revisada:
                              </span>{" "}
                              {formatDate(grade?.timeModified || grade?.timeCreated)}
                            </p>
                          ) : null}
                          {grade?.graderFullName ? (
                            <p>
                              <span className="font-medium text-[var(--color-foreground)]">
                                Revisor:
                              </span>{" "}
                              {grade.graderFullName}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {item.onlineText ? (
                        <div className="mt-4">
                          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                            Texto entregado
                          </p>
                          <RichHtml
                            html={item.onlineText}
                            className="text-sm leading-7 text-[var(--color-muted)]"
                          />
                        </div>
                      ) : null}

                      <AssignmentGradeForm
                        assignId={parsedAssignId}
                        courseId={parsedCourseId}
                        userId={item.userId}
                        attemptNumber={item.attemptNumber}
                        returnPath={teacherReturnPath}
                        initialGrade={grade?.grade}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {!canParticipateAsStudent &&
        visibleTeacherSubmissions.length === 0 &&
        !submissionsAccessError ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Envíos registrados</h2>
              <Separator className="my-3" />
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                No hay envíos visibles para esta tarea con el filtro y acceso actual.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {assignment?.dueDate || assignment?.cutoffDate || assignment?.submissionsOpenDate ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Fechas</h2>
              <Separator className="my-3" />
              <div className="grid gap-4 sm:grid-cols-3">
                {assignment.submissionsOpenDate ? (
                  <div>
                    <p className="text-xs text-[var(--color-muted)]">
                      Abierta desde
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-foreground)]">
                      {formatDate(assignment.submissionsOpenDate)}
                    </p>
                  </div>
                ) : null}
                {assignment.dueDate ? (
                  <div>
                    <p className="text-xs text-[var(--color-muted)]">
                      Fecha limite
                    </p>
                    <p
                      className={`mt-1 text-sm font-semibold ${dueDateTone(assignment.dueDate)}`}
                    >
                      {formatDate(assignment.dueDate)}
                    </p>
                  </div>
                ) : null}
                {assignment.cutoffDate ? (
                  <div>
                    <p className="text-xs text-[var(--color-muted)]">
                      Cierre definitivo
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-foreground)]">
                      {formatDate(assignment.cutoffDate)}
                    </p>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  );
}
