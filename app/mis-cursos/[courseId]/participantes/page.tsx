import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { CourseRoleActionGrid } from "@/app/components/course-role-action-grid";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { logger } from "@/lib/logger";
import {
  getCourseParticipants,
  getUserCourses,
  isAccessException,
  isAuthenticationError,
  resolveUserAccessProfile,
  type MoodleCourseAccessProfile,
  type MoodleCourseParticipant,
} from "@/lib/moodle";
import {
  getCourseOverviewActionSections,
  getCourseRoleLabel,
  getCourseRoleTone,
} from "@/lib/course-roles";
import { getSession } from "@/lib/session";

type ParticipantsPageProps = {
  params: Promise<{
    courseId: string;
  }>;
};

function getInitials(name?: string) {
  return (
    name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

function formatDate(value?: number) {
  if (!value) return "Sin registro";
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value * 1000));
}

function getParticipantRoleChips(participant: MoodleCourseParticipant) {
  if (participant.roles.length === 0) {
    return [getCourseRoleLabel(participant.roleBucket)];
  }

  return participant.roles.map((role) => role.name);
}

export default async function ParticipantsPage({
  params,
}: ParticipantsPageProps) {
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
  let participants: MoodleCourseParticipant[] = [];
  let errorMessage: string | null = null;
  let expiredSession = false;
  let courseAccess: MoodleCourseAccessProfile | null = null;

  try {
    const [coursesResult, participantsResult, accessProfile] = await Promise.all([
      getUserCourses(session.token, session.userId),
      getCourseParticipants(session.token, parsedCourseId),
      resolveUserAccessProfile(session.token, session.userId).catch(() => null),
    ]);

    courses = coursesResult;
    participants = participantsResult;
    courseAccess =
      accessProfile?.courseCapabilities.find(
        (course) => course.courseId === parsedCourseId
      ) || null;
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Participants page load failed", {
      userId: session.userId,
      courseId: parsedCourseId,
      error,
    });
    errorMessage = isAccessException(error)
      ? "Tu cuenta no puede consultar participantes en este curso."
      : "No se pudieron cargar los participantes del curso.";
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

  if (
    !errorMessage &&
    effectiveCourseAccess.roleBucket === "student" &&
    !effectiveCourseAccess.canManageParticipants
  ) {
    notFound();
  }

  const actionSections = getCourseOverviewActionSections(
    parsedCourseId,
    effectiveCourseAccess
  );

  const participantCounts = {
    student: participants.filter((participant) => participant.roleBucket === "student").length,
    teacher: participants.filter((participant) => participant.roleBucket === "teacher").length,
    editingTeacher: participants.filter((participant) => participant.roleBucket === "editing_teacher").length,
    manager: participants.filter((participant) => participant.roleBucket === "course_manager").length,
  };

  return (
    <main className="flex min-h-screen flex-1 px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          breadcrumbs={[
            { label: "Mis cursos", href: "/mis-cursos" },
            { label: course?.fullname ?? "Curso", href: `/mis-cursos/${parsedCourseId}` },
            { label: "Participantes" },
          ]}
        />

        <div>
          <div
            className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getCourseRoleTone(effectiveCourseAccess.roleBucket)}`}
          >
            {getCourseRoleLabel(effectiveCourseAccess.roleBucket)}
          </div>
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            Participantes
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {course?.fullname || "Curso"} — {participants.length}{" "}
            {participants.length === 1 ? "participante" : "participantes"}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
            Vista básica de participantes para seguimiento docente y gestión del
            curso. Se muestran nombre, rol detectado, último acceso y correo si
            Moodle lo expone.
          </p>
        </div>

        <CourseRoleActionGrid sections={actionSections} />

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            {expiredSession ? "La sesión ya no es válida." : errorMessage}
          </div>
        ) : null}

        {!errorMessage ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Resumen</h2>
              <Separator className="my-3" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-soft)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Alumnado
                  </p>
                  <p className="mt-1 text-xl font-semibold text-[var(--color-foreground)]">
                    {participantCounts.student}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-soft)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Profesorado
                  </p>
                  <p className="mt-1 text-xl font-semibold text-[var(--color-foreground)]">
                    {participantCounts.teacher + participantCounts.editingTeacher}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-soft)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Con edición
                  </p>
                  <p className="mt-1 text-xl font-semibold text-[var(--color-foreground)]">
                    {participantCounts.editingTeacher}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-soft)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Gestión
                  </p>
                  <p className="mt-1 text-xl font-semibold text-[var(--color-foreground)]">
                    {participantCounts.manager}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {participants.length > 0 ? (
          <section className="flex flex-col gap-3">
            {participants.map((participant) => (
              <Card key={participant.id} className="rounded-xl">
                <CardContent className="px-5 py-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <Avatar className="h-11 w-11">
                        {participant.pictureUrl ? (
                          <AvatarImage
                            src={participant.pictureUrl}
                            alt={participant.fullName}
                          />
                        ) : null}
                        <AvatarFallback className="text-xs">
                          {getInitials(participant.fullName)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--color-foreground)]">
                          {participant.fullName}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {getParticipantRoleChips(participant).map((role) => (
                            <span
                              key={`${participant.id}-${role}`}
                              className="rounded-full bg-[var(--color-surface-soft)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2 text-sm text-[var(--color-muted)] md:text-right">
                      <p>
                        <span className="font-medium text-[var(--color-foreground)]">
                          Último acceso:
                        </span>{" "}
                        {formatDate(participant.lastAccess)}
                      </p>
                      {participant.email ? (
                        <p>
                          <span className="font-medium text-[var(--color-foreground)]">
                            Correo:
                          </span>{" "}
                          {participant.email}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        ) : !errorMessage ? (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            Moodle no ha devuelto participantes visibles para este curso.
          </p>
        ) : null}
      </div>
    </main>
  );
}
