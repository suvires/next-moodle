import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { ProgressBar } from "@/app/components/progress-bar";
import { logger } from "@/lib/logger";
import {
  getActivitiesCompletionStatus,
  getCourseParticipants,
  getGradeItems,
  getUnreadConversationsCount,
  getUnreadNotificationCount,
  getUserCourses,
  isAuthenticationError,
  resolveUserAccessProfile,
  type MoodleCourseParticipant,
  type MoodleGradeItem,
} from "@/lib/moodle";
import { getSession } from "@/lib/session";

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

function getGradeColor(gradeRaw?: number, gradeMax?: number) {
  if (gradeRaw === undefined || gradeMax === undefined || gradeMax === 0) return "text-[var(--muted)]";
  const pct = (gradeRaw / gradeMax) * 100;
  if (pct >= 70) return "text-[var(--success)]";
  if (pct >= 50) return "text-[var(--warning)]";
  return "text-[var(--danger)]";
}

export default async function ParticipantDetailPage({
  params,
}: {
  params: Promise<{ courseId: string; userId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/");

  const { courseId, userId } = await params;
  const parsedCourseId = Number(courseId);
  const parsedUserId = Number(userId);

  if (!parsedCourseId || !parsedUserId) notFound();

  let courseName = "Curso";
  let participant: MoodleCourseParticipant | null = null;
  let completionStatuses: Awaited<ReturnType<typeof getActivitiesCompletionStatus>> = [];
  let gradeItems: MoodleGradeItem[] = [];
  let unreadMessages = 0;
  let unreadNotifications = 0;
  let errorMessage: string | null = null;
  let expiredSession = false;

  try {
    const accessProfile = await resolveUserAccessProfile(session.token, session.userId);
    const capability = accessProfile.courseCapabilities.find((c) => c.courseId === parsedCourseId);

    if (!capability?.canManageCourse && !capability?.canManageParticipants) {
      notFound();
    }

    const [courses, participants, completions, grades, unreadCount, notifCount] = await Promise.all([
      getUserCourses(session.token, session.userId),
      getCourseParticipants(session.token, parsedCourseId),
      getActivitiesCompletionStatus(session.token, parsedCourseId, parsedUserId).catch(() => []),
      getGradeItems(session.token, parsedCourseId, parsedUserId).catch(() => []),
      getUnreadConversationsCount(session.token, session.userId).catch(() => 0),
      getUnreadNotificationCount(session.token, session.userId).catch(() => 0),
    ]);

    const course = courses.find((c) => c.id === parsedCourseId);
    if (!course) notFound();
    courseName = course.fullname;

    participant = participants.find((p) => p.id === parsedUserId) ?? null;
    if (!participant) notFound();

    completionStatuses = completions;
    gradeItems = grades;
    unreadMessages = unreadCount;
    unreadNotifications = notifCount;
  } catch (error) {
    if (isAuthenticationError(error)) {
      expiredSession = true;
    }
    logger.error("Participant detail load failed", { userId: session.userId, parsedCourseId, parsedUserId, error });
    errorMessage = "No se pudo cargar la información de este participante.";
  }

  const tracked = completionStatuses.filter((s) => s.tracking !== "none");
  const completed = tracked.filter((s) => s.completionState === "complete" || s.completionState === "complete-pass");
  const completionPct = tracked.length > 0 ? Math.round((completed.length / tracked.length) * 100) : null;

  const gradedItems = gradeItems.filter(
    (item) => item.type !== "category" && item.gradeFormatted && item.gradeFormatted !== "-"
  );

  return (
    <div className="flex min-h-screen flex-col">
      <AppTopbar
        fullName={session.fullName}
        userPictureUrl={session.userPictureUrl}
        breadcrumbs={[
          { label: "Mis cursos", href: "/mis-cursos" },
          { label: courseName, href: `/mis-cursos/${parsedCourseId}` },
          { label: "Participantes", href: `/mis-cursos/${parsedCourseId}/participantes` },
          { label: participant?.fullName ?? "Participante" },
        ]}
        unreadMessages={unreadMessages}
        unreadNotifications={unreadNotifications}
      />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-5 py-8 md:px-8 md:py-10">
        <div>
          <Link
            href={`/mis-cursos/${parsedCourseId}/participantes`}
            className="mb-3 inline-flex items-center gap-1 text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]"
          >
            ← Participantes
          </Link>
        </div>

        {errorMessage ? (
          <div className="banner-danger">
            <p className="font-semibold">
              {expiredSession ? "La sesión ya no es válida." : "Error al cargar datos."}
            </p>
            <p className="mt-1 opacity-80">{errorMessage}</p>
          </div>
        ) : null}

        {participant ? (
          <>
            {/* Profile header */}
            <div className="surface-card rounded-xl p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
                <Avatar className="h-16 w-16 shrink-0">
                  {participant.pictureUrl ? (
                    <AvatarImage src={participant.pictureUrl} alt={participant.fullName} />
                  ) : null}
                  <AvatarFallback className="text-base">
                    {getInitials(participant.fullName)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
                    {participant.fullName}
                  </h1>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {participant.roles.length > 0
                      ? participant.roles.map((role) => (
                          <span key={role.name} className="chip chip-muted">
                            {role.name}
                          </span>
                        ))
                      : null}
                  </div>
                  {participant.email ? (
                    <p className="mt-2 text-sm text-[var(--muted)]">{participant.email}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                    Último acceso
                  </p>
                  <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
                    {formatDate(participant.lastAccess)}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                    Actividades completadas
                  </p>
                  <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
                    {tracked.length > 0
                      ? `${completed.length} / ${tracked.length}`
                      : "Sin seguimiento"}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                    Progreso
                  </p>
                  {completionPct !== null ? (
                    <div className="mt-2 flex items-center gap-2">
                      <ProgressBar percentage={completionPct} className="flex-1" />
                      <span className="shrink-0 text-sm font-semibold text-[var(--foreground)]">
                        {completionPct}%
                      </span>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm font-medium text-[var(--muted)]">—</p>
                  )}
                </div>
              </div>
            </div>

            {/* Grade items */}
            {gradedItems.length > 0 ? (
              <div className="surface-card overflow-hidden rounded-xl">
                <div className="border-b border-[var(--line)] px-6 py-4">
                  <h2 className="font-semibold text-[var(--foreground)]">Calificaciones</h2>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    {gradedItems.length} {gradedItems.length === 1 ? "elemento calificado" : "elementos calificados"}
                  </p>
                </div>
                <div className="divide-y divide-[var(--line)]">
                  {gradedItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 px-6 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--foreground)]">
                          {item.name}
                        </p>
                        {item.module ? (
                          <p className="text-xs text-[var(--muted)]">{item.module}</p>
                        ) : null}
                        {item.feedback ? (
                          <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                            {item.feedback}
                          </p>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`text-sm font-semibold ${getGradeColor(item.gradeRaw, item.gradeMax)}`}>
                          {item.gradeFormatted}
                        </p>
                        {item.percentageFormatted ? (
                          <p className="text-xs text-[var(--muted)]">{item.percentageFormatted}</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : !errorMessage ? (
              <div className="surface-card rounded-xl p-6">
                <h2 className="font-semibold text-[var(--foreground)]">Calificaciones</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Moodle no ha devuelto elementos calificados para este participante.
                </p>
              </div>
            ) : null}

            {/* Activity completion breakdown */}
            {tracked.length > 0 ? (
              <div className="surface-card overflow-hidden rounded-xl">
                <div className="border-b border-[var(--line)] px-6 py-4">
                  <h2 className="font-semibold text-[var(--foreground)]">Progreso de actividades</h2>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    {completed.length} completadas de {tracked.length} con seguimiento
                  </p>
                </div>
                <div className="divide-y divide-[var(--line)]">
                  {tracked.map((status) => {
                    const isDone =
                      status.completionState === "complete" ||
                      status.completionState === "complete-pass";
                    const isFailed = status.completionState === "complete-fail";
                    return (
                      <div key={status.courseModuleId} className="flex items-center justify-between gap-4 px-6 py-3">
                        <p className="min-w-0 flex-1 truncate text-sm text-[var(--foreground)]">
                          {status.modname}
                          {status.instance ? ` #${status.instance}` : ""}
                        </p>
                        <span
                          className={
                            isDone
                              ? "chip chip-success"
                              : isFailed
                                ? "chip chip-danger"
                                : "chip chip-muted"
                          }
                        >
                          {isDone ? "Completada" : isFailed ? "No superada" : "Pendiente"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </main>
    </div>
  );
}
