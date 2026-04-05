import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { startQuizAttemptAction, submitQuizAttemptAction } from "@/app/actions/quiz";
import { AppTopbar } from "@/app/components/app-topbar";
import { CourseRoleActionGrid } from "@/app/components/course-role-action-grid";
import { QuizFormButton } from "@/app/components/quiz-form-button";
import { QuizQuestionHtml } from "@/app/components/quiz-question-html";
import { RichHtml } from "@/app/components/rich-html";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { logger } from "@/lib/logger";
import {
  getCourseParticipants,
  getQuizAccessInformation,
  getQuizAttemptData,
  getQuizAttemptReview,
  getQuizAttemptSummary,
  getQuizUserAttempts,
  getQuizzesByCourses,
  getUserCourses,
  isAccessException,
  isAuthenticationError,
  resolveUserAccessProfile,
  viewQuiz,
  viewQuizAttempt,
  viewQuizAttemptReview,
  viewQuizAttemptSummary,
} from "@/lib/moodle";
import type {
  MoodleQuiz,
  MoodleQuizAttempt,
  MoodleQuizAttemptData,
  MoodleQuizAttemptReview,
  MoodleQuizAccessInformation,
  MoodleCourseAccessProfile,
  MoodleCourseParticipant,
} from "@/lib/moodle";
import {
  getActivityRoleActions,
  getCourseRoleLabel,
  getCourseRoleTone,
  shouldShowStudentParticipationActions,
} from "@/lib/course-roles";
import { getSession } from "@/lib/session";

type QuizDetailPageProps = {
  params: Promise<{
    courseId: string;
    quizId: string;
  }>;
  searchParams: Promise<{
    attempt?: string;
    page?: string;
    review?: string;
    user?: string;
    view?: string;
    quizError?: string;
    quizNotice?: string;
  }>;
};

function parsePositiveInt(raw?: string) {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function parseNonNegativeInt(raw?: string, fallback = 0) {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function buildQuizRoute(
  courseId: number,
  quizId: number,
  search: Record<string, string | number | null | undefined>
) {
  const params = new URLSearchParams();

  Object.entries(search).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      return;
    }

    params.set(key, String(value));
  });

  const query = params.toString();
  const pathname = `/mis-cursos/${courseId}/quiz/${quizId}`;
  return query ? `${pathname}?${query}` : pathname;
}

function formatDate(value?: number) {
  if (!value) return null;
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value * 1000));
}

function formatDuration(seconds?: number) {
  if (!seconds) return null;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return remainMins > 0 ? `${hrs} h ${remainMins} min` : `${hrs} h`;
}

function attemptStateBadge(state: MoodleQuizAttempt["state"]) {
  switch (state) {
    case "notstarted":
      return {
        label: "Sin iniciar",
        className: "border-[var(--accent-cool)]/20 bg-[var(--accent-cool)]/10 text-[var(--accent-cool)]",
      };
    case "finished":
      return {
        label: "Finalizado",
        className: "border-[var(--success-soft)] bg-[var(--success-soft)] text-[var(--success)]",
      };
    case "inprogress":
      return {
        label: "En curso",
        className: "border-[var(--warning-soft)] bg-[var(--warning-soft)] text-[var(--warning)]",
      };
    case "overdue":
      return {
        label: "Vencido",
        className: "border-[var(--color-danger)]/20 bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
      };
    case "submitted":
      return {
        label: "Entregado",
        className: "border-[var(--accent-cool)]/20 bg-[var(--accent-cool)]/10 text-[var(--accent-cool)]",
      };
    case "abandoned":
      return {
        label: "Abandonado",
        className: "border-[var(--line)] bg-[var(--surface-strong)] text-[var(--color-muted)]",
      };
  }
}

function summaryStatusLabel(status?: string) {
  if (!status) {
    return "Pendiente";
  }

  return status;
}

