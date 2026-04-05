import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { RichHtml } from "@/app/components/rich-html";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { logger } from "@/lib/logger";
import {
  getSurveysByCourses,
  getSurveyQuestions,
  getUserCourses,
  isAuthenticationError,
  resolveUserAccessProfile,
  type MoodleCourseAccessProfile,
} from "@/lib/moodle";
import type { MoodleSurvey, MoodleSurveyQuestion } from "@/lib/moodle";
import { getCourseRoleLabel, getCourseRoleTone } from "@/lib/course-roles";
import { getSession } from "@/lib/session";

type SurveyDetailPageProps = {
  params: Promise<{
    courseId: string;
    surveyId: string;
  }>;
};

export default async function SurveyDetailPage({
  params,
}: SurveyDetailPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const { courseId, surveyId } = await params;
  const parsedCourseId = Number(courseId);
  const parsedSurveyId = Number(surveyId);

  if (
    !Number.isInteger(parsedCourseId) ||
    parsedCourseId <= 0 ||
    !Number.isInteger(parsedSurveyId) ||
    parsedSurveyId <= 0
  ) {
    notFound();
  }

  let courses = [] as Awaited<ReturnType<typeof getUserCourses>>;
  let survey: MoodleSurvey | undefined;
  let questions: MoodleSurveyQuestion[] = [];
  let errorMessage: string | null = null;
  let expiredSession = false;
  let courseAccess: MoodleCourseAccessProfile | null = null;

  try {
    const [coursesResult, surveys, surveyQuestions, accessProfile] =
      await Promise.all([
      getUserCourses(session.token, session.userId),
      getSurveysByCourses(session.token, [parsedCourseId]),
      getSurveyQuestions(session.token, parsedSurveyId).catch(() => []),
      resolveUserAccessProfile(session.token, session.userId).catch(
        () => null
      ),
    ]);

    courses = coursesResult;
    survey = surveys.find((s) => s.id === parsedSurveyId);
    questions = surveyQuestions;
    courseAccess =
      accessProfile?.courseCapabilities.find(
        (item) => item.courseId === parsedCourseId
      ) || null;
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Survey detail load failed", {
      userId: session.userId,
      courseId: parsedCourseId,
      surveyId: parsedSurveyId,
      error,
    });
    errorMessage = "No se pudo cargar la encuesta predefinida.";
  }

  const course = courses.find((item) => item.id === parsedCourseId);

  if (!course && !errorMessage) {
    notFound();
  }

  if (!survey && !errorMessage) {
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

  return (
    <main className="flex min-h-screen flex-1 px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          sectionLabel="Encuesta predefinida"
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link href={`/mis-cursos/${parsedCourseId}`}>Volver</Link>
            </Button>
          }
        />

        <div>
          <div
            className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getCourseRoleTone(effectiveCourseAccess.roleBucket)}`}
          >
            {getCourseRoleLabel(effectiveCourseAccess.roleBucket)}
          </div>
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            {survey?.name || "Encuesta predefinida"}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {course?.fullname || "Curso"}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
            {effectiveCourseAccess.roleBucket === "student"
              ? "Esta vista está orientada a consultar la estructura de la encuesta predefinida desde tu acceso de alumno."
              : "Esta vista mantiene el contenido base de la encuesta predefinida, pero ya refleja tu rol real dentro del curso."}
          </p>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            {expiredSession
              ? "La sesion ya no es valida."
              : errorMessage}
          </div>
        ) : null}

        {survey?.intro ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Descripcion</h2>
              <Separator className="my-3" />
              <RichHtml
                html={survey.intro}
                className="text-sm leading-7 text-[var(--color-muted)]"
              />
            </CardContent>
          </Card>
        ) : null}

        {questions.length > 0 ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Preguntas</h2>
              <Separator className="my-3" />
              <div className="flex flex-col gap-3">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="flex items-start gap-3 rounded-lg px-4 py-3"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs font-semibold text-[var(--color-muted)]">
                      {index + 1}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm text-[var(--color-foreground)]">
                        {question.text}
                      </span>
                      {question.shortText ? (
                        <span className="text-xs text-[var(--color-muted)]">
                          {question.shortText}
                        </span>
                      ) : null}
                      {question.options.length > 0 ? (
                        <ul className="mt-1 flex flex-col gap-1">
                          {question.options.map((option, optIndex) => (
                            <li
                              key={optIndex}
                              className="text-xs text-[var(--color-muted)]"
                            >
                              {option}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-5 rounded-lg border border-[var(--color-muted)]/20 bg-[var(--color-muted)]/5 px-4 py-3 text-xs leading-5 text-[var(--color-muted)]">
                Las encuestas predefinidas se completan en la plataforma principal.
              </p>
            </CardContent>
          </Card>
        ) : !errorMessage ? (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            No hay preguntas disponibles para esta encuesta.
          </p>
        ) : null}
      </div>
    </main>
  );
}
