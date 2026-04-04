import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { ForumDiscussionForm } from "@/app/components/forum-discussion-form";
import { RichHtml } from "@/app/components/rich-html";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
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
  viewForum,
} from "@/lib/moodle";
import { getSession } from "@/lib/session";

type ForumPageProps = {
  params: Promise<{ forumId: string }>;
  searchParams: Promise<{ courseId?: string }>;
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
        discussionsAccessError = "Tienes acceso al foro, pero Moodle no permite listar sus discusiones con este usuario o contexto.";
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
      const courseContents = await getCourseContents(session.token, forum.courseId);
      forumModule =
        courseContents
          .flatMap((section) => section.modules)
          .find((module) => module.id === forum.courseModuleId) || null;
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

  return (
    <main className="grain-overlay relative flex min-h-screen flex-1 overflow-x-hidden px-5 py-6 md:px-8 md:py-8">
      <div className="ambient-orb ambient-orb-white left-[-6rem] top-[-2rem] h-52 w-52 md:h-72 md:w-72" />
      <div className="ambient-orb ambient-orb-blue right-[-8rem] top-12 h-72 w-72 md:h-[28rem] md:w-[28rem]" />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          sectionLabel="Foros"
          actions={
            <Button asChild variant="outline" size="sm">
              <Link href={backHref}>Volver al curso</Link>
            </Button>
          }
        />

        <Card className="hero-panel rounded-[2rem]">
          <CardContent className="relative z-10 px-6 py-8 md:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl">
                {course ? (
                  <p className="text-[0.72rem] font-semibold tracking-[0.28em] text-[var(--color-accent-soft)] uppercase">
                    {course.fullname}
                  </p>
                ) : null}
                <h1 className="display-face mt-4 text-balance text-5xl leading-[0.94] text-[var(--color-foreground)] md:text-6xl">
                  {forum?.name || "Foro"}
                </h1>
                {forum?.intro ? (
                  <>
                    <Separator className="my-5 max-w-xl" />
                    <RichHtml
                      html={forum.intro}
                      className="max-w-3xl text-sm leading-8 text-[var(--color-muted)]"
                    />
                  </>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[17rem] lg:grid-cols-1">
                <div className="metric-chip rounded-[1.2rem] px-4 py-4">
                  <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-[var(--color-accent-soft)] uppercase">
                    Hilos
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-[var(--color-foreground)]">
                    {discussions.length}
                  </p>
                </div>
                <div className="metric-chip rounded-[1.2rem] px-4 py-4">
                  <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-[var(--color-accent-soft)] uppercase">
                    Tipo
                  </p>
                  <p className="mt-2 text-sm text-[var(--color-foreground)]">
                    Discusiones del curso
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {errorMessage ? (
          <Card className="rounded-[1.5rem] border-[rgba(255,124,124,0.24)] bg-[rgba(255,124,124,0.08)]">
            <CardContent className="px-6 py-5 text-sm leading-7 text-[var(--color-danger)]">
              <p className="font-semibold">
                {expiredSession ? "La sesión ya no es válida." : "No se pudo cargar el foro."}
              </p>
              <p className="mt-1 opacity-80">{errorMessage}</p>
            </CardContent>
          </Card>
        ) : null}

        {discussionsAccessError ? (
          <Card className="rounded-[1.5rem] border-[rgba(255,191,144,0.24)] bg-[rgba(255,191,144,0.08)]">
            <CardContent className="px-6 py-5 text-sm leading-7 text-[var(--color-accent-soft)]">
              <p className="font-semibold">No se pudieron listar las discusiones.</p>
              <p className="mt-1 opacity-80">{discussionsAccessError}</p>
            </CardContent>
          </Card>
        ) : null}

        {forum && postingWindow.cutoffDateReached ? (
          <Card className="rounded-[1.5rem] border-[rgba(255,191,144,0.24)] bg-[rgba(255,191,144,0.08)]">
            <CardContent className="px-6 py-5 text-sm leading-7 text-[var(--color-accent-soft)]">
              <p className="font-semibold">La publicación está cerrada.</p>
              <p className="mt-1 opacity-80">
                Puedes seguir consultando el foro.
                {postingWindow.cutoffDate
                  ? ` La fecha límite fue el ${formatDate(postingWindow.cutoffDate)}.`
                  : ""}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {forum && postingWindow.isPastDueButOpen ? (
          <Card className="rounded-[1.5rem] border-[rgba(255,191,144,0.24)] bg-[rgba(255,191,144,0.08)]">
            <CardContent className="px-6 py-5 text-sm leading-7 text-[var(--color-accent-soft)]">
              <p className="font-semibold">La fecha de entrega ya ha pasado.</p>
              <p className="mt-1 opacity-80">
                Aun puedes publicar en este foro
                {postingWindow.cutoffDate
                  ? ` hasta la fecha límite: ${formatDate(postingWindow.cutoffDate)}.`
                  : "."}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {forum && canStartDiscussionUi ? (
          <Card className="rounded-[1.7rem]">
            <CardContent className="px-6 py-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.72rem] font-semibold tracking-[0.24em] text-[var(--color-accent-soft)] uppercase">
                    Nuevo hilo
                  </p>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">
                    Publica una nueva discusión dentro de este foro.
                  </p>
                </div>
              </div>
              <ForumDiscussionForm forumId={forum.id} returnPath={returnPath} />
            </CardContent>
          </Card>
        ) : null}

        <section className="flex flex-col gap-4">
          {discussions.length > 0 ? (
            discussions.map((discussion, index) => (
              <Card
                key={discussion.id}
                className="animate-rise-in rounded-[1.7rem]"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <CardContent className="px-6 py-6">
                  <Link
                    href={
                      resolvedSearchParams.courseId
                        ? `${forumBasePath}/discusiones/${discussion.id}?courseId=${resolvedSearchParams.courseId}`
                        : `${forumBasePath}/discusiones/${discussion.id}`
                    }
                    className="block"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      {discussion.pinned ? (
                        <span className="metric-chip rounded-full px-3 py-1 text-[0.66rem] font-semibold tracking-[0.22em] text-[var(--color-accent-soft)] uppercase">
                          Fijado
                        </span>
                      ) : null}
                      {discussion.locked ? (
                        <span className="metric-chip rounded-full px-3 py-1 text-[0.66rem] font-semibold tracking-[0.22em] text-[var(--color-muted)] uppercase">
                          Cerrado
                        </span>
                      ) : null}
                    </div>
                    <h2 className="display-face mt-5 text-3xl leading-tight text-[var(--color-foreground)]">
                      {discussion.title}
                    </h2>

                    <Separator className="my-5" />

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-[1.2rem] border border-white/8 bg-white/4 px-4 py-4">
                        <p className="text-[0.68rem] font-semibold tracking-[0.22em] text-[var(--color-accent-soft)] uppercase">
                          Inicio
                        </p>
                        <div className="mt-4 flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            {discussion.authorPictureUrl ? (
                              <AvatarImage
                                src={getMoodleMediaProxyUrl(discussion.authorPictureUrl)}
                                alt={discussion.startedByName || discussion.authorName || "Usuario"}
                              />
                            ) : null}
                            <AvatarFallback>
                              {getInitials(discussion.startedByName || discussion.authorName)}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-medium text-[var(--color-foreground)]">
                            {discussion.startedByName || discussion.authorName || "Usuario"}
                          </p>
                        </div>
                        <p className="mt-3 text-sm text-[var(--color-muted)]">
                          {formatDate(discussion.startedAt || discussion.createdAt)}
                        </p>
                      </div>

                      <div className="rounded-[1.2rem] border border-white/8 bg-white/4 px-4 py-4">
                        <p className="text-[0.68rem] font-semibold tracking-[0.22em] text-[var(--color-accent-soft)] uppercase">
                          Último mensaje
                        </p>
                        <div className="mt-4 flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            {discussion.lastAuthorPictureUrl ? (
                              <AvatarImage
                                src={getMoodleMediaProxyUrl(discussion.lastAuthorPictureUrl)}
                                alt={discussion.lastAuthorName || discussion.authorName || "Usuario"}
                              />
                            ) : null}
                            <AvatarFallback>
                              {getInitials(discussion.lastAuthorName || discussion.authorName)}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-medium text-[var(--color-foreground)]">
                            {discussion.lastAuthorName || discussion.authorName || "Usuario"}
                          </p>
                        </div>
                        <p className="mt-3 text-sm text-[var(--color-muted)]">
                          {formatDate(discussion.modifiedAt || discussion.startedAt || discussion.createdAt)}
                        </p>
                      </div>

                      <div className="rounded-[1.2rem] border border-white/8 bg-white/4 px-4 py-4">
                        <p className="text-[0.68rem] font-semibold tracking-[0.22em] text-[var(--color-accent-soft)] uppercase">
                          Respuestas
                        </p>
                        <p className="mt-4 text-4xl font-semibold text-[var(--color-foreground)]">
                          {discussion.repliesCount}
                        </p>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="hero-panel rounded-[1.7rem]">
              <CardContent className="px-8 py-10">
                <p className="text-[0.72rem] font-semibold tracking-[0.24em] text-[var(--color-accent-soft)] uppercase">
                  Sin hilos
                </p>
                <h2 className="display-face mt-4 text-4xl text-[var(--color-foreground)]">
                  Este foro todavía no tiene discusiones.
                </h2>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
}
