import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { RichHtml } from "@/app/components/rich-html";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { logger } from "@/lib/logger";
import {
  getH5PActivitiesByCourses,
  getH5PAttempts,
  getUserCourses,
  isAuthenticationError,
  resolveUserAccessProfile,
  type MoodleCourseAccessProfile,
} from "@/lib/moodle";
import type { MoodleH5P, MoodleH5PAttempt } from "@/lib/moodle";
import { getCourseRoleLabel, getCourseRoleTone } from "@/lib/course-roles";
import { getSession } from "@/lib/session";

type H5PPageProps = {
  params: Promise<{
    courseId: string;
    h5pId: string;
  }>;
};

function formatDate(value?: number) {
  if (!value) return null;
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value * 1000));
}

export default async function H5PPage({ params }: H5PPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const { courseId, h5pId } = await params;
  const parsedCourseId = Number(courseId);
  const parsedH5PId = Number(h5pId);

  if (
    !Number.isInteger(parsedCourseId) ||
    parsedCourseId <= 0 ||
    !Number.isInteger(parsedH5PId) ||
    parsedH5PId <= 0
  ) {
    notFound();
  }

  let courses = [] as Awaited<ReturnType<typeof getUserCourses>>;
  let h5p: MoodleH5P | undefined;
  let attempts: MoodleH5PAttempt[] = [];
  let errorMessage: string | null = null;
  let expiredSession = false;
  let courseAccess: MoodleCourseAccessProfile | null = null;

  try {
    const [coursesResult, activities, attemptsResult, accessProfile] =
      await Promise.all([
      getUserCourses(session.token, session.userId),
      getH5PActivitiesByCourses(session.token, [parsedCourseId]),
      getH5PAttempts(session.token, parsedH5PId).catch(() => []),
      resolveUserAccessProfile(session.token, session.userId).catch(
        () => null
      ),
    ]);

    courses = coursesResult;
    h5p = activities.find((a) => a.id === parsedH5PId);
    attempts = attemptsResult;
    courseAccess =
      accessProfile?.courseCapabilities.find(
        (item) => item.courseId === parsedCourseId
      ) || null;
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("H5P page load failed", {
      userId: session.userId,
      courseId: parsedCourseId,
      h5pId: parsedH5PId,
      error,
    });
    errorMessage = "No se pudo cargar la actividad H5P.";
  }

  const course = courses.find((item) => item.id === parsedCourseId);

  if (!course && !errorMessage) {
    notFound();
  }

  if (!h5p && !errorMessage) {
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
          sectionLabel="Actividad H5P"
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
            {h5p?.name || "Actividad H5P"}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {course?.fullname || "Curso"}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
            {effectiveCourseAccess.roleBucket === "student"
              ? "Esta vista está orientada a consultar el historial y el contexto de la actividad H5P."
              : "Esta vista mantiene el contexto base de la actividad H5P, pero ya refleja tu rol real dentro del curso."}
          </p>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            {expiredSession
              ? "La sesion ya no es valida."
              : errorMessage}
          </div>
        ) : null}

        {h5p?.intro ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Descripcion</h2>
              <Separator className="my-3" />
              <RichHtml
                html={h5p.intro}
                className="text-sm leading-7 text-[var(--color-muted)]"
              />
            </CardContent>
          </Card>
        ) : null}

        <Card className="rounded-xl">
          <CardContent className="px-5 py-5 md:px-6">
            <h2 className="text-lg font-semibold">Informacion</h2>
            <Separator className="my-3" />

            <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--color-foreground)]">
              <span>Intentos: {attempts.length}</span>
            </div>

            <p className="rounded-lg border border-[var(--color-muted)]/20 bg-[var(--color-muted)]/5 px-4 py-3 text-xs leading-5 text-[var(--color-muted)]">
              El contenido interactivo se visualiza en la plataforma principal.
            </p>
          </CardContent>
        </Card>

        {attempts.length > 0 ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Historial de intentos</h2>
              <Separator className="my-3" />
              <div className="flex flex-col gap-1">
                {attempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex flex-col gap-2 rounded-lg px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-sm font-semibold text-[var(--color-foreground)]">
                      Intento {attempt.attemptNumber}
                    </span>

                    <div className="flex items-center gap-4">
                      {attempt.timeCreated ? (
                        <span className="text-xs text-[var(--color-muted)]">
                          {formatDate(attempt.timeCreated)}
                        </span>
                      ) : null}
                      {attempt.rawScore !== undefined ? (
                        <span className="text-sm font-semibold text-[var(--color-accent)]">
                          {attempt.rawScore}
                          {attempt.maxScore !== undefined
                            ? ` / ${attempt.maxScore}`
                            : null}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : !errorMessage ? (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            No hay intentos registrados para esta actividad.
          </p>
        ) : null}
      </div>
    </main>
  );
}
