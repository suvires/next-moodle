import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { logger } from "@/lib/logger";
import {
  getAssignments,
  getUserCourses,
  isAuthenticationError,
  resolveUserAccessProfile,
  type MoodleCourseAccessProfile,
} from "@/lib/moodle";
import type { MoodleAssignment } from "@/lib/moodle";
import { getCourseRoleLabel, getCourseRoleTone } from "@/lib/course-roles";
import { getSession } from "@/lib/session";

type AssignmentsPageProps = {
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

function dueDateTone(dueDate?: number) {
  if (!dueDate) return "text-[var(--color-muted)]";
  const now = Date.now() / 1000;
  if (dueDate < now) return "text-[var(--color-danger)]";
  if (dueDate - now < 3 * 24 * 3600) return "text-amber-400";
  return "text-[var(--color-muted)]";
}

export default async function AssignmentsPage({
  params,
}: AssignmentsPageProps) {
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
  let assignments: MoodleAssignment[] = [];
  let errorMessage: string | null = null;
  let expiredSession = false;
  let courseAccess: MoodleCourseAccessProfile | null = null;

  try {
    const [coursesResult, assignResult, accessProfile] = await Promise.all([
      getUserCourses(session.token, session.userId),
      getAssignments(session.token, [parsedCourseId]),
      resolveUserAccessProfile(session.token, session.userId).catch(() => null),
    ]);

    courses = coursesResult;
    assignments =
      assignResult.find((c) => c.courseId === parsedCourseId)?.assignments || [];
    courseAccess =
      accessProfile?.courseCapabilities.find(
        (course) => course.courseId === parsedCourseId
      ) || null;
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Assignments page load failed", {
      userId: session.userId,
      courseId: parsedCourseId,
      error,
    });
    errorMessage = "No se pudieron cargar las tareas.";
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

  return (
    <main className="flex min-h-screen flex-1 px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          breadcrumbs={[
            { label: "Mis cursos", href: "/mis-cursos" },
            { label: course?.fullname ?? "Curso", href: `/mis-cursos/${parsedCourseId}` },
            { label: "Tareas" },
          ]}
        />

        <div>
          <div className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getCourseRoleTone(effectiveCourseAccess.roleBucket)}`}>
            {getCourseRoleLabel(effectiveCourseAccess.roleBucket)}
          </div>
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            Tareas
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {course?.fullname || "Curso"} — {assignments.length}{" "}
            {assignments.length === 1 ? "tarea" : "tareas"}
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
            {effectiveCourseAccess.roleBucket === "student"
              ? "Esta vista está orientada al seguimiento y entrega de tus tareas."
              : "Esta vista te ayuda a revisar rápidamente las tareas disponibles dentro del curso."}
          </p>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            {expiredSession
              ? "La sesion ya no es valida."
              : "No se pudieron cargar las tareas."}
          </div>
        ) : null}

        {assignments.length > 0 ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Listado de tareas</h2>
              <Separator className="my-3" />
              <div className="flex flex-col gap-1">
                {assignments.map((assign) => (
                  <Link
                    key={assign.id}
                    href={`/mis-cursos/${parsedCourseId}/tareas/${assign.id}`}
                    className="group flex items-center justify-between rounded-lg px-4 py-3 transition hover:bg-[var(--color-accent)]/5"
                  >
                    <p className="min-w-0 truncate text-sm text-[var(--color-foreground)] group-hover:text-[var(--color-accent)]">
                      {assign.name}
                    </p>
                    <span
                      className={`shrink-0 pl-4 text-xs ${dueDateTone(assign.dueDate)}`}
                    >
                      {assign.dueDate
                        ? formatDate(assign.dueDate)
                        : "Sin fecha limite"}
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : !errorMessage ? (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            No hay tareas en este curso.
          </p>
        ) : null}
      </div>
    </main>
  );
}
