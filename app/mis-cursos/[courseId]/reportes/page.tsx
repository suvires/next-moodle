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
  getCourseContents,
  getCourseParticipants,
  getCourseUpdatesSince,
  getForumDiscussions,
  getForumsByCourses,
  getQuizUserAttempts,
  getQuizzesByCourses,
  getUserCourses,
  isAccessException,
  isAuthenticationError,
  resolveUserAccessProfile,
  type MoodleAssignment,
  type MoodleAssignmentGradeRecord,
  type MoodleAssignmentSubmissionRecord,
  type MoodleCourseAccessProfile,
  type MoodleCourseParticipant,
  type MoodleForum,
  type MoodleForumDiscussion,
  type MoodleQuiz,
  type MoodleQuizAttempt,
} from "@/lib/moodle";
import {
  getCourseOverviewActionSections,
  getCourseRoleLabel,
  getCourseRoleTone,
} from "@/lib/course-roles";
import { getSession } from "@/lib/session";

type ReportsPageProps = {
  params: Promise<{
    courseId: string;
  }>;
};

function formatDate(value?: number) {
  if (!value) return null;
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value * 1000));
}

function summarizeAssignment(
  assignment: MoodleAssignment,
  submissions: MoodleAssignmentSubmissionRecord[],
  grades: MoodleAssignmentGradeRecord[]
) {
  const submitted = submissions.filter((item) => item.status === "submitted").length;
  const drafts = submissions.filter((item) => item.status === "draft").length;
  const graded = grades.filter((grade) => Boolean(grade.grade)).length;
  const latestSubmission =
    submissions.reduce((latest, item) => {
      const current = item.timeModified || item.timeCreated || 0;
      return current > latest ? current : latest;
    }, 0) || undefined;
  const latestReview =
    grades.reduce((latest, grade) => {
      const current = grade.timeModified || grade.timeCreated || 0;
      return current > latest ? current : latest;
    }, 0) || undefined;

  return {
    assignment,
    total: submissions.length,
    submitted,
    drafts,
    graded,
    pendingReview: Math.max(submitted - graded, 0),
    latestSubmission,
    latestReview,
  };
}

function summarizeQuiz(
  quiz: MoodleQuiz,
  attempts: MoodleQuizAttempt[],
  participantsWithAttempts: number
) {
  const finished = attempts.filter((attempt) => attempt.state === "finished").length;
  const active = attempts.filter(
    (attempt) =>
      attempt.state === "inprogress" ||
      attempt.state === "overdue" ||
      attempt.state === "submitted"
  ).length;
  const bestGrade = attempts
    .filter((attempt) => attempt.grade !== undefined)
    .sort((a, b) => (b.grade ?? 0) - (a.grade ?? 0))[0]?.grade;
  const latestActivity =
    attempts.reduce((latest, attempt) => {
      const current = attempt.timeFinish || attempt.timeStart || 0;
      return current > latest ? current : latest;
    }, 0) || undefined;

  return {
    quiz,
    totalAttempts: attempts.length,
    finished,
    active,
    participantsWithAttempts,
    bestGrade,
    latestActivity,
  };
}

function summarizeForum(
  forum: MoodleForum,
  discussions: MoodleForumDiscussion[]
) {
  const unanswered = discussions.filter((discussion) => discussion.repliesCount === 0).length;
  const pinned = discussions.filter((discussion) => discussion.pinned).length;
  const locked = discussions.filter((discussion) => discussion.locked).length;
  const latestActivity =
    discussions.reduce((latest, discussion) => {
      const current =
        discussion.modifiedAt || discussion.startedAt || discussion.createdAt || 0;
      return current > latest ? current : latest;
    }, 0) || undefined;

  return {
    forum,
    totalDiscussions: discussions.length,
    unanswered,
    pinned,
    locked,
    latestActivity,
  };
}

