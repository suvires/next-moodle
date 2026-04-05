import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { RichHtml } from "@/app/components/rich-html";
import { logger } from "@/lib/logger";
import {
  getGradeItems,
  getUserCourses,
  isAuthenticationError,
  resolveUserAccessProfile,
  type MoodleCourseAccessProfile,
} from "@/lib/moodle";
import type { MoodleGradeItem } from "@/lib/moodle";
import { getCourseRoleLabel, getCourseRoleTone } from "@/lib/course-roles";
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

  const courseTotal = gradeItems.find(
    (item) => item.type === "course"
  );
  const displayItems = gradeItems.filter(
    (item) => item.type !== "course"
  );

  return (
    <main className="flex min-h-screen flex-1 px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          breadcrumbs={[
            { label: "Mis cursos", href: "/mis-cursos" },
            { label: course?.fullname ?? "Curso", href: `/mis-cursos/${parsedCourseId}` },
            { label: "Calificaciones" },
          ]}
        />

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
              : "Aquí puedes revisar la información de evaluación que la app ya expone para este curso."}
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

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            {expiredSession
              ? "La sesion ya no es valida."
              : "No se pudieron cargar las calificaciones."}
          </div>
        ) : null}

        {displayItems.length > 0 ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Detalle de calificaciones</h2>
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
            No hay calificaciones disponibles para este curso.
          </p>
        ) : null}
      </div>
    </main>
  );
}
