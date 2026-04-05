import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { CourseRoleActionGrid } from "@/app/components/course-role-action-grid";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { RichHtml } from "@/app/components/rich-html";
import { logger } from "@/lib/logger";
import {
  getAssignments,
  getAssignmentGrades,
  getAssignmentSubmissions,
  getGradeItems,
  getQuizzesByCourses,
  getUserCourses,
  isAuthenticationError,
  resolveUserAccessProfile,
  type MoodleAssignmentGradeRecord,
  type MoodleAssignmentSubmissionRecord,
  type MoodleCourseAccessProfile,
  type MoodleGradeItem,
  type MoodleQuiz,
} from "@/lib/moodle";
import {
  getActivityRoleActions,
  getCourseRoleLabel,
  getCourseRoleTone,
} from "@/lib/course-roles";
import { getSession } from "@/lib/session";

type GradesPageProps = {
  params: Promise<{
    courseId: string;
  }>;
};

function GradeRow({ item }: { item: MoodleGradeItem }) {
  const isCategory = item.type === "category" || item.type === "course";

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
        isCategory ? "bg-[var(--color-accent)]/5" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {item.module ? (
            <span className="shrink-0 rounded-md bg-[var(--color-muted)]/10 px-2 py-0.5 text-xs text-[var(--color-muted)]">
              {item.module}
            </span>
          ) : null}
          <p
            className={`truncate text-sm ${
              isCategory
                ? "font-semibold text-[var(--color-foreground)]"
                : "text-[var(--color-foreground)]"
            }`}
          >
            {item.name}
          </p>
        </div>
        {item.feedback ? (
          <RichHtml
            html={item.feedback}
            className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-muted)]"
          />
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-4">
        {item.percentageFormatted ? (
          <span className="text-xs text-[var(--color-muted)]">
            {item.percentageFormatted}
          </span>
        ) : null}
        <span
          className={`text-sm font-semibold ${
            item.gradeFormatted && item.gradeFormatted !== "-"
              ? "text-[var(--color-accent)]"
              : "text-[var(--color-muted)]"
          }`}
        >
          {item.gradeFormatted || "-"}
        </span>
      </div>
    </div>
  );
}

