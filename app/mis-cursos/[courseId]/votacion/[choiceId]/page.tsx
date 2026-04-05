import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { CourseRoleActionGrid } from "@/app/components/course-role-action-grid";
import { RichHtml } from "@/app/components/rich-html";
import { Button, LinkButton } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { ChoiceVoteForm } from "@/app/components/choice-vote-form";
import { logger } from "@/lib/logger";
import {
  getChoicesByCourses,
  getChoiceResults,
  getUserCourses,
  isAuthenticationError,
  resolveUserAccessProfile,
  type MoodleCourseAccessProfile,
} from "@/lib/moodle";
import type { MoodleChoice, MoodleChoiceOption } from "@/lib/moodle";
import {
  getActivityRoleActions,
  getCourseRoleLabel,
  getCourseRoleTone,
  shouldShowStudentParticipationActions,
} from "@/lib/course-roles";
import { getSession } from "@/lib/session";

type ChoiceDetailPageProps = {
  params: Promise<{
    courseId: string;
    choiceId: string;
  }>;
};

function PercentageBar({
  count,
  total,
}: {
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-strong)]">
        <div
          className="h-full rounded-full bg-[var(--color-accent)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="min-w-[3.5rem] text-right text-xs tabular-nums text-[var(--color-muted)]">
        {count} ({pct}%)
      </span>
    </div>
  );
}

export default async function ChoiceDetailPage({
  params,
}: ChoiceDetailPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const { courseId, choiceId } = await params;
  const parsedCourseId = Number(courseId);
  const parsedChoiceId = Number(choiceId);

  if (
    !Number.isInteger(parsedCourseId) ||
    parsedCourseId <= 0 ||
    !Number.isInteger(parsedChoiceId) ||
    parsedChoiceId <= 0
  ) {
    notFound();
  }

  let courses = [] as Awaited<ReturnType<typeof getUserCourses>>;
  let choice: MoodleChoice | undefined;
  let options: MoodleChoiceOption[] = [];
  let errorMessage: string | null = null;
  let expiredSession = false;
  let courseAccess: MoodleCourseAccessProfile | null = null;

  try {
    const [coursesResult, choices, resultsData, accessProfile] =
      await Promise.all([
      getUserCourses(session.token, session.userId),
      getChoicesByCourses(session.token, [parsedCourseId]),
      getChoiceResults(session.token, parsedChoiceId),
      resolveUserAccessProfile(session.token, session.userId).catch(
        () => null
      ),
    ]);

    courses = coursesResult;
    choice = choices.find((c) => c.id === parsedChoiceId);
    options = resultsData.options;
    courseAccess =
      accessProfile?.courseCapabilities.find(
        (item) => item.courseId === parsedCourseId
      ) || null;
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Choice detail load failed", {
      userId: session.userId,
      courseId: parsedCourseId,
      choiceId: parsedChoiceId,
      error,
    });
    errorMessage = "No se pudo cargar la votacion.";
  }

  const course = courses.find((item) => item.id === parsedCourseId);

  if (!course && !errorMessage) {
    notFound();
  }

  if (!choice && !errorMessage) {
    notFound();
  }

  const totalVotes = options.reduce((sum, o) => sum + o.answerCount, 0);
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
  const roleActionSection = {
    title:
      effectiveCourseAccess.roleBucket === "student"
        ? "Participación"
        : effectiveCourseAccess.roleBucket === "teacher"
          ? "Seguimiento y revisión"
          : effectiveCourseAccess.roleBucket === "editing_teacher"
            ? "Edición ligera"
            : "Administración del curso",
    description:
      effectiveCourseAccess.roleBucket === "student"
        ? "Accesos rápidos para revisar resultados y emitir tu voto."
        : "Accesos disponibles hoy para revisar la actividad desde tu rol real.",
    tone:
      effectiveCourseAccess.roleBucket === "student"
        ? "success"
        : effectiveCourseAccess.roleBucket === "course_manager"
          ? "warning"
          : "accent",
    actions: getActivityRoleActions({
      courseId: parsedCourseId,
      courseAccess: effectiveCourseAccess,
      activityType: "choice",
    }),
  } as const;

  return (
    <div className="flex min-h-screen flex-col">
      <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          sectionLabel="Votacion"
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
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            {choice?.name || "Votacion"}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {course?.fullname || "Curso"}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
            {effectiveCourseAccess.roleBucket === "student"
              ? "Esta vista está orientada a consultar los resultados y emitir tu voto desde el flujo de alumno."
              : "Esta vista mantiene el flujo visible de votación, pero ya refleja tu rol real dentro del curso."}
          </p>
        </div>

        <CourseRoleActionGrid sections={[roleActionSection]} />

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            {expiredSession
              ? "La sesion ya no es valida."
              : errorMessage}
          </div>
        ) : null}

        {choice?.intro ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Descripcion</h2>
              <Separator className="my-3" />
              <RichHtml
                html={choice.intro}
                className="text-sm leading-7 text-[var(--color-muted)]"
              />
            </CardContent>
          </Card>
        ) : null}

        {options.length > 0 ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Resultados</h2>
              <Separator className="my-3" />
              <div className="flex flex-col gap-3">
                {options.map((option) => (
                  <div key={option.id} className="flex flex-col gap-1">
                    <span className="text-sm text-[var(--color-foreground)]">
                      {option.text}
                    </span>
                    <PercentageBar
                      count={option.answerCount}
                      total={totalVotes}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-[var(--color-muted)]">
                Total de votos: {totalVotes}
              </p>
            </CardContent>
          </Card>
        ) : !errorMessage ? (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            No hay opciones disponibles para esta votacion.
          </p>
        ) : null}

        {choice && options.length > 0 && canParticipateAsStudent ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Votar</h2>
              <Separator className="my-3" />
              <ChoiceVoteForm
                choiceId={parsedChoiceId}
                options={options}
                allowMultiple={choice.allowMultiple}
                returnPath={`/mis-cursos/${parsedCourseId}/votacion/${parsedChoiceId}`}
              />
            </CardContent>
          </Card>
        ) : null}

        {choice && options.length > 0 && !canParticipateAsStudent ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Flujo de alumno</h2>
              <Separator className="my-3" />
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                El formulario de voto se oculta en esta vista porque tu rol
                actual no es de alumno. Se mantiene la consulta de resultados y
                el contexto de la actividad.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  );
}
