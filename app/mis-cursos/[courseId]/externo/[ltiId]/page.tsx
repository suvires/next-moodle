import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { RichHtml } from "@/app/components/rich-html";
import { Button, LinkButton } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { logger } from "@/lib/logger";
import {
  getLtisByCourses,
  getLtiLaunchData,
  getUserCourses,
  isAuthenticationError,
  resolveUserAccessProfile,
  type MoodleCourseAccessProfile,
} from "@/lib/moodle";
import type { MoodleLti } from "@/lib/moodle";
import { getCourseRoleLabel, getCourseRoleTone } from "@/lib/course-roles";
import { getSession } from "@/lib/session";

type LtiPageProps = {
  params: Promise<{
    courseId: string;
    ltiId: string;
  }>;
};

export default async function LtiPage({ params }: LtiPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const { courseId, ltiId } = await params;
  const parsedCourseId = Number(courseId);
  const parsedLtiId = Number(ltiId);

  if (
    !Number.isInteger(parsedCourseId) ||
    parsedCourseId <= 0 ||
    !Number.isInteger(parsedLtiId) ||
    parsedLtiId <= 0
  ) {
    notFound();
  }

  let courses = [] as Awaited<ReturnType<typeof getUserCourses>>;
  let lti: MoodleLti | undefined;
  let launchEndpoint: string | undefined;
  let launchParams: Array<{ name: string; value: string }> = [];
  let errorMessage: string | null = null;
  let expiredSession = false;
  let courseAccess: MoodleCourseAccessProfile | null = null;

  try {
    const [coursesResult, ltis, launchData, accessProfile] =
      await Promise.all([
      getUserCourses(session.token, session.userId),
      getLtisByCourses(session.token, [parsedCourseId]),
      getLtiLaunchData(session.token, parsedLtiId).catch(() => ({
        endpoint: undefined,
        parameters: [],
      })),
      resolveUserAccessProfile(session.token, session.userId).catch(
        () => null
      ),
    ]);

    courses = coursesResult;
    lti = ltis.find((l) => l.id === parsedLtiId);
    launchEndpoint = launchData.endpoint;
    launchParams = launchData.parameters;
    courseAccess =
      accessProfile?.courseCapabilities.find(
        (item) => item.courseId === parsedCourseId
      ) || null;
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("LTI page load failed", {
      userId: session.userId,
      courseId: parsedCourseId,
      ltiId: parsedLtiId,
      error,
    });
    errorMessage = "No se pudo cargar la herramienta externa.";
  }

  const course = courses.find((item) => item.id === parsedCourseId);

  if (!course && !errorMessage) {
    notFound();
  }

  if (!lti && !errorMessage) {
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
          sectionLabel="Herramienta externa"
          actions={
            <LinkButton href={`/mis-cursos/${parsedCourseId}`} variant="ghost" size="sm">Volver</LinkButton>
          }
        />

        <div>
          <div
            className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getCourseRoleTone(effectiveCourseAccess.roleBucket)}`}
          >
            {getCourseRoleLabel(effectiveCourseAccess.roleBucket)}
          </div>
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            {lti?.name || "Herramienta externa"}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {course?.fullname || "Curso"}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
            {effectiveCourseAccess.roleBucket === "student"
              ? "Esta vista está orientada a abrir la herramienta externa desde tu flujo de alumno."
              : "Esta vista mantiene el acceso básico a la herramienta externa, pero ya refleja tu rol real dentro del curso."}
          </p>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            {expiredSession
              ? "La sesion ya no es valida."
              : errorMessage}
          </div>
        ) : null}

        {lti?.intro ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Descripcion</h2>
              <Separator className="my-3" />
              <RichHtml
                html={lti.intro}
                className="text-sm leading-7 text-[var(--color-muted)]"
              />
            </CardContent>
          </Card>
        ) : null}

        <Card className="rounded-xl">
          <CardContent className="px-5 py-5 md:px-6">
            <h2 className="text-lg font-semibold">Acceso</h2>
            <Separator className="my-3" />

            {launchEndpoint ? (
              <>
                <p className="mb-4 text-sm text-[var(--color-muted)]">
                  Haz clic en el boton para abrir la herramienta externa en una
                  nueva ventana.
                </p>
                <form
                  action={launchEndpoint}
                  method="POST"
                  target="_blank"
                >
                  {launchParams.map((param) => (
                    <input
                      key={param.name}
                      type="hidden"
                      name={param.name}
                      value={param.value}
                    />
                  ))}
                  <Button type="submit" size="sm">
                    Abrir herramienta externa
                  </Button>
                </form>
              </>
            ) : (
              <p className="text-sm text-[var(--color-muted)]">
                La herramienta externa no esta disponible en este momento.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
