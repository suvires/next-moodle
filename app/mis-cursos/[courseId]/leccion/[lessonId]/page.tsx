import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { RichHtml } from "@/app/components/rich-html";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { logger } from "@/lib/logger";
import {
  getLessonsByCourses,
  getUserCourses,
  isAuthenticationError,
  resolveUserAccessProfile,
  type MoodleCourseAccessProfile,
} from "@/lib/moodle";
import type { MoodleLesson } from "@/lib/moodle";
import { getCourseRoleLabel, getCourseRoleTone } from "@/lib/course-roles";
import { getSession } from "@/lib/session";

type LessonDetailPageProps = {
  params: Promise<{
    courseId: string;
    lessonId: string;
  }>;
};

function formatDuration(seconds?: number) {
  if (!seconds) return null;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return remainMins > 0 ? `${hrs} h ${remainMins} min` : `${hrs} h`;
}

export default async function LessonDetailPage({
  params,
}: LessonDetailPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const { courseId, lessonId } = await params;
  const parsedCourseId = Number(courseId);
  const parsedLessonId = Number(lessonId);

  if (
    !Number.isInteger(parsedCourseId) ||
    parsedCourseId <= 0 ||
    !Number.isInteger(parsedLessonId) ||
    parsedLessonId <= 0
  ) {
    notFound();
  }

  let courses = [] as Awaited<ReturnType<typeof getUserCourses>>;
  let lesson: MoodleLesson | undefined;
  let errorMessage: string | null = null;
  let expiredSession = false;
  let courseAccess: MoodleCourseAccessProfile | null = null;

  try {
    const [coursesResult, lessons, accessProfile] = await Promise.all([
      getUserCourses(session.token, session.userId),
      getLessonsByCourses(session.token, [parsedCourseId]),
      resolveUserAccessProfile(session.token, session.userId).catch(() => null),
    ]);

    courses = coursesResult;
    lesson = lessons.find((l) => l.id === parsedLessonId);
    courseAccess =
      accessProfile?.courseCapabilities.find(
        (course) => course.courseId === parsedCourseId
      ) || null;
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Lesson detail load failed", {
      userId: session.userId,
      courseId: parsedCourseId,
      lessonId: parsedLessonId,
      error,
    });
    errorMessage = "No se pudo cargar la leccion.";
  }

  const course = courses.find((item) => item.id === parsedCourseId);

  if (!course && !errorMessage) {
    notFound();
  }

  if (!lesson && !errorMessage) {
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
          sectionLabel="Leccion"
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link href={`/mis-cursos/${parsedCourseId}`}>Volver</Link>
            </Button>
          }
        />

        <div>
          <div className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getCourseRoleTone(effectiveCourseAccess.roleBucket)}`}>
            {getCourseRoleLabel(effectiveCourseAccess.roleBucket)}
          </div>
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            {lesson?.name || "Leccion"}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {course?.fullname || "Curso"}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
            {effectiveCourseAccess.roleBucket === "student"
              ? "Esta vista resume la lección y te indica que la parte interactiva sigue en la plataforma principal."
              : "Esta vista refleja tu rol real en el curso mientras consultas la información de la lección."}
          </p>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            {expiredSession
              ? "La sesion ya no es valida."
              : errorMessage}
          </div>
        ) : null}

        {lesson?.intro ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Descripcion</h2>
              <Separator className="my-3" />
              <RichHtml
                html={lesson.intro}
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
              {lesson?.timeLimit ? (
                <div>
                  <p className="text-xs text-[var(--color-muted)]">
                    Tiempo limite
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-foreground)]">
                    {formatDuration(lesson.timeLimit)}
                  </p>
                </div>
              ) : null}
              <div>
                <p className="text-xs text-[var(--color-muted)]">
                  Reintentos
                </p>
                <p className="mt-1 text-sm text-[var(--color-foreground)]">
                  {lesson?.allowRetake ? "Permitidos" : "No permitidos"}
                </p>
              </div>
              {lesson?.maxGrade ? (
                <div>
                  <p className="text-xs text-[var(--color-muted)]">
                    Nota maxima
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-foreground)]">
                    {lesson.maxGrade}
                  </p>
                </div>
              ) : null}
            </div>

            <p className="mt-5 rounded-lg border border-[var(--color-muted)]/20 bg-[var(--color-muted)]/5 px-4 py-3 text-xs leading-5 text-[var(--color-muted)]">
              Las lecciones interactivas se realizan en la plataforma principal.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