export default async function CourseReportsPage({ params }: ReportsPageProps) {
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
  let courseAccess: MoodleCourseAccessProfile | null = null;
  let participants: MoodleCourseParticipant[] = [];
  let assignmentSummaries: Array<
    ReturnType<typeof summarizeAssignment>
  > = [];
  let quizSummaries: Array<ReturnType<typeof summarizeQuiz>> = [];
  let forumSummaries: Array<ReturnType<typeof summarizeForum>> = [];
  let courseUpdates: Awaited<ReturnType<typeof getCourseUpdatesSince>> = [];
  let totalModules = 0;
  let errorMessage: string | null = null;
  let expiredSession = false;
  let participantsAccessError: string | null = null;
  let assignmentsAccessError: string | null = null;
  let quizAccessError: string | null = null;
  let forumsAccessError: string | null = null;
  let quizScopeNotice: string | null = null;

  try {
    const oneWeekAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 3600;
    const [coursesResult, accessProfile, sections, updates] = await Promise.all([
      getUserCourses(session.token, session.userId),
      resolveUserAccessProfile(session.token, session.userId).catch(() => null),
      getCourseContents(session.token, parsedCourseId).catch(() => []),
      getCourseUpdatesSince(session.token, parsedCourseId, oneWeekAgo).catch(() => []),
    ]);

    courses = coursesResult;
    courseAccess =
      accessProfile?.courseCapabilities.find(
        (course) => course.courseId === parsedCourseId
      ) || null;
    courseUpdates = updates;
    totalModules = sections.reduce((total, section) => total + section.modules.length, 0);

    if (!courseAccess || courseAccess.roleBucket === "student") {
      // Let the UI show a permission state below.
    } else {
      try {
        participants = await getCourseParticipants(session.token, parsedCourseId);
      } catch (participantsError) {
        if (isAccessException(participantsError)) {
          participantsAccessError =
            "Tu cuenta no puede consultar participantes para construir el reporte.";
        } else {
          logger.warn("Course report participants load failed", {
            userId: session.userId,
            courseId: parsedCourseId,
            error: participantsError,
          });
          participantsAccessError =
            "No se pudieron cargar todos los participantes del curso.";
        }
      }

      const [{ assignments }, quizzes, forums] = await Promise.all([
        getAssignments(session.token, [parsedCourseId]).then(
          (items) => items.find((item) => item.courseId === parsedCourseId) || { assignments: [] }
        ),
        getQuizzesByCourses(session.token, [parsedCourseId]).catch(() => []),
        getForumsByCourses(session.token, [parsedCourseId]).catch(() => []),
      ]);

      const assignmentResults = await Promise.allSettled(
        assignments.map(async (assignment) => {
          const [submissions, grades] = await Promise.all([
            getAssignmentSubmissions(session.token, assignment.id).catch(() => []),
            getAssignmentGrades(session.token, assignment.id).catch(() => []),
          ]);

          return summarizeAssignment(assignment, submissions, grades);
        })
      );

      assignmentSummaries = assignmentResults
        .filter((result): result is PromiseFulfilledResult<ReturnType<typeof summarizeAssignment>> => result.status === "fulfilled")
        .map((result) => result.value)
        .sort((a, b) => b.pendingReview - a.pendingReview || (b.latestSubmission || 0) - (a.latestSubmission || 0));

      if (assignmentResults.some((result) => result.status === "rejected")) {
        assignmentsAccessError =
          "No se pudieron cargar todos los datos de revisión de tareas.";
      }

      const participantsForQuizReports =
        participants.length > 30 ? participants.slice(0, 30) : participants;

      if (participants.length > 30) {
        quizScopeNotice =
          "El resumen de quiz se ha calculado con los 30 primeros participantes visibles para mantener la carga razonable.";
      }

      const quizResults = await Promise.allSettled(
        quizzes.map(async (quiz) => {
          const attemptsPerParticipant = await Promise.all(
            participantsForQuizReports.map((participant) =>
              getQuizUserAttempts(session.token, quiz.id, participant.id).catch(() => [])
            )
          );
          const attempts = attemptsPerParticipant.flat();
          const participantsWithAttempts = attemptsPerParticipant.filter(
            (participantAttempts) => participantAttempts.length > 0
          ).length;

          return summarizeQuiz(quiz, attempts, participantsWithAttempts);
        })
      );

      quizSummaries = quizResults
        .filter((result): result is PromiseFulfilledResult<ReturnType<typeof summarizeQuiz>> => result.status === "fulfilled")
        .map((result) => result.value)
        .sort((a, b) => b.totalAttempts - a.totalAttempts || (b.latestActivity || 0) - (a.latestActivity || 0));

      if (quizResults.some((result) => result.status === "rejected")) {
        quizAccessError =
          "No se pudieron cargar todos los resúmenes de quiz del curso.";
      }

      const forumResults = await Promise.allSettled(
        forums.map(async (forum) => {
          const discussions = await getForumDiscussions(session.token, forum.id).catch(() => []);
          return summarizeForum(forum, discussions);
        })
      );

      forumSummaries = forumResults
        .filter((result): result is PromiseFulfilledResult<ReturnType<typeof summarizeForum>> => result.status === "fulfilled")
        .map((result) => result.value)
        .sort((a, b) => b.totalDiscussions - a.totalDiscussions || (b.latestActivity || 0) - (a.latestActivity || 0));

      if (forumResults.some((result) => result.status === "rejected")) {
        forumsAccessError =
          "No se pudieron cargar todos los resúmenes de foros del curso.";
      }
    }
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Course reports load failed", {
      userId: session.userId,
      courseId: parsedCourseId,
      error,
    });
    errorMessage = "No se pudieron cargar los reportes del curso.";
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

  const actionSections = getCourseOverviewActionSections(
    parsedCourseId,
    effectiveCourseAccess
  );

  const assignmentPendingReview = assignmentSummaries.reduce(
    (total, item) => total + item.pendingReview,
    0
  );
  const quizAttempts = quizSummaries.reduce(
    (total, item) => total + item.totalAttempts,
    0
  );
  const forumThreads = forumSummaries.reduce(
    (total, item) => total + item.totalDiscussions,
    0
  );

  return (
    <main className="flex min-h-screen flex-1 px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          breadcrumbs={[
            { label: "Mis cursos", href: "/mis-cursos" },
            { label: course?.fullname ?? "Curso", href: `/mis-cursos/${parsedCourseId}` },
            { label: "Reportes" },
          ]}
          actions={
            <>
              <Link href={`/mis-cursos/${parsedCourseId}/tareas`} className="text-[var(--muted)] transition hover:text-[var(--foreground)]">
                Tareas
              </Link>
              <Link href={`/mis-cursos/${parsedCourseId}/calificaciones`} className="text-[var(--muted)] transition hover:text-[var(--foreground)]">
                Calificaciones
              </Link>
              {effectiveCourseAccess.canManageParticipants ? (
                <Link href={`/mis-cursos/${parsedCourseId}/participantes`} className="text-[var(--muted)] transition hover:text-[var(--foreground)]">
                  Participantes
                </Link>
              ) : null}
            </>
          }
        />

        <div>
          <div className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getCourseRoleTone(effectiveCourseAccess.roleBucket)}`}>
            {getCourseRoleLabel(effectiveCourseAccess.roleBucket)}
          </div>
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            Reportes del curso
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {course?.fullname || "Curso"}
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
            Vista operativa para seguimiento docente de actividad, tareas, cuestionarios y foros dentro de lo que la app ya soporta.
          </p>
        </div>

        <CourseRoleActionGrid sections={actionSections.slice(0, 2)} />

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            {expiredSession ? "La sesión ya no es válida." : errorMessage}
          </div>
        ) : null}

        {effectiveCourseAccess.roleBucket === "student" && !errorMessage ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Sin permisos de reporte</h2>
              <Separator className="my-3" />
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                Esta vista está reservada para perfiles docentes o de gestión.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {effectiveCourseAccess.roleBucket !== "student" ? (
          <>
            {participantsAccessError ? (
              <div className="rounded-lg border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/8 px-4 py-3 text-sm text-[var(--color-warning)]">
                {participantsAccessError}
              </div>
            ) : null}
            {assignmentsAccessError ? (
              <div className="rounded-lg border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/8 px-4 py-3 text-sm text-[var(--color-warning)]">
                {assignmentsAccessError}
              </div>
            ) : null}
            {quizAccessError ? (
              <div className="rounded-lg border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/8 px-4 py-3 text-sm text-[var(--color-warning)]">
                {quizAccessError}
              </div>
            ) : null}
            {forumsAccessError ? (
              <div className="rounded-lg border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/8 px-4 py-3 text-sm text-[var(--color-warning)]">
                {forumsAccessError}
              </div>
            ) : null}
            {quizScopeNotice ? (
              <div className="rounded-lg border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/8 px-4 py-3 text-sm text-[var(--color-warning)]">
                {quizScopeNotice}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="rounded-xl">
                <CardContent className="px-5 py-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Participantes visibles
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">
                    {participants.length}
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-xl">
                <CardContent className="px-5 py-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Módulos y novedades
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">
                    {totalModules} / {courseUpdates.length}
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-xl">
                <CardContent className="px-5 py-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Tareas por revisar
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">
                    {assignmentPendingReview}
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-xl">
                <CardContent className="px-5 py-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Quiz / Foros
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">
                    {quizAttempts} / {forumThreads}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-xl">
              <CardContent className="px-5 py-5 md:px-6">
                <h2 className="text-lg font-semibold">Tareas que requieren atención</h2>
                <Separator className="my-3" />
                <div className="flex flex-col gap-3">
                  {assignmentSummaries.length > 0 ? (
                    assignmentSummaries.map((item) => (
                      <Link
                        key={item.assignment.id}
                        href={`/mis-cursos/${parsedCourseId}/tareas/${item.assignment.id}`}
                        className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-4 transition hover:border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)]/5"
                      >
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-[var(--color-foreground)]">
                              {item.assignment.name}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
                              <span className="rounded-full border border-[var(--success-soft)] bg-[var(--success-soft)] px-2.5 py-0.5 text-[var(--success)]">
                                {item.submitted} enviadas
                              </span>
                              <span className="rounded-full border border-[var(--warning-soft)] bg-[var(--warning-soft)] px-2.5 py-0.5 text-[var(--warning)]">
                                {item.drafts} borradores
                              </span>
                              <span className="rounded-full border border-[var(--accent-cool)]/20 bg-[var(--accent-cool)]/10 px-2.5 py-0.5 text-[var(--accent-cool)]">
                                {item.graded} revisadas
                              </span>
                              <span className="rounded-full border border-[var(--color-line)] px-2.5 py-0.5">
                                {item.pendingReview} pendientes
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-[var(--color-muted)] md:text-right">
                            {item.latestSubmission ? (
                              <p>Último envío: {formatDate(item.latestSubmission)}</p>
                            ) : null}
                            {item.latestReview ? (
                              <p>Última revisión: {formatDate(item.latestReview)}</p>
                            ) : null}
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm leading-7 text-[var(--color-muted)]">
                      No hay datos de tareas visibles con el acceso actual.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="rounded-xl">
                <CardContent className="px-5 py-5 md:px-6">
                  <h2 className="text-lg font-semibold">Resumen de quiz</h2>
                  <Separator className="my-3" />
                  <div className="flex flex-col gap-3">
                    {quizSummaries.length > 0 ? (
                      quizSummaries.map((item) => (
                        <Link
                          key={item.quiz.id}
                          href={`/mis-cursos/${parsedCourseId}/quiz/${item.quiz.id}`}
                          className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-4 transition hover:border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)]/5"
                        >
                          <p className="text-sm font-semibold text-[var(--color-foreground)]">
                            {item.quiz.name}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
                            <span className="rounded-full border border-[var(--color-line)] px-2.5 py-0.5">
                              {item.totalAttempts} intentos
                            </span>
                            <span className="rounded-full border border-[var(--success-soft)] bg-[var(--success-soft)] px-2.5 py-0.5 text-[var(--success)]">
                              {item.finished} finalizados
                            </span>
                            <span className="rounded-full border border-[var(--warning-soft)] bg-[var(--warning-soft)] px-2.5 py-0.5 text-[var(--warning)]">
                              {item.active} activos
                            </span>
                            <span className="rounded-full border border-[var(--color-line)] px-2.5 py-0.5">
                              {item.participantsWithAttempts} participantes
                            </span>
                          </div>
                          {item.latestActivity || item.bestGrade !== undefined ? (
                            <div className="mt-3 text-sm text-[var(--color-muted)]">
                              {item.latestActivity ? (
                                <p>Última actividad: {formatDate(item.latestActivity)}</p>
                              ) : null}
                              {item.bestGrade !== undefined ? (
                                <p>Mejor nota visible: {item.bestGrade.toFixed(2)}</p>
                              ) : null}
                            </div>
                          ) : null}
                        </Link>
                      ))
                    ) : (
                      <p className="text-sm leading-7 text-[var(--color-muted)]">
                        No hay datos de quiz visibles para este curso con el acceso actual.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl">
                <CardContent className="px-5 py-5 md:px-6">
                  <h2 className="text-lg font-semibold">Resumen de foros</h2>
                  <Separator className="my-3" />
                  <div className="flex flex-col gap-3">
                    {forumSummaries.length > 0 ? (
                      forumSummaries.map((item) => (
                        <Link
                          key={item.forum.id}
                          href={`/foros/${item.forum.id}?courseId=${parsedCourseId}`}
                          className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-4 transition hover:border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)]/5"
                        >
                          <p className="text-sm font-semibold text-[var(--color-foreground)]">
                            {item.forum.name}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--color-muted)]">
                            <span className="rounded-full border border-[var(--color-line)] px-2.5 py-0.5">
                              {item.totalDiscussions} hilos
                            </span>
                            <span className="rounded-full border border-[var(--warning-soft)] bg-[var(--warning-soft)] px-2.5 py-0.5 text-[var(--warning)]">
                              {item.unanswered} sin respuesta
                            </span>
                            <span className="rounded-full border border-[var(--color-line)] px-2.5 py-0.5">
                              {item.pinned} fijados
                            </span>
                            <span className="rounded-full border border-[var(--color-line)] px-2.5 py-0.5">
                              {item.locked} cerrados
                            </span>
                          </div>
                          {item.latestActivity ? (
                            <p className="mt-3 text-sm text-[var(--color-muted)]">
                              Última actividad: {formatDate(item.latestActivity)}
                            </p>
                          ) : null}
                        </Link>
                      ))
                    ) : (
                      <p className="text-sm leading-7 text-[var(--color-muted)]">
                        No hay datos de foros visibles para este curso con el acceso actual.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