export default async function GradesPage({ params }: GradesPageProps) {
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
  let gradeItems: MoodleGradeItem[] = [];
  let teacherAssignmentSummary = {
    totalAssignments: 0,
    totalSubmissions: 0,
    reviewed: 0,
    pendingReview: 0,
  };
  let teacherQuizzes: MoodleQuiz[] = [];
  let errorMessage: string | null = null;
  let expiredSession = false;
  let courseAccess: MoodleCourseAccessProfile | null = null;

  try {
    const [coursesResult, gradeItemsResult, accessProfile] = await Promise.all([
      getUserCourses(session.token, session.userId),
      getGradeItems(session.token, parsedCourseId, session.userId),
      resolveUserAccessProfile(session.token, session.userId).catch(() => null),
    ]);

    courses = coursesResult;
    gradeItems = gradeItemsResult;
    courseAccess =
      accessProfile?.courseCapabilities.find(
        (course) => course.courseId === parsedCourseId
      ) || null;

    if (courseAccess && courseAccess.roleBucket !== "student") {
      const [{ assignments }, quizzes] = await Promise.all([
        getAssignments(session.token, [parsedCourseId]).then(
          (items) =>
            items.find((item) => item.courseId === parsedCourseId) || {
              assignments: [],
            }
        ),
        getQuizzesByCourses(session.token, [parsedCourseId]).catch(() => []),
      ]);

      const assignmentResults = await Promise.all(
        assignments.map(async (assignment) => {
          const [submissions, grades] = await Promise.all([
            getAssignmentSubmissions(session.token, assignment.id).catch(
              () => [] as MoodleAssignmentSubmissionRecord[]
            ),
            getAssignmentGrades(session.token, assignment.id).catch(
              () => [] as MoodleAssignmentGradeRecord[]
            ),
          ]);

          return {
            submissions,
            grades,
          };
        })
      );

      teacherAssignmentSummary = assignmentResults.reduce(
        (summary, item) => {
          const submitted = item.submissions.filter(
            (submission) => submission.status === "submitted"
          ).length;
          const reviewed = item.grades.filter((grade) => Boolean(grade.grade)).length;

          return {
            totalAssignments: summary.totalAssignments + 1,
            totalSubmissions: summary.totalSubmissions + item.submissions.length,
            reviewed: summary.reviewed + reviewed,
            pendingReview: summary.pendingReview + Math.max(submitted - reviewed, 0),
          };
        },
        {
          totalAssignments: 0,
          totalSubmissions: 0,
          reviewed: 0,
          pendingReview: 0,
        }
      );
      teacherQuizzes = quizzes;
    }
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Grades page load failed", {
      userId: session.userId,
      courseId: parsedCourseId,
      error,
    });
    errorMessage = "No se pudieron cargar las calificaciones.";
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

  const courseTotal = gradeItems.find((item) => item.type === "course");
  const displayItems = gradeItems.filter((item) => item.type !== "course");
  const roleActionSection = {
    title:
      effectiveCourseAccess.roleBucket === "student"
        ? "Consulta de resultados"
        : effectiveCourseAccess.roleBucket === "teacher"
          ? "Seguimiento y revisión"
          : effectiveCourseAccess.roleBucket === "editing_teacher"
            ? "Edición ligera"
            : "Administración del curso",
    description:
      effectiveCourseAccess.roleBucket === "student"
        ? "Accesos rápidos para volver al curso y consultar tu actividad."
        : "Accesos disponibles hoy para revisar la evaluación del curso dentro de la app.",
    tone:
      effectiveCourseAccess.roleBucket === "student"
        ? "success"
        : effectiveCourseAccess.roleBucket === "course_manager"
          ? "warning"
          : "accent",
    actions: getActivityRoleActions({
      courseId: parsedCourseId,
      courseAccess: effectiveCourseAccess,
      activityType: "grades",
    }),
  } as const;

  return (
    <div className="flex min-h-screen flex-col">
      <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          breadcrumbs={[
            { label: "Mis cursos", href: "/mis-cursos" },
            { label: course?.fullname ?? "Curso", href: `/mis-cursos/${parsedCourseId}` },
            { label: "Calificaciones" },
          ]}
          actions={
            effectiveCourseAccess.roleBucket !== "student" ? (
              <Link
                href={`/mis-cursos/${parsedCourseId}/reportes`}
                className="text-[var(--muted)] transition hover:text-[var(--foreground)]"
              >
                Reportes
              </Link>
            ) : undefined
          }
      />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-5 py-6 md:px-8 md:py-8">

        <div>
          <div className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getCourseRoleTone(effectiveCourseAccess.roleBucket)}`}>
            {getCourseRoleLabel(effectiveCourseAccess.roleBucket)}
          </div>
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            Calificaciones
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {course?.fullname || "Curso"}
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
            {effectiveCourseAccess.roleBucket === "student"
              ? "Aquí ves el detalle de tus resultados y retroalimentación."
              : "Aquí puedes revisar la información de evaluación disponible y saltar al seguimiento operativo del curso."}
          </p>
          {courseTotal ? (
            <p className="mt-3 text-sm text-[var(--color-foreground)]">
              Nota del curso: {courseTotal.gradeFormatted || "-"}
              {courseTotal.percentageFormatted
                ? ` (${courseTotal.percentageFormatted})`
                : ""}
            </p>
          ) : null}
        </div>

        <CourseRoleActionGrid sections={[roleActionSection]} />

        {effectiveCourseAccess.roleBucket !== "student" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-xl">
              <CardContent className="px-5 py-5">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  Tareas
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">
                  {teacherAssignmentSummary.totalAssignments}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-xl">
              <CardContent className="px-5 py-5">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  Envíos visibles
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">
                  {teacherAssignmentSummary.totalSubmissions}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-xl">
              <CardContent className="px-5 py-5">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  Revisadas
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">
                  {teacherAssignmentSummary.reviewed}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-xl">
              <CardContent className="px-5 py-5">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  Pendientes / Quiz
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">
                  {teacherAssignmentSummary.pendingReview} / {teacherQuizzes.length}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            {expiredSession
              ? "La sesion ya no es valida."
              : "No se pudieron cargar las calificaciones."}
          </div>
        ) : null}

        {effectiveCourseAccess.roleBucket !== "student" ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Seguimiento académico</h2>
              <Separator className="my-3" />
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                Esta vista combina tu acceso al libro de calificaciones con un resumen operativo de evaluación. Para seguimiento completo del curso usa la vista de reportes.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/mis-cursos/${parsedCourseId}/reportes`}
                  className="rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-accent)]"
                >
                  Abrir reportes del curso
                </Link>
                <Link
                  href={`/mis-cursos/${parsedCourseId}/tareas?status=pending-review`}
                  className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-semibold text-[var(--color-muted)]"
                >
                  Ver tareas pendientes
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {displayItems.length > 0 ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">
                {effectiveCourseAccess.roleBucket === "student"
                  ? "Detalle de calificaciones"
                  : "Tu libro de calificaciones personal"}
              </h2>
              <Separator className="my-3" />
              <div className="flex flex-col gap-1">
                {displayItems.map((item) => (
                  <GradeRow key={item.id} item={item} />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : !errorMessage ? (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            {effectiveCourseAccess.roleBucket === "student"
              ? "No hay calificaciones disponibles para este curso."
              : "No hay calificaciones personales visibles para esta cuenta en este curso."}
          </p>
        ) : null}
      </main>
    </div>
  );
}
