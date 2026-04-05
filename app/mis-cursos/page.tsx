import Link from "next/link";
import { redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { CourseCard } from "@/app/components/course-card";
import { ProgressBar } from "@/app/components/progress-bar";
import { logger } from "@/lib/logger";
import {
  computeCourseProgress,
  getActivitiesCompletionStatus,
  getCourseGrades,
  getRecentCourses,
  getUnreadConversationsCount,
  getUnreadNotificationCount,
  getUpcomingEvents,
  getUsersById,
  isAuthenticationError,
  resolveUserAccessProfile,
  type MoodleCalendarEvent,
  type MoodleCourseGrade,
} from "@/lib/moodle";
import { getSession } from "@/lib/session";

export default async function MyCoursesPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  let errorMessage: string | null = null;
  let currentUserPictureUrl = session.userPictureUrl;
  const progressMap = new Map<number, { completed: number; total: number; percentage: number }>();
  const gradesMap = new Map<number, MoodleCourseGrade>();
  const upcomingMap = new Map<number, MoodleCalendarEvent>();
  let unreadMessages = 0;
  let unreadNotifications = 0;
  let recentCourses: Awaited<ReturnType<typeof getRecentCourses>> = [];
  let accessProfile: Awaited<ReturnType<typeof resolveUserAccessProfile>> = {
    isAuthenticated: true,
    hasCourses: false,
    enrolledCourseCount: 0,
    primaryRole: "authenticated_no_courses",
    isAdministrator: false,
    canManagePlatform: false,
    canTeachAnyCourse: false,
    canEditAnyCourse: false,
    canManageAnyCourse: false,
    siteInfo: {
      userId: session.userId,
      username: session.username,
      fullName: session.fullName,
      userPictureUrl: session.userPictureUrl,
      userIsSiteAdmin: false,
      userCanManageOwnFiles: false,
      canUploadFiles: false,
      canDownloadFiles: false,
      functions: [],
      advancedFeatures: [],
    },
    courseCapabilities: [],
  };

  try {
    accessProfile = await resolveUserAccessProfile(session.token, session.userId);
    currentUserPictureUrl =
      accessProfile.siteInfo.userPictureUrl || currentUserPictureUrl;

    const [progressResults, courseGrades, unreadCount, notifCount, recentCoursesResult, userPictureResult, upcomingEvents] = await Promise.all([
      Promise.allSettled(
        accessProfile.courseCapabilities.map((course) =>
          getActivitiesCompletionStatus(
            session.token,
            course.courseId,
            session.userId
          ).then((statuses) => ({
            courseId: course.courseId,
            progress: computeCourseProgress(statuses),
          }))
        )
      ),
      getCourseGrades(session.token, session.userId).catch(
        () => [] as MoodleCourseGrade[]
      ),
      getUnreadConversationsCount(session.token, session.userId).catch(() => 0),
      getUnreadNotificationCount(session.token, session.userId).catch(() => 0),
      getRecentCourses(session.token, session.userId).catch(
        () => [] as Awaited<ReturnType<typeof getRecentCourses>>
      ),
      !currentUserPictureUrl
        ? getUsersById(session.token, [session.userId]).catch(() => new Map())
        : Promise.resolve(new Map()),
      getUpcomingEvents(session.token).catch(() => [] as MoodleCalendarEvent[]),
    ]);

    if (!currentUserPictureUrl) {
      currentUserPictureUrl =
        userPictureResult.get(session.userId)?.pictureUrl || undefined;
    }

    unreadMessages = unreadCount;
    unreadNotifications = notifCount;
    recentCourses = recentCoursesResult;

    for (const result of progressResults) {
      if (result.status === "fulfilled") {
        progressMap.set(result.value.courseId, result.value.progress);
      }
    }

    for (const grade of courseGrades) {
      gradesMap.set(grade.courseId, grade);
    }

    const nowSecs = Math.floor(Date.now() / 1000);
    const sevenDaysSecs = 7 * 24 * 3600;
    for (const event of upcomingEvents) {
      if (!event.courseId || !event.timeStart) continue;
      const secsUntil = event.timeStart - nowSecs;
      if (secsUntil < 0 || secsUntil > sevenDaysSecs) continue;
      const existing = upcomingMap.get(event.courseId);
      if (!existing || event.timeStart < (existing.timeStart ?? Infinity)) {
        upcomingMap.set(event.courseId, event);
      }
    }
  } catch (error) {
    isAuthenticationError(error);
    logger.error("Mis cursos load failed", { userId: session.userId, error });
    errorMessage = "No se pudieron cargar tus cursos en este momento.";
  }

  const courseCapabilities = [...accessProfile.courseCapabilities];

  if (recentCourses.length > 0) {
    const recentIds = new Map(
      recentCourses.map((course, index) => [course.id, index] as const)
    );

    courseCapabilities.sort((a, b) => {
      const aRank = recentIds.has(a.courseId) ? recentIds.get(a.courseId)! : 999;
      const bRank = recentIds.has(b.courseId) ? recentIds.get(b.courseId)! : 999;
      return aRank - bRank;
    });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppTopbar
        fullName={session.fullName}
        userPictureUrl={currentUserPictureUrl}
        breadcrumbs={[{ label: "Mis cursos" }]}
        unreadMessages={unreadMessages}
        unreadNotifications={unreadNotifications}
        canManageOwnFiles={accessProfile.siteInfo.userCanManageOwnFiles}
      />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-5 py-8 md:px-8 md:py-10">
        <h1 className="animate-rise-in text-2xl font-semibold text-[var(--foreground)]">
          Mis cursos
        </h1>

        {errorMessage ? (
          <div className="banner-danger">{errorMessage}</div>
        ) : null}

        {courseCapabilities.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {courseCapabilities.map((course, index) => {
              const progress = progressMap.get(course.courseId);
              const grade = gradesMap.get(course.courseId);
              const upcoming = upcomingMap.get(course.courseId);
              const hasProgress = progress && progress.total > 0;
              const hasGrade = Boolean(grade?.grade);

              const upcomingLabel = upcoming?.timeStart
                ? new Intl.DateTimeFormat("es-ES", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  }).format(new Date(upcoming.timeStart * 1000))
                : null;

              return (
                <Link key={course.courseId} href={`/mis-cursos/${course.courseId}`}>
                  <CourseCard
                    course={{
                      id: course.courseId,
                      fullname: course.fullname,
                      categoryName: course.categoryName,
                      summary: course.summary,
                    }}
                    animationDelay={index * 60}
                    action={
                      hasProgress || hasGrade || upcoming ? (
                        <div>
                          {upcoming && upcomingLabel ? (
                            <div className="mb-3 flex items-center gap-2">
                              <span className="chip chip-warning">Entrega próxima</span>
                              <span className="text-xs text-[var(--muted)]">{upcomingLabel}</span>
                            </div>
                          ) : null}
                          {hasProgress ? (
                            <div className="mb-3">
                              <div className="mb-1.5 flex items-center justify-between text-sm">
                                <span className="text-[var(--muted)]">Progreso</span>
                                <span className="font-semibold text-[var(--foreground)]">
                                  {progress.percentage}%
                                </span>
                              </div>
                              <ProgressBar percentage={progress.percentage} />
                            </div>
                          ) : null}
                          {hasGrade ? (
                            <p className="text-sm text-[var(--muted)]">
                              Nota:{" "}
                              <span className="font-semibold text-[var(--accent)]">
                                {grade!.grade}
                              </span>
                            </p>
                          ) : null}
                        </div>
                      ) : undefined
                    }
                  />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-10 text-center">
            <p className="text-base font-medium text-[var(--foreground)]">
              No hay cursos visibles para esta cuenta.
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Puedes explorar el catálogo público o revisar si la cuenta debe
              tener acceso a cursos, docencia o gestión.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                href="/catalogo"
                className="rounded-full bg-[var(--foreground)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
              >
                Ir al catálogo
              </Link>
              <Link
                href="/perfil"
                className="rounded-full border border-[var(--line-strong)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-strong)]"
              >
                Ver perfil
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
