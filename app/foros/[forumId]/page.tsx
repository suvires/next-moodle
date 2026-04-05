import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { CourseRoleActionGrid } from "@/app/components/course-role-action-grid";
import { ForumDiscussionForm } from "@/app/components/forum-discussion-form";
import { RichHtml } from "@/app/components/rich-html";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Separator } from "@/app/components/ui/separator";
import { getForumPostingWindow } from "@/lib/forum-posting";
import { logger } from "@/lib/logger";
import { getMoodleMediaProxyUrl } from "@/lib/moodle-media";
import {
  getCourseContents,
  canAddForumDiscussion,
  getForumDiscussions,
  getForumsByCourses,
  getUserCourses,
  isAuthenticationError,
  isAccessException,
  resolveUserAccessProfile,
  type MoodleCourseAccessProfile,
  viewForum,
} from "@/lib/moodle";
import {
  getActivityRoleActions,
  getCourseRoleLabel,
  getCourseRoleTone,
  shouldShowStudentParticipationActions,
} from "@/lib/course-roles";
import { getSession } from "@/lib/session";

type ForumPageProps = {
  params: Promise<{ forumId: string }>;
  searchParams: Promise<{ courseId?: string; filter?: string }>;
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
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value * 1000));
}

export default async function ForumPage({ params, searchParams }: ForumPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const [{ forumId }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const parsedForumId = Number(forumId);

  if (!Number.isInteger(parsedForumId) || parsedForumId <= 0) {
    notFound();
  }

  let courses = [] as Awaited<ReturnType<typeof getUserCourses>>;
  let discussions = [] as Awaited<ReturnType<typeof getForumDiscussions>>;
  let forums = [] as Awaited<ReturnType<typeof getForumsByCourses>>;
  let canStartDiscussion = false;
  let errorMessage: string | null = null;
  let discussionsAccessError: string | null = null;
  let expiredSession = false;
  let forumModule:
    | Awaited<ReturnType<typeof getCourseContents>>[number]["modules"][number]
    | null = null;
  let courseAccess: MoodleCourseAccessProfile | null = null;

  try {
    courses = await getUserCourses(session.token, session.userId);
    forums = await getForumsByCourses(
      session.token,
      courses.map((course) => course.id)
    );

    try {
      discussions = await getForumDiscussions(session.token, parsedForumId);
    } catch (error) {
      if (isAccessException(error)) {
        logger.warn("Forum discussions listing blocked by access rules", {
          userId: session.userId,
          forumId: parsedForumId,
          error,
        });
        discussionsAccessError = "No se pudieron cargar las discusiones.";
      } else {
        logger.error("Forum discussions listing failed", {
          userId: session.userId,
          forumId: parsedForumId,
          error,
        });
        throw error;
      }
    }
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Forum page load failed", {
      userId: session.userId,
      forumId: parsedForumId,
      error,
    });
    errorMessage = "No se pudo cargar el foro.";
  }

  if (!errorMessage) {
    await viewForum(session.token, parsedForumId).catch((error) => {
      logger.warn("Forum view registration failed", {
        userId: session.userId,
        forumId: parsedForumId,
        error,
      });
    });
    canStartDiscussion = await canAddForumDiscussion(session.token, parsedForumId).catch(
      (error) => {
        logger.warn("Forum discussion permission check failed", {
          userId: session.userId,
          forumId: parsedForumId,
          error,
        });
        return false;
      }
    );
  }

  const forum = forums.find((item) => item.id === parsedForumId);

  if (!forum && !errorMessage) {
    notFound();
  }

  if (forum && !errorMessage) {
    try {
      const [courseContents, accessProfile] = await Promise.all([
        getCourseContents(session.token, forum.courseId),
        resolveUserAccessProfile(session.token, session.userId).catch(() => null),
      ]);
      forumModule =
        courseContents
          .flatMap((section) => section.modules)
          .find((module) => module.id === forum.courseModuleId) || null;
      courseAccess =
        accessProfile?.courseCapabilities.find(
          (course) => course.courseId === forum.courseId
        ) || null;
    } catch (error) {
      logger.warn("Forum module metadata load failed", {
        userId: session.userId,
        forumId: parsedForumId,
        courseId: forum.courseId,
        error,
      });
    }
  }

  const postingWindow = getForumPostingWindow(forumModule?.dates || []);
  const canStartDiscussionUi = Boolean(
    forum &&
      !postingWindow.cutoffDateReached &&
      (canStartDiscussion ||
        (postingWindow.isPastDueButOpen && forum.canCreateDiscussions))
  );

  const backHref = resolvedSearchParams.courseId
    ? `/mis-cursos/${resolvedSearchParams.courseId}`
    : "/mis-cursos";
  const forumBasePath = `/foros/${parsedForumId}`;
  const returnPath = resolvedSearchParams.courseId
    ? `${forumBasePath}?courseId=${resolvedSearchParams.courseId}`
    : forumBasePath;
  const course = forum ? courses.find((item) => item.id === forum.courseId) : null;
  const effectiveCourseAccess: MoodleCourseAccessProfile | null = forum
    ? courseAccess || {
        courseId: forum.courseId,
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
      }
    : null;
  const canParticipateAsStudent =
    effectiveCourseAccess &&
    shouldShowStudentParticipationActions(effectiveCourseAccess);
  const roleActionSection = effectiveCourseAccess
    ? {
        title:
          effectiveCourseAccess.roleBucket === "student"
            ? "Participación"
            : effectiveCourseAccess.roleBucket === "teacher"
              ? "Seguimiento y revisión"
              : effectiveCourseAccess.roleBucket === "editing_teacher"
                ? "Edición ligera"
                : "Administración del curso",
        description:
          effectiveCourseAccess.roleBucket === "student"
            ? "Accesos rápidos para leer, participar y volver al contexto del curso."
            : "Accesos disponibles hoy para revisar el foro desde tu rol real en el curso.",
        tone:
          effectiveCourseAccess.roleBucket === "student"
            ? "success"
            : effectiveCourseAccess.roleBucket === "course_manager"
              ? "warning"
              : "accent",
        actions: getActivityRoleActions({
          courseId: effectiveCourseAccess.courseId,
          courseAccess: effectiveCourseAccess,
          activityType: "forum",
        }),
      } as const
    : null;
  const discussionFilter = resolvedSearchParams.filter || "all";
  const visibleDiscussions = discussions.filter((discussion) => {
    switch (discussionFilter) {
      case "unanswered":
        return discussion.repliesCount === 0;
      case "pinned":
        return discussion.pinned;
      case "locked":
        return discussion.locked;
      case "open":
        return !discussion.locked;
      default:
        return true;
    }
  });

  return (
    <div className="flex min-h-screen flex-col">
      <AppTopbar
        fullName={session.fullName}
        userPictureUrl={session.userPictureUrl}
        breadcrumbs={[
          { label: "Mis cursos", href: "/mis-cursos" },
          ...(course ? [{ label: course.fullname, href: backHref }] : []),
          { label: forum?.name ?? "Foro" },
        ]}
        actions={
          forum && effectiveCourseAccess && effectiveCourseAccess.roleBucket !== "student" ? (
            <Link
              href={`/mis-cursos/${forum.courseId}/reportes`}
              className="text-[var(--muted)] transition hover:text-[var(--foreground)]"
            >
              Reportes
            </Link>
          ) : undefined
        }
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 md:px-8 md:py-10">
        <div className="animate-rise-in mb-8">
          {course && (
            <p className="mb-1 text-sm text-[var(--muted)]">{course.fullname}</p>
          )}
          {effectiveCourseAccess ? (
            <div className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getCourseRoleTone(effectiveCourseAccess.roleBucket)}`}>
              {getCourseRoleLabel(effectiveCourseAccess.roleBucket)}
            </div>
          ) : null}
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            {forum?.name || "Foro"}
          </h1>
          {forum?.intro && (
            <>
              <Separator className="my-4 max-w-xl" />
              <RichHtml
                html={forum.intro}
                className="max-w-3xl text-sm leading-relaxed text-[var(--muted)]"
              />
            </>
          )}
          <p className="mt-2 text-sm text-[var(--muted)]">
            {discussions.length} {discussions.length === 1 ? "hilo" : "hilos"}
          </p>
          {effectiveCourseAccess ? (
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
              {effectiveCourseAccess.roleBucket === "student"
                ? "Esta vista está orientada a leer y participar en discusiones del curso."
                : "Esta vista refleja tu rol real en el curso mientras revisas y participas en el foro."}
            </p>
          ) : null}
        </div>

        {roleActionSection ? (
          <CourseRoleActionGrid sections={[roleActionSection]} />
        ) : null}

        {effectiveCourseAccess && effectiveCourseAccess.roleBucket !== "student" ? (
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "Todos" },
              { key: "unanswered", label: "Sin respuesta" },
              { key: "pinned", label: "Fijados" },
              { key: "locked", label: "Cerrados" },
              { key: "open", label: "Abiertos" },
            ].map((filter) => {
              const isActive = discussionFilter === filter.key;
              const href =
                filter.key === "all"
                  ? returnPath
                  : `${returnPath}${returnPath.includes("?") ? "&" : "?"}filter=${filter.key}`;

              return (
                <Link
                  key={filter.key}
                  href={href}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    isActive
                      ? "border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      : "border-[var(--color-line)] text-[var(--color-muted)]"
                  }`}
                >
                  {filter.label}
                </Link>
              );
            })}
          </div>
        ) : null}

        {errorMessage && (
          <div className="banner-danger mb-4">
            {expiredSession ? "La sesión ya no es válida." : "No se pudo cargar el foro."}
          </div>
        )}
        {discussionsAccessError && (
          <div className="banner-danger mb-4">{discussionsAccessError}</div>
        )}
        {forum && postingWindow.cutoffDateReached && (
          <div className="banner-info mb-4">
            <p className="font-semibold">La publicación está cerrada.</p>
            <p className="mt-0.5">
              Puedes seguir consultando el foro.
              {postingWindow.cutoffDate ? ` La fecha límite fue el ${formatDate(postingWindow.cutoffDate)}.` : ""}
            </p>
          </div>
        )}
        {forum && postingWindow.isPastDueButOpen && (
          <div className="banner-warning mb-4">
            <p className="font-semibold">La fecha de entrega ya ha pasado.</p>
            <p className="mt-0.5">
              Aún puedes publicar en este foro
              {postingWindow.cutoffDate ? ` hasta la fecha límite: ${formatDate(postingWindow.cutoffDate)}.` : "."}
            </p>
          </div>
        )}

        {forum && canStartDiscussionUi && canParticipateAsStudent ? (
          <div className="mb-6 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
            <p className="mb-1 font-bold text-[var(--foreground)]">Nuevo hilo</p>
            <p className="mb-4 text-sm text-[var(--muted)]">
              Publica una nueva discusión dentro de este foro.
            </p>
            <ForumDiscussionForm forumId={forum.id} returnPath={returnPath} />
          </div>
        ) : null}

        {forum && canStartDiscussionUi && !canParticipateAsStudent ? (
          <div className="mb-6 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
            <p className="mb-1 font-bold text-[var(--foreground)]">
              Participación del alumno
            </p>
            <p className="text-sm leading-7 text-[var(--muted)]">
              El formulario para abrir nuevos hilos se oculta porque esta vista
              está priorizando seguimiento y revisión según tu rol actual.
            </p>
          </div>
        ) : null}

        {effectiveCourseAccess && effectiveCourseAccess.roleBucket !== "student" ? (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                Hilos
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                {discussions.length}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                Sin respuesta
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                {discussions.filter((discussion) => discussion.repliesCount === 0).length}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                Fijados
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                {discussions.filter((discussion) => discussion.pinned).length}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                Última actividad
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                {formatDate(
                  discussions.reduce((latest, discussion) => {
                    const current =
                      discussion.modifiedAt ||
                      discussion.startedAt ||
                      discussion.createdAt ||
                      0;
                    return current > latest ? current : latest;
                  }, 0) || undefined
                )}
              </p>
            </div>
          </div>
        ) : null}

        <section className="flex flex-col gap-3">
          {visibleDiscussions.length > 0 ? (
            visibleDiscussions.map((discussion) => (
              <Link
                key={discussion.id}
                href={
                  resolvedSearchParams.courseId
                    ? `${forumBasePath}/discusiones/${discussion.id}?courseId=${resolvedSearchParams.courseId}`
                    : `${forumBasePath}/discusiones/${discussion.id}`
                }
                className="group block rounded-xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4 transition hover:border-[var(--line-strong)] hover:shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {discussion.pinned && <span className="chip chip-accent">Fijado</span>}
                  {discussion.locked && <span className="chip chip-muted">Cerrado</span>}
                </div>
                <h2 className="mt-2 font-bold text-[var(--foreground)] group-hover:text-[var(--accent)]">
                  {discussion.title}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[var(--muted)]">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      {discussion.authorPictureUrl && (
                        <AvatarImage
                          src={getMoodleMediaProxyUrl(discussion.authorPictureUrl)}
                          alt={discussion.startedByName || discussion.authorName || "Usuario"}
                        />
                      )}
                      <AvatarFallback className="text-[0.5rem]">
                        {getInitials(discussion.startedByName || discussion.authorName)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{discussion.startedByName || discussion.authorName || "Usuario"}</span>
                  </div>
                  <span>{formatDate(discussion.startedAt || discussion.createdAt)}</span>
                  <span>{discussion.repliesCount} {discussion.repliesCount === 1 ? "respuesta" : "respuestas"}</span>
                </div>
              </Link>
            ))
          ) : !errorMessage && !discussionsAccessError ? (
            <p className="py-16 text-center text-[var(--muted)]">
              {effectiveCourseAccess && effectiveCourseAccess.roleBucket !== "student"
                ? "No hay discusiones que coincidan con el filtro actual."
                : "Este foro todavía no tiene discusiones."}
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
