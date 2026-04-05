import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { RichHtml } from "@/app/components/rich-html";
import { Button, LinkButton } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { logger } from "@/lib/logger";
import {
  getWorkshopsByCourses,
  getWorkshopSubmissions,
  getUserCourses,
  isAuthenticationError,
  resolveUserAccessProfile,
  type MoodleCourseAccessProfile,
} from "@/lib/moodle";
import type { MoodleWorkshop, MoodleWorkshopSubmission } from "@/lib/moodle";
import { getCourseRoleLabel, getCourseRoleTone } from "@/lib/course-roles";
import { getSession } from "@/lib/session";

type WorkshopPageProps = {
  params: Promise<{
    courseId: string;
    workshopId: string;
  }>;
};

function formatDate(value?: number) {
  if (!value) return null;
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value * 1000));
}

function phaseLabel(phase: number) {
  switch (phase) {
    case 0:
      return { label: "Configuracion", className: "border-[var(--line)] bg-[var(--surface-strong)] text-[var(--color-muted)]" };
    case 10:
      return { label: "Envio", className: "border-[var(--warning-soft)] bg-[var(--warning-soft)] text-[var(--warning)]" };
    case 20:
      return { label: "Evaluacion", className: "border-[var(--accent-cool)]/20 bg-[var(--accent-cool)]/10 text-[var(--accent-cool)]" };
    case 30:
      return { label: "Calificacion", className: "border-[var(--accent-cool)]/30 bg-[var(--accent-cool)]/15 text-[var(--accent-cool)]" };
    case 40:
    case 50:
      return { label: "Cerrado", className: "border-[var(--success-soft)] bg-[var(--success-soft)] text-[var(--success)]" };
    default:
      return { label: "Desconocido", className: "border-[var(--line)] bg-[var(--surface-strong)] text-[var(--color-muted)]" };
  }
}

export default async function WorkshopPage({ params }: WorkshopPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const { courseId, workshopId } = await params;
  const parsedCourseId = Number(courseId);
  const parsedWorkshopId = Number(workshopId);

  if (
    !Number.isInteger(parsedCourseId) ||
    parsedCourseId <= 0 ||
    !Number.isInteger(parsedWorkshopId) ||
    parsedWorkshopId <= 0
  ) {
    notFound();
  }

  let courses = [] as Awaited<ReturnType<typeof getUserCourses>>;
  let workshop: MoodleWorkshop | undefined;
  let submissions: MoodleWorkshopSubmission[] = [];
  let errorMessage: string | null = null;
  let expiredSession = false;
  let courseAccess: MoodleCourseAccessProfile | null = null;

  try {
    const [coursesResult, workshops, submissionsResult, accessProfile] =
      await Promise.all([
      getUserCourses(session.token, session.userId),
      getWorkshopsByCourses(session.token, [parsedCourseId]),
      getWorkshopSubmissions(session.token, parsedWorkshopId).catch(() => []),
      resolveUserAccessProfile(session.token, session.userId).catch(
        () => null
      ),
    ]);

    courses = coursesResult;
    workshop = workshops.find((w) => w.id === parsedWorkshopId);
    submissions = submissionsResult;
    courseAccess =
      accessProfile?.courseCapabilities.find(
        (item) => item.courseId === parsedCourseId
      ) || null;
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Workshop page load failed", {
      userId: session.userId,
      courseId: parsedCourseId,
      workshopId: parsedWorkshopId,
      error,
    });
    errorMessage = "No se pudo cargar el taller.";
  }

  const course = courses.find((item) => item.id === parsedCourseId);

  if (!course && !errorMessage) {
    notFound();
  }

  if (!workshop && !errorMessage) {
    notFound();
  }

  const phase = workshop ? phaseLabel(workshop.phase) : null;
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
          sectionLabel="Taller"
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
            {workshop?.name || "Taller"}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {course?.fullname || "Curso"}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {phase ? (
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${phase.className}`}
              >
                {phase.label}
              </span>
            ) : null}
            {workshop?.maxGrade ? (
              <span className="text-[var(--color-foreground)]">
                Nota maxima: {workshop.maxGrade}
              </span>
            ) : null}
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
            {effectiveCourseAccess.roleBucket === "student"
              ? "Esta vista está orientada a seguir el estado del taller y revisar tus envíos disponibles."
              : "Esta vista conserva el flujo visible para el alumno, pero ya contextualiza la actividad con tu rol real en el curso."}
          </p>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            {expiredSession
              ? "La sesion ya no es valida."
              : errorMessage}
          </div>
        ) : null}

        {workshop?.intro ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Descripcion</h2>
              <Separator className="my-3" />
              <RichHtml
                html={workshop.intro}
                className="text-sm leading-7 text-[var(--color-muted)]"
              />
            </CardContent>
          </Card>
        ) : null}

        {submissions.length > 0 ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Envios</h2>
              <Separator className="my-3" />
              <div className="flex flex-col gap-1">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex flex-col gap-2 rounded-lg px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-[var(--color-foreground)]">
                        {submission.title}
                      </span>
                      {submission.timeCreated ? (
                        <span className="text-xs text-[var(--color-muted)]">
                          {formatDate(submission.timeCreated)}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-3">
                      {submission.published ? (
                        <span className="rounded-full border border-[var(--success-soft)] bg-[var(--success-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--success)]">
                          Publicado
                        </span>
                      ) : null}
                      {submission.grade !== undefined ? (
                        <span className="text-sm font-semibold text-[var(--color-accent)]">
                          {submission.grade.toFixed(2)}
                          {workshop?.maxGrade
                            ? ` / ${workshop.maxGrade}`
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
            No hay envios registrados en este taller.
          </p>
        ) : null}
      </div>
    </main>
  );
}