function getUnsupportedQuestionTypes(accessInfo?: MoodleQuizAccessInformation) {
  if (!accessInfo) {
    return [];
  }

  if (
    accessInfo.questionTypes.length === 0 ||
    accessInfo.plainHtmlQuestionTypes.length === 0
  ) {
    return [];
  }

  return accessInfo.questionTypes.filter(
    (type) => !accessInfo.plainHtmlQuestionTypes.includes(type)
  );
}

function getParticipantRoleSummary(participant?: MoodleCourseParticipant) {
  if (!participant || participant.roles.length === 0) {
    return "Sin roles visibles";
  }

  return participant.roles.map((role) => role.name).join(", ");
}

export default async function QuizDetailPage({
  params,
  searchParams,
}: QuizDetailPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const { courseId, quizId } = await params;
  const query = await searchParams;
  const parsedCourseId = Number(courseId);
  const parsedQuizId = Number(quizId);

  if (
    !Number.isInteger(parsedCourseId) ||
    parsedCourseId <= 0 ||
    !Number.isInteger(parsedQuizId) ||
    parsedQuizId <= 0
  ) {
    notFound();
  }

  const requestedAttemptId = parsePositiveInt(query.attempt);
  const requestedReviewId = parsePositiveInt(query.review);
  const requestedParticipantId = parsePositiveInt(query.user);
  const requestedPage = parseNonNegativeInt(query.page, 0);
  const wantsSummary = query.view === "summary";
  const returnPath = buildQuizRoute(parsedCourseId, parsedQuizId, {});

  let courses = [] as Awaited<ReturnType<typeof getUserCourses>>;
  let quiz: MoodleQuiz | undefined;
  let attempts: MoodleQuizAttempt[] = [];
  let participants: MoodleCourseParticipant[] = [];
  let accessInfo: MoodleQuizAccessInformation | undefined;
  let attemptData: MoodleQuizAttemptData | null = null;
  let attemptReview: MoodleQuizAttemptReview | null = null;
  let attemptSummary: Awaited<ReturnType<typeof getQuizAttemptSummary>> | null =
    null;
  let selectedParticipantId: number | undefined;
  let selectedParticipant: MoodleCourseParticipant | undefined;
  let participantsAccessError: string | null = null;
  let attemptsAccessError: string | null = null;
  let errorMessage: string | null = null;
  let expiredSession = false;
  let courseAccess: MoodleCourseAccessProfile | null = null;

  try {
    const [coursesResult, quizzes, accessResult, accessProfile] =
      await Promise.all([
        getUserCourses(session.token, session.userId),
        getQuizzesByCourses(session.token, [parsedCourseId]),
        getQuizAccessInformation(session.token, parsedQuizId),
        resolveUserAccessProfile(session.token, session.userId).catch(() => null),
      ]);

    courses = coursesResult;
    quiz = quizzes.find((q) => q.id === parsedQuizId);
    accessInfo = accessResult;
    courseAccess =
      accessProfile?.courseCapabilities.find(
        (course) => course.courseId === parsedCourseId
      ) || null;
    const canParticipateAsStudentRole =
      (courseAccess?.roleBucket || "student") === "student";

    await viewQuiz(session.token, parsedQuizId).catch(() => undefined);

    if (canParticipateAsStudentRole) {
      attempts = await getQuizUserAttempts(
        session.token,
        parsedQuizId,
        session.userId
      ).catch(() => []);

      const activeAttempt =
        (requestedAttemptId
          ? attempts.find((attempt) => attempt.id === requestedAttemptId)
          : undefined) ||
        attempts
          .filter(
            (attempt) =>
              attempt.state === "inprogress" || attempt.state === "overdue"
          )
          .sort((a, b) => (b.attemptNumber ?? 0) - (a.attemptNumber ?? 0))[0];

      if (requestedReviewId) {
        await viewQuizAttemptReview(session.token, requestedReviewId).catch(
          () => undefined
        );
        attemptReview = await getQuizAttemptReview(
          session.token,
          requestedReviewId,
          -1
        );
      } else if (activeAttempt && wantsSummary) {
        await viewQuizAttemptSummary(session.token, activeAttempt.id).catch(
          () => undefined
        );
        attemptSummary = await getQuizAttemptSummary(
          session.token,
          activeAttempt.id
        );
      } else if (activeAttempt) {
        await viewQuizAttempt(
          session.token,
          activeAttempt.id,
          requestedPage
        ).catch(() => undefined);
        attemptData = await getQuizAttemptData(
          session.token,
          activeAttempt.id,
          requestedPage
        );
      }
    } else if (accessResult.canViewReports || accessResult.canManage) {
      try {
        participants = await getCourseParticipants(session.token, parsedCourseId);
      } catch (participantsError) {
        if (isAccessException(participantsError)) {
          participantsAccessError =
            "Tu cuenta no puede consultar los participantes de este curso.";
        } else {
          logger.warn("Quiz participants load failed", {
            userId: session.userId,
            courseId: parsedCourseId,
            quizId: parsedQuizId,
            error: participantsError,
          });
          participantsAccessError =
            "No se pudieron cargar los participantes para revisar el cuestionario.";
        }
      }

      selectedParticipantId = requestedParticipantId ?? participants[0]?.id;
      selectedParticipant = participants.find(
        (participant) => participant.id === selectedParticipantId
      );

      if (selectedParticipantId) {
        try {
          attempts = await getQuizUserAttempts(
            session.token,
            parsedQuizId,
            selectedParticipantId
          );
        } catch (participantAttemptsError) {
          if (isAccessException(participantAttemptsError)) {
            attemptsAccessError =
              "Tu cuenta no puede consultar los intentos de este participante.";
          } else {
            logger.warn("Quiz participant attempts load failed", {
              userId: session.userId,
              courseId: parsedCourseId,
              quizId: parsedQuizId,
              participantId: selectedParticipantId,
              error: participantAttemptsError,
            });
            attemptsAccessError =
              "No se pudieron cargar los intentos del participante seleccionado.";
          }
        }

        if (requestedReviewId) {
          try {
            await viewQuizAttemptReview(session.token, requestedReviewId).catch(
              () => undefined
            );
            attemptReview = await getQuizAttemptReview(
              session.token,
              requestedReviewId,
              -1
            );
          } catch (reviewError) {
            if (isAccessException(reviewError)) {
              attemptsAccessError =
                "Tu cuenta no puede revisar ese intento desde la app.";
            } else {
              logger.warn("Quiz attempt review load failed", {
                userId: session.userId,
                courseId: parsedCourseId,
                quizId: parsedQuizId,
                participantId: selectedParticipantId,
                reviewId: requestedReviewId,
                error: reviewError,
              });
              attemptsAccessError =
                "No se pudo cargar la revisión del intento seleccionado.";
            }
          }
        }
      }
    } else {
      attemptsAccessError =
        "Tu acceso actual no puede consultar intentos de otros participantes en este cuestionario.";
    }
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Quiz detail load failed", {
      userId: session.userId,
      courseId: parsedCourseId,
      quizId: parsedQuizId,
      error,
    });
    errorMessage = "No se pudo cargar el cuestionario.";
  }

  const course = courses.find((item) => item.id === parsedCourseId);

  if (!course && !errorMessage) {
    notFound();
  }

  if (!quiz && !errorMessage) {
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

  const actionError = query.quizError || null;
  const actionNotice = query.quizNotice || null;
  const canParticipateAsStudent = shouldShowStudentParticipationActions(
    effectiveCourseAccess
  );
  const unsupportedQuestionTypes = getUnsupportedQuestionTypes(accessInfo);
  const canRenderInApp = unsupportedQuestionTypes.length === 0;
  const requiresPreflight = accessInfo?.isPreflightCheckRequired ?? false;
  const supportsAttemptRuntime = canRenderInApp && !requiresPreflight;
  const activeAttempt =
    attemptData?.attempt ||
    (requestedAttemptId
      ? attempts.find((attempt) => attempt.id === requestedAttemptId)
      : undefined) ||
    attempts
      .filter(
        (attempt) =>
          attempt.state === "inprogress" || attempt.state === "overdue"
      )
      .sort((a, b) => b.attemptNumber - a.attemptNumber)[0];

  const bestAttempt = attempts
    .filter((a) => a.state === "finished" && a.grade !== undefined)
    .sort((a, b) => (b.grade ?? 0) - (a.grade ?? 0))[0];

  const canStartAttempt =
    canParticipateAsStudent &&
    Boolean(accessInfo?.canAttempt) &&
    !accessInfo?.isFinished &&
    (accessInfo?.preventAccessReasons.length || 0) === 0 &&
    (accessInfo?.preventNewAttemptReasons.length || 0) === 0 &&
    !activeAttempt &&
    supportsAttemptRuntime;

  const currentAttemptPath = activeAttempt
    ? buildQuizRoute(parsedCourseId, parsedQuizId, {
        attempt: activeAttempt.id,
        page:
          attemptData?.attempt.currentPage ??
          activeAttempt.currentPage ??
          requestedPage,
      })
    : returnPath;
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
        ? "Accesos rápidos para intentar, continuar o revisar el cuestionario."
        : "Accesos disponibles hoy para seguir el cuestionario desde tu rol real en el curso.",
    tone:
      effectiveCourseAccess.roleBucket === "student"
        ? "success"
        : effectiveCourseAccess.roleBucket === "course_manager"
          ? "warning"
          : "accent",
    actions: getActivityRoleActions({
      courseId: parsedCourseId,
      courseAccess: effectiveCourseAccess,
      activityType: "quiz",
    }),
  } as const;
  const selectedParticipantAttempts = attempts;
  const selectedParticipantBestAttempt = selectedParticipantAttempts
    .filter((attempt) => attempt.grade !== undefined)
    .sort((a, b) => (b.grade ?? 0) - (a.grade ?? 0))[0];
  const selectedParticipantLatestAttempt = selectedParticipantAttempts
    .slice()
    .sort(
      (a, b) =>
        (b.timeFinish || b.timeStart || 0) - (a.timeFinish || a.timeStart || 0)
    )[0];
  const selectedParticipantActiveAttempt = selectedParticipantAttempts.find(
    (attempt) =>
      attempt.state === "inprogress" ||
      attempt.state === "overdue" ||
      attempt.state === "submitted"
  );

  return (
    <main className="flex min-h-screen flex-1 px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          sectionLabel="Cuestionario"
          actions={
            <div className="flex items-center gap-3">
              {!canParticipateAsStudent ? (
                <Link
                  href={`/mis-cursos/${parsedCourseId}/reportes`}
                  className="text-[var(--muted)] transition hover:text-[var(--foreground)]"
                >
                  Reportes
                </Link>
              ) : null}
              <Link
                href={`/mis-cursos/${parsedCourseId}`}
                className="text-[var(--muted)] transition hover:text-[var(--foreground)]"
              >
                Volver
              </Link>
            </div>
          }
        />

        <div>
          <div className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getCourseRoleTone(effectiveCourseAccess.roleBucket)}`}>
            {getCourseRoleLabel(effectiveCourseAccess.roleBucket)}
          </div>
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            {quiz?.name || "Cuestionario"}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {course?.fullname || "Curso"}
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
            {effectiveCourseAccess.roleBucket === "student"
              ? "La vista está orientada a realizar, seguir y revisar tus intentos."
              : "La vista prioriza seguimiento y revisión de intentos según tu rol real en el curso."}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--color-foreground)]">
            {quiz?.timeLimit ? (
              <span>Tiempo límite: {formatDuration(quiz.timeLimit)}</span>
            ) : null}
            <span>
              Intentos: {attempts.length}
              {quiz?.maxAttempts ? ` / ${quiz.maxAttempts}` : " / ilimitados"}
            </span>
            {bestAttempt && quiz?.maxGrade ? (
              <span>
                Mejor nota: {bestAttempt.grade?.toFixed(2)} / {quiz.maxGrade}
              </span>
            ) : null}
          </div>
        </div>

        <CourseRoleActionGrid sections={[roleActionSection]} />

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            {expiredSession
              ? "La sesión ya no es válida."
              : "No se pudo cargar el cuestionario."}
          </div>
        ) : null}

        {actionError ? (
          <div className="banner-danger">{actionError}</div>
        ) : null}

        {actionNotice ? (
          <div className="banner-success">{actionNotice}</div>
        ) : null}

        {participantsAccessError ? (
          <div className="banner-warning">
            {participantsAccessError}
          </div>
        ) : null}

        {attemptsAccessError ? (
          <div className="banner-warning">
            {attemptsAccessError}
          </div>
        ) : null}

        {unsupportedQuestionTypes.length > 0 ? (
          <div className="banner-warning">
            Este cuestionario usa tipos de pregunta que no son compatibles con
            el renderizado seguro en la app:{" "}
            {unsupportedQuestionTypes.join(", ")}. Puedes consultar la
            información aquí, pero el intento debe completarse en la plataforma
            principal.
          </div>
        ) : null}

        {requiresPreflight ? (
          <div className="banner-warning">
            Este cuestionario requiere una comprobación previa, como una clave
            de acceso. En este primer corte el intento debe continuarse en la
            plataforma principal para no perder esa validación entre páginas.
          </div>
        ) : null}

        {quiz?.intro ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Descripción</h2>
              <Separator className="my-3" />
              <RichHtml
                html={quiz.intro}
                className="text-sm leading-7 text-[var(--color-muted)]"
              />
            </CardContent>
          </Card>
        ) : null}

        <Card className="rounded-xl">
          <CardContent className="px-5 py-5 md:px-6">
            <h2 className="text-lg font-semibold">Información</h2>
            <Separator className="my-3" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quiz?.openTime ? (
                <div>
                  <p className="text-xs text-[var(--color-muted)]">
                    Abierto desde
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-foreground)]">
                    {formatDate(quiz.openTime)}
                  </p>
                </div>
              ) : null}
              {quiz?.closeTime ? (
                <div>
                  <p className="text-xs text-[var(--color-muted)]">Cierra</p>
                  <p className="mt-1 text-sm text-[var(--color-foreground)]">
                    {formatDate(quiz.closeTime)}
                  </p>
                </div>
              ) : null}
              {quiz?.timeLimit ? (
                <div>
                  <p className="text-xs text-[var(--color-muted)]">Duración</p>
                  <p className="mt-1 text-sm text-[var(--color-foreground)]">
                    {formatDuration(quiz.timeLimit)}
                  </p>
                </div>
              ) : null}
              {quiz?.maxGrade ? (
                <div>
                  <p className="text-xs text-[var(--color-muted)]">
                    Nota máxima
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-foreground)]">
                    {quiz.maxGrade}
                  </p>
                </div>
              ) : null}
            </div>

            {accessInfo?.accessRules.length ? (
              <div className="mt-5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-soft)] px-4 py-3 text-xs leading-5 text-[var(--color-muted)]">
                <p className="font-medium text-[var(--color-foreground)]">
                  Reglas de acceso
                </p>
                <ul className="mt-2 list-disc pl-5">
                  {accessInfo.accessRules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-5 rounded-lg border border-[var(--color-muted)]/20 bg-[var(--color-muted)]/5 px-4 py-3 text-xs leading-5 text-[var(--color-muted)]">
                Los cuestionarios ahora pueden realizarse directamente desde la
                app cuando el tipo de preguntas es compatible.
              </p>
            )}

            {accessInfo?.preventAccessReasons.length ? (
              <div className="mt-4 rounded-lg border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/8 px-4 py-3 text-sm text-[var(--color-warning)]">
                {accessInfo.preventAccessReasons.map((reason) => (
                  <p key={reason}>{reason}</p>
                ))}
              </div>
            ) : null}

            {accessInfo?.preventNewAttemptReasons.length &&
            !activeAttempt &&
            !accessInfo?.isFinished ? (
              <div className="mt-4 rounded-lg border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/8 px-4 py-3 text-sm text-[var(--color-warning)]">
                {accessInfo.preventNewAttemptReasons.map((reason) => (
                  <p key={reason}>{reason}</p>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {canStartAttempt ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Comenzar intento</h2>
              <Separator className="my-3" />
              <form action={startQuizAttemptAction} className="flex flex-col gap-4">
                <input type="hidden" name="quizId" value={parsedQuizId} />
                <input type="hidden" name="returnPath" value={returnPath} />

                <div className="flex items-center gap-3">
                  <QuizFormButton
                    intent="start"
                    label="Iniciar intento"
                    pendingLabel="Iniciando..."
                    variant="primary"
                  />
                </div>
              </form>
            </CardContent>
          </Card>
        ) : null}

        {!canParticipateAsStudent ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Seguimiento del cuestionario</h2>
              <Separator className="my-3" />
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                El inicio y envío de intentos se ocultan porque esta vista está
                priorizando seguimiento y revisión según tu rol actual en el
                curso.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {!canParticipateAsStudent ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    Participantes para revisión
                  </h2>
                  <Separator className="my-3" />
                  <p className="text-sm leading-7 text-[var(--color-muted)]">
                    Selecciona un participante para consultar sus intentos y abrir la revisión de los que ya estén finalizados.
                  </p>
                </div>

                {participants.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {participants.map((participant) => {
                        const isSelected =
                          participant.id === selectedParticipantId;

                        return (
                          <Link
                            key={participant.id}
                            href={buildQuizRoute(parsedCourseId, parsedQuizId, {
                              user: participant.id,
                            })}
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition ${
                              isSelected
                                ? "border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                                : "border-[var(--color-line)] text-[var(--color-muted)] hover:border-[var(--color-accent)]/30 hover:text-[var(--color-foreground)]"
                            }`}
                          >
                            {participant.fullName}
                          </Link>
                        );
                      })}
                    </div>

                    {selectedParticipant ? (
                      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-[var(--color-foreground)]">
                              {selectedParticipant.fullName}
                            </p>
                            <p className="mt-1 text-sm text-[var(--color-muted)]">
                              {getParticipantRoleSummary(selectedParticipant)}
                            </p>
                          </div>

                          <div className="text-sm text-[var(--color-muted)] md:text-right">
                            <p>
                              Intentos visibles:{" "}
                              <span className="font-medium text-[var(--color-foreground)]">
                                {attempts.length}
                              </span>
                            </p>
                            {selectedParticipant.lastAccess ? (
                              <p className="mt-1">
                                Último acceso: {formatDate(selectedParticipant.lastAccess)}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-soft)] px-3 py-3">
                            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                              Intentos
                            </p>
                            <p className="mt-1 text-lg font-semibold text-[var(--color-foreground)]">
                              {selectedParticipantAttempts.length}
                            </p>
                          </div>
                          <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-soft)] px-3 py-3">
                            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                              Estado actual
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[var(--color-foreground)]">
                              {selectedParticipantActiveAttempt
                                ? attemptStateBadge(selectedParticipantActiveAttempt.state).label
                                : "Sin intento activo"}
                            </p>
                          </div>
                          <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-soft)] px-3 py-3">
                            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                              Mejor intento
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[var(--color-foreground)]">
                              {selectedParticipantBestAttempt?.grade !== undefined
                                ? `${selectedParticipantBestAttempt.grade.toFixed(2)}${quiz?.maxGrade ? ` / ${quiz.maxGrade}` : ""}`
                                : "Sin nota visible"}
                            </p>
                          </div>
                          <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-soft)] px-3 py-3">
                            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                              Última actividad
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[var(--color-foreground)]">
                              {formatDate(
                                selectedParticipantLatestAttempt?.timeFinish ||
                                  selectedParticipantLatestAttempt?.timeStart
                              ) || "Sin actividad"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm leading-7 text-[var(--color-muted)]">
                    No hay participantes visibles para este cuestionario con el acceso actual.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {attemptData && supportsAttemptRuntime && canParticipateAsStudent ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    Intento {attemptData.attempt.attemptNumber}
                  </h2>
                  <p className="text-sm text-[var(--color-muted)]">
                    Página {requestedPage + 1}
                    {attemptData.nextPage >= 0
                      ? ` · Siguiente página: ${attemptData.nextPage + 1}`
                      : " · Última página"}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    attemptStateBadge(attemptData.attempt.state).className
                  }`}
                >
                  {attemptStateBadge(attemptData.attempt.state).label}
                </span>
              </div>

              {attemptData.messages.length > 0 ? (
                <div className="mt-4 rounded-lg border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/8 px-4 py-3 text-sm text-[var(--color-warning)]">
                  {attemptData.messages.map((message) => (
                    <p key={message}>{message}</p>
                  ))}
                </div>
              ) : null}

              <Separator className="my-4" />

              <form action={submitQuizAttemptAction} className="flex flex-col gap-5">
                <input type="hidden" name="attemptId" value={attemptData.attempt.id} />
                <input type="hidden" name="returnPath" value={returnPath} />
                <input type="hidden" name="page" value={requestedPage} />
                <input type="hidden" name="nextPage" value={attemptData.nextPage} />

                {attemptData.questions.map((question) => (
                  <div
                    key={`${question.slot}-${question.page ?? requestedPage}`}
                    className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-foreground)]">
                          {question.number
                            ? `Pregunta ${question.number}`
                            : `Pregunta ${question.slot}`}
                        </p>
                        {question.status ? (
                          <p className="text-xs text-[var(--color-muted)]">
                            {question.status}
                          </p>
                        ) : null}
                      </div>
                      {question.mark ? (
                        <span className="text-xs text-[var(--color-muted)]">
                          {question.mark}
                        </span>
                      ) : null}
                    </div>

                    <QuizQuestionHtml html={question.html} />
                  </div>
                ))}

                <div className="flex flex-wrap gap-3">
                  <QuizFormButton
                    intent="save"
                    label="Guardar"
                    pendingLabel="Guardando..."
                    variant="outline"
                  />
                  {requestedPage > 0 ? (
                    <QuizFormButton
                      intent="previous"
                      label="Página anterior"
                      pendingLabel="Volviendo..."
                      variant="ghost"
                    />
                  ) : null}
                  {attemptData.nextPage >= 0 ? (
                    <QuizFormButton
                      intent="next"
                      label="Siguiente página"
                      pendingLabel="Procesando..."
                      variant="primary"
                    />
                  ) : (
                    <QuizFormButton
                      intent="summary"
                      label="Ver resumen"
                      pendingLabel="Preparando resumen..."
                      variant="primary"
                    />
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        ) : null}

        {attemptSummary &&
        activeAttempt &&
        supportsAttemptRuntime &&
        canParticipateAsStudent ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Resumen del intento</h2>
              <Separator className="my-3" />

              <div className="flex flex-col gap-2">
                {attemptSummary.questions.map((question) => (
                  <div
                    key={question.slot}
                    className="flex items-center justify-between rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--color-foreground)]">
                        Pregunta {question.slot}
                      </p>
                      {question.type ? (
                        <p className="text-xs text-[var(--color-muted)]">
                          {question.type}
                        </p>
                      ) : null}
                    </div>
                    <span className="text-xs text-[var(--color-muted)]">
                      {summaryStatusLabel(question.status)}
                    </span>
                  </div>
                ))}
              </div>

              <form action={submitQuizAttemptAction} className="mt-5 flex flex-wrap gap-3">
                <input type="hidden" name="attemptId" value={activeAttempt.id} />
                <input type="hidden" name="returnPath" value={returnPath} />
                <input type="hidden" name="page" value={activeAttempt.currentPage ?? 0} />
                <QuizFormButton
                  intent="finish"
                  label="Enviar intento"
                  pendingLabel="Enviando..."
                  variant="primary"
                />
                <Link
                  href={currentAttemptPath}
                  className="inline-flex items-center rounded-full border border-[var(--color-line)] px-3 py-1 text-sm font-medium text-[var(--color-muted)] transition hover:border-[var(--color-accent)]/30 hover:text-[var(--color-foreground)]"
                >
                  Volver al intento
                </Link>
              </form>
            </CardContent>
          </Card>
        ) : null}

        {attemptReview ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Revisión del intento</h2>
                  <p className="text-sm text-[var(--color-muted)]">
                    Intento {attemptReview.attempt.attemptNumber}
                    {!canParticipateAsStudent && selectedParticipant
                      ? ` · ${selectedParticipant.fullName}`
                      : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    attemptStateBadge(attemptReview.attempt.state).className
                  }`}
                >
                  {attemptStateBadge(attemptReview.attempt.state).label}
                </span>
              </div>

              <Separator className="my-4" />

              <div className="flex flex-col gap-5">
                {attemptReview.questions.map((question) => (
                  <div
                    key={`${question.slot}-${question.page ?? "review"}`}
                    className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-foreground)]">
                          {question.number
                            ? `Pregunta ${question.number}`
                            : `Pregunta ${question.slot}`}
                        </p>
                        {question.status ? (
                          <p className="text-xs text-[var(--color-muted)]">
                            {question.status}
                          </p>
                        ) : null}
                      </div>
                      {question.mark ? (
                        <span className="text-xs text-[var(--color-muted)]">
                          {question.mark}
                        </span>
                      ) : null}
                    </div>

                    <QuizQuestionHtml html={question.html} />
                  </div>
                ))}
              </div>

              {attemptReview.additionalData.length > 0 ? (
                <div className="mt-5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
                  <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
                    Información adicional
                  </h3>
                  <div className="mt-3 flex flex-col gap-3">
                    {attemptReview.additionalData.map((item) => (
                      <div key={item.id || item.title}>
                        <p className="text-xs font-medium text-[var(--color-muted)]">
                          {item.title}
                        </p>
                        <RichHtml
                          html={item.content}
                          className="mt-1 text-sm text-[var(--color-foreground)]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {attempts.length > 0 ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">
                {canParticipateAsStudent
                  ? "Historial de intentos"
                  : selectedParticipant
                    ? `Intentos de ${selectedParticipant.fullName}`
                    : "Intentos del participante"}
              </h2>
              <Separator className="my-3" />
              <div className="flex flex-col gap-1">
                {attempts.map((attempt) => {
                  const badge = attemptStateBadge(attempt.state);

                  return (
                    <div
                      key={attempt.id}
                      className="flex flex-col gap-3 rounded-lg border border-transparent px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-[var(--color-foreground)]">
                          Intento {attempt.attemptNumber}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        {attempt.timeStart ? (
                          <span className="text-xs text-[var(--color-muted)]">
                            {formatDate(attempt.timeStart)}
                          </span>
                        ) : null}
                        {attempt.grade !== undefined && quiz?.maxGrade ? (
                          <span className="text-sm font-semibold text-[var(--color-accent)]">
                            {attempt.grade.toFixed(2)} / {quiz.maxGrade}
                          </span>
                        ) : null}
                        {attempt.state === "finished" &&
                        (canParticipateAsStudent
                          ? accessInfo?.canReviewMyAttempts
                          : accessInfo?.canViewReports || accessInfo?.canManage) ? (
                          <Link
                            href={buildQuizRoute(parsedCourseId, parsedQuizId, {
                              user: selectedParticipantId,
                              review: attempt.id,
                            })}
                            className="inline-flex items-center rounded-full border border-[var(--color-line)] px-3 py-1 text-sm font-medium text-[var(--color-muted)] transition hover:border-[var(--color-accent)]/30 hover:text-[var(--color-foreground)]"
                          >
                            Ver revisión
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : !errorMessage ? (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            {canParticipateAsStudent
              ? "No hay intentos registrados para este cuestionario."
              : selectedParticipant
                ? `No hay intentos registrados para ${selectedParticipant.fullName}.`
                : "Selecciona un participante para consultar sus intentos."}
          </p>
        ) : null}
      </div>
    </main>
  );
}
