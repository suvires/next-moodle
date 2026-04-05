import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AssignmentSubmissionForm } from "@/app/components/assignment-submission-form";
import { AppTopbar } from "@/app/components/app-topbar";
import { RichHtml } from "@/app/components/rich-html";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { logger } from "@/lib/logger";
import {
  getAssignments,
  getSubmissionStatus,
  getUserCourses,
  isAuthenticationError,
  resolveUserAccessProfile,
  type MoodleCourseAccessProfile,
} from "@/lib/moodle";
import type { MoodleAssignment, MoodleSubmissionStatus } from "@/lib/moodle";
import { getCourseRoleLabel, getCourseRoleTone } from "@/lib/course-roles";
import { getSession } from "@/lib/session";

type AssignDetailPageProps = {
  params: Promise<{
    courseId: string;
    assignId: string;
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
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
      };
    case "draft":
      return {
        label: "Borrador",
        className:
          "border-amber-400/20 bg-amber-400/10 text-amber-400",
      };
    default:
      return {
        label: "Sin enviar",
        className:
          "border-white/10 bg-white/4 text-[var(--color-muted)]",
      };
  }
}

function dueDateTone(dueDate?: number) {
  if (!dueDate) return "text-[var(--color-muted)]";
  const now = Date.now() / 1000;
  if (dueDate < now) return "text-[var(--color-danger)]";
  if (dueDate - now < 3 * 24 * 3600) return "text-amber-400";
  return "text-[var(--color-muted)]";
}

export default async function AssignDetailPage({
  params,
}: AssignDetailPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const { courseId, assignId } = await params;
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

  return (
    <main className="flex min-h-screen flex-1 px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          sectionLabel="Tarea"
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link href={`/mis-cursos/${parsedCourseId}/tareas`}>Volver</Link>
            </Button>
          }
        />

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

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            {expiredSession
              ? "La sesion ya no es valida."
              : "No se pudo cargar la tarea."}
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

        {assignment?.requiresSubmission ? (
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
      </div>
    </main>
  );
}
