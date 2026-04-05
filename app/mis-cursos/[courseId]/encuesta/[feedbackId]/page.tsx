import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { RichHtml } from "@/app/components/rich-html";
import { Button, LinkButton } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { logger } from "@/lib/logger";
import {
  getFeedbacksByCourses,
  getFeedbackItems,
  getUserCourses,
  isAuthenticationError,
  resolveUserAccessProfile,
  type MoodleCourseAccessProfile,
} from "@/lib/moodle";
import type { MoodleFeedback, MoodleFeedbackItem } from "@/lib/moodle";
import { getCourseRoleLabel, getCourseRoleTone } from "@/lib/course-roles";
import { getSession } from "@/lib/session";

type FeedbackDetailPageProps = {
  params: Promise<{
    courseId: string;
    feedbackId: string;
  }>;
};

function formatDate(value?: number) {
  if (!value) return null;
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value * 1000));
}

function statusBadge(feedback: MoodleFeedback) {
  if (feedback.isAlreadySubmitted) {
    return {
      label: "Completada",
      className: "border-[var(--success-soft)] bg-[var(--success-soft)] text-[var(--success)]",
    };
  }

  if (feedback.isOpen) {
    return {
      label: "Abierta",
      className: "border-[var(--warning-soft)] bg-[var(--warning-soft)] text-[var(--warning)]",
    };
  }

  return {
    label: "Cerrada",
    className: "border-[var(--line)] bg-[var(--surface-strong)] text-[var(--color-muted)]",
  };
}

export default async function FeedbackDetailPage({
  params,
}: FeedbackDetailPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const { courseId, feedbackId } = await params;
  const parsedCourseId = Number(courseId);
  const parsedFeedbackId = Number(feedbackId);

  if (
    !Number.isInteger(parsedCourseId) ||
    parsedCourseId <= 0 ||
    !Number.isInteger(parsedFeedbackId) ||
    parsedFeedbackId <= 0
  ) {
    notFound();
  }

  let courses = [] as Awaited<ReturnType<typeof getUserCourses>>;
  let feedback: MoodleFeedback | undefined;
  let items: MoodleFeedbackItem[] = [];
  let errorMessage: string | null = null;
  let expiredSession = false;
  let courseAccess: MoodleCourseAccessProfile | null = null;

  try {
    const [coursesResult, feedbacks, feedbackItems, accessProfile] =
      await Promise.all([
      getUserCourses(session.token, session.userId),
      getFeedbacksByCourses(session.token, [parsedCourseId]),
      getFeedbackItems(session.token, parsedFeedbackId).catch(() => []),
      resolveUserAccessProfile(session.token, session.userId).catch(
        () => null
      ),
    ]);

    courses = coursesResult;
    feedback = feedbacks.find((f) => f.id === parsedFeedbackId);
    items = feedbackItems;
    courseAccess =
      accessProfile?.courseCapabilities.find(
        (item) => item.courseId === parsedCourseId
      ) || null;
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Feedback detail load failed", {
      userId: session.userId,
      courseId: parsedCourseId,
      feedbackId: parsedFeedbackId,
      error,
    });
    errorMessage = "No se pudo cargar la encuesta.";
  }

  const course = courses.find((item) => item.id === parsedCourseId);

  if (!course && !errorMessage) {
    notFound();
  }

  if (!feedback && !errorMessage) {
    notFound();
  }

  const badge = feedback ? statusBadge(feedback) : null;
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
    <div className="flex min-h-screen flex-col">
      <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          sectionLabel="Encuesta"
          actions={
            <LinkButton href={`/mis-cursos/${parsedCourseId}`} variant="ghost" size="sm">Volver</LinkButton>
          }
      />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-5 py-6 md:px-8 md:py-8">

        <div>
          <div
            className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getCourseRoleTone(effectiveCourseAccess.roleBucket)}`}
          >
            {getCourseRoleLabel(effectiveCourseAccess.roleBucket)}
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
              {feedback?.name || "Encuesta"}
            </h1>
            {badge ? (
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
              >
                {badge.label}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {course?.fullname || "Curso"}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
            {effectiveCourseAccess.roleBucket === "student"
              ? "Esta vista está orientada a consultar la encuesta y su estructura desde tu acceso de alumno."
              : "Esta vista mantiene el flujo visible para el alumno, pero ya refleja tu rol real dentro del curso."}
          </p>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            {expiredSession
              ? "La sesion ya no es valida."
              : errorMessage}
          </div>
        ) : null}

        {feedback?.intro ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Descripcion</h2>
              <Separator className="my-3" />
              <RichHtml
                html={feedback.intro}
                className="text-sm leading-7 text-[var(--color-muted)]"
              />
            </CardContent>
          </Card>
        ) : null}

        <Card className="rounded-xl">
          <CardContent className="px-5 py-5 md:px-6">
            <h2 className="text-lg font-semibold">Informacion</h2>
            <Separator className="my-3" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {feedback?.timeOpen ? (
                <div>
                  <p className="text-xs text-[var(--color-muted)]">
                    Abierta desde
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-foreground)]">
                    {formatDate(feedback.timeOpen)}
                  </p>
                </div>
              ) : null}
              {feedback?.timeClose ? (
                <div>
                  <p className="text-xs text-[var(--color-muted)]">Cierra</p>
                  <p className="mt-1 text-sm text-[var(--color-foreground)]">
                    {formatDate(feedback.timeClose)}
                  </p>
                </div>
              ) : null}
              {feedback ? (
                <div>
                  <p className="text-xs text-[var(--color-muted)]">Estado</p>
                  <p className="mt-1 text-sm text-[var(--color-foreground)]">
                    {feedback.isAlreadySubmitted
                      ? "Ya completada"
                      : feedback.isOpen
                        ? "Pendiente"
                        : "Cerrada"}
                  </p>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {items.length > 0 ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Preguntas</h2>
              <Separator className="my-3" />
              <div className="flex flex-col gap-3">
                {items
                  .sort((a, b) => a.position - b.position)
                  .map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 rounded-lg px-4 py-3"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface-strong)] text-xs font-semibold text-[var(--color-muted)]">
                        {index + 1}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm text-[var(--color-foreground)]">
                          {item.name}
                        </span>
                        {item.label ? (
                          <span className="text-xs text-[var(--color-muted)]">
                            {item.label}
                          </span>
                        ) : null}
                        <span className="text-xs text-[var(--color-muted)]">
                          Tipo: {item.type}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>

              <p className="mt-5 rounded-lg border border-[var(--color-muted)]/20 bg-[var(--color-muted)]/5 px-4 py-3 text-xs leading-5 text-[var(--color-muted)]">
                Las encuestas se completan en la plataforma principal.
              </p>
            </CardContent>
          </Card>
        ) : !errorMessage ? (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            No hay preguntas disponibles para esta encuesta.
          </p>
        ) : null}
      </main>
    </div>
  );
}
