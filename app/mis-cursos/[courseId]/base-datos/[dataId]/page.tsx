import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { RichHtml } from "@/app/components/rich-html";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { logger } from "@/lib/logger";
import {
  getDatabasesByCourses,
  getDatabaseEntries,
  getUserCourses,
  isAuthenticationError,
  resolveUserAccessProfile,
  type MoodleCourseAccessProfile,
} from "@/lib/moodle";
import type { MoodleDatabase, MoodleDatabaseEntry } from "@/lib/moodle";
import { getCourseRoleLabel, getCourseRoleTone } from "@/lib/course-roles";
import { getSession } from "@/lib/session";

type DatabasePageProps = {
  params: Promise<{
    courseId: string;
    dataId: string;
  }>;
};

function formatDate(value?: number) {
  if (!value) return null;
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value * 1000));
}

export default async function DatabasePage({ params }: DatabasePageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const { courseId, dataId } = await params;
  const parsedCourseId = Number(courseId);
  const parsedDataId = Number(dataId);

  if (
    !Number.isInteger(parsedCourseId) ||
    parsedCourseId <= 0 ||
    !Number.isInteger(parsedDataId) ||
    parsedDataId <= 0
  ) {
    notFound();
  }

  let courses = [] as Awaited<ReturnType<typeof getUserCourses>>;
  let database: MoodleDatabase | undefined;
  let entries: MoodleDatabaseEntry[] = [];
  let errorMessage: string | null = null;
  let expiredSession = false;
  let courseAccess: MoodleCourseAccessProfile | null = null;

  try {
    const [coursesResult, databases, entriesResult, accessProfile] =
      await Promise.all([
      getUserCourses(session.token, session.userId),
      getDatabasesByCourses(session.token, [parsedCourseId]),
      getDatabaseEntries(session.token, parsedDataId).catch(() => []),
      resolveUserAccessProfile(session.token, session.userId).catch(
        () => null
      ),
    ]);

    courses = coursesResult;
    database = databases.find((d) => d.id === parsedDataId);
    entries = entriesResult;
    courseAccess =
      accessProfile?.courseCapabilities.find(
        (item) => item.courseId === parsedCourseId
      ) || null;
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Database page load failed", {
      userId: session.userId,
      courseId: parsedCourseId,
      dataId: parsedDataId,
      error,
    });
    errorMessage = "No se pudo cargar la base de datos.";
  }

  const course = courses.find((item) => item.id === parsedCourseId);

  if (!course && !errorMessage) {
    notFound();
  }

  if (!database && !errorMessage) {
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
          sectionLabel="Base de datos"
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
            {database?.name || "Base de datos"}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {course?.fullname || "Curso"}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
            {effectiveCourseAccess.roleBucket === "student"
              ? "Esta vista está orientada a consultar los registros disponibles en la base de datos."
              : "Esta vista mantiene la lectura de registros de la actividad, pero ya muestra tu rol real dentro del curso."}
          </p>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            {expiredSession
              ? "La sesion ya no es valida."
              : errorMessage}
          </div>
        ) : null}

        {database?.intro ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Descripcion</h2>
              <Separator className="my-3" />
              <RichHtml
                html={database.intro}
                className="text-sm leading-7 text-[var(--color-muted)]"
              />
            </CardContent>
          </Card>
        ) : null}

        {entries.length > 0 ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Entradas</h2>
              <Separator className="my-3" />
              <div className="flex flex-col gap-4">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-[var(--color-muted)]/10 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-muted)]">
                      {entry.authorName ? (
                        <span className="font-semibold text-[var(--color-foreground)]">
                          {entry.authorName}
                        </span>
                      ) : null}
                      {entry.timeCreated ? (
                        <span>{formatDate(entry.timeCreated)}</span>
                      ) : null}
                    </div>

                    {entry.contents.length > 0 ? (
                      <div className="mt-3 flex flex-col gap-2">
                        {entry.contents.map((field) => (
                          <div key={field.fieldId} className="text-sm">
                            <span className="text-[var(--color-muted)]">
                              Campo {field.fieldId}:{" "}
                            </span>
                            <span className="text-[var(--color-foreground)]">
                              {field.content || "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : !errorMessage ? (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            No hay entradas registradas en esta base de datos.
          </p>
        ) : null}
      </div>
    </main>
  );
}
