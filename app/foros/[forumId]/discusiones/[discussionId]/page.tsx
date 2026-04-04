import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { ForumReplyForm } from "@/app/components/forum-reply-form";
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
  getDiscussionPosts,
  getForumDiscussions,
  getForumsByCourses,
  getUserCourses,
  isAuthenticationError,
  isAccessException,
  viewForum,
  viewForumDiscussion,
} from "@/lib/moodle";
import { getSession } from "@/lib/session";

type ForumDiscussionPageProps = {
  params: Promise<{
    forumId: string;
    discussionId: string;
  }>;
  searchParams: Promise<{
    courseId?: string;
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

export default async function ForumDiscussionPage({
  params,
  searchParams,
}: ForumDiscussionPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const [{ forumId, discussionId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const parsedForumId = Number(forumId);
  const parsedDiscussionId = Number(discussionId);

  if (
    !Number.isInteger(parsedForumId) ||
    parsedForumId <= 0 ||
    !Number.isInteger(parsedDiscussionId) ||
    parsedDiscussionId <= 0
  ) {
    notFound();
  }

  let courses = [] as Awaited<ReturnType<typeof getUserCourses>>;
  let forums = [] as Awaited<ReturnType<typeof getForumsByCourses>>;
  let discussions = [] as Awaited<ReturnType<typeof getForumDiscussions>>;
  let posts = [] as Awaited<ReturnType<typeof getDiscussionPosts>>;
  let errorMessage: string | null = null;
  let expiredSession = false;
  let forumModule:
    | Awaited<ReturnType<typeof getCourseContents>>[number]["modules"][number]
    | null = null;

  try {
    courses = await getUserCourses(session.token, session.userId);
    [forums, posts] = await Promise.all([
      getForumsByCourses(
        session.token,
        courses.map((course) => course.id)
      ),
      getDiscussionPosts(session.token, parsedDiscussionId),
    ]);

    try {
      discussions = await getForumDiscussions(session.token, parsedForumId);
    } catch (error) {
      if (!isAccessException(error)) {
        logger.error("Forum discussions preload failed", {
          userId: session.userId,
          forumId: parsedForumId,
          discussionId: parsedDiscussionId,
          error,
        });
        throw error;
      }

      logger.warn("Forum discussions preload blocked by access rules", {
        userId: session.userId,
        forumId: parsedForumId,
        discussionId: parsedDiscussionId,
        error,
      });
    }
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Forum discussion page load failed", {
      userId: session.userId,
      forumId: parsedForumId,
      discussionId: parsedDiscussionId,
      error,
    });
    errorMessage = "No se pudo cargar la discusión.";
  }

  if (!errorMessage) {
    const results = await Promise.allSettled([
      viewForum(session.token, parsedForumId),
      viewForumDiscussion(session.token, parsedDiscussionId),
    ]);

    if (results[0].status === "rejected") {
      logger.warn("Forum view registration failed from discussion page", {
        userId: session.userId,
        forumId: parsedForumId,
        discussionId: parsedDiscussionId,
        error: results[0].reason,
      });
    }

    if (results[1].status === "rejected") {
      logger.warn("Forum discussion view registration failed", {
        userId: session.userId,
        forumId: parsedForumId,
        discussionId: parsedDiscussionId,
        error: results[1].reason,
      });
    }
  }

  const forum = forums.find((item) => item.id === parsedForumId);
  const discussion =
    discussions.find((item) => item.id === parsedDiscussionId) ||
    (posts.length > 0
      ? {
          id: parsedDiscussionId,
          title: posts[0]?.subject || "Discusión",
          repliesCount: Math.max(0, posts.length - 1),
          pinned: false,
          locked: false,
          canReply: posts.some((post) => post.canReply),
        }
      : null);

  if ((!forum || !discussion) && !errorMessage) {
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
      logger.warn("Forum discussion module metadata load failed", {
        userId: session.userId,
        forumId: parsedForumId,
        discussionId: parsedDiscussionId,
        courseId: forum.courseId,
        error,
      });
    }
  }

  const postingWindow = getForumPostingWindow(forumModule?.dates || []);

  const baseForumHref = resolvedSearchParams.courseId
    ? `/foros/${parsedForumId}?courseId=${resolvedSearchParams.courseId}`
    : `/foros/${parsedForumId}`;
  const returnPath = resolvedSearchParams.courseId
    ? `/foros/${parsedForumId}/discusiones/${parsedDiscussionId}?courseId=${resolvedSearchParams.courseId}`
    : `/foros/${parsedForumId}/discusiones/${parsedDiscussionId}`;
  const course = forum ? courses.find((item) => item.id === forum.courseId) : null;

  return (
    <main className="grain-overlay relative flex min-h-screen flex-1 overflow-x-hidden px-5 py-6 md:px-8 md:py-8">
      <div className="ambient-orb ambient-orb-white left-[-6rem] top-[-2rem] h-52 w-52 md:h-72 md:w-72" />
      <div className="ambient-orb ambient-orb-blue right-[-8rem] top-12 h-72 w-72 md:h-[28rem] md:w-[28rem]" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          sectionLabel="Discusión"
          actions={
            <Button asChild variant="outline" size="sm">
              <Link href={baseForumHref}>Volver al foro</Link>
            </Button>
          }
        />

        <Card className="hero-panel rounded-[2rem]">
          <CardContent className="relative z-10 px-6 py-8 md:px-8">
            <div className="max-w-4xl">
              {course ? (
                <p className="text-[0.72rem] font-semibold tracking-[0.28em] text-[var(--color-accent-soft)] uppercase">
                  {course.fullname}
                </p>
              ) : null}
              <h1 className="display-face mt-4 text-balance text-5xl leading-[0.94] text-[var(--color-foreground)] md:text-6xl">
                {discussion?.title || "Discusión"}
              </h1>
              {forum ? (
                <p className="mt-4 text-sm leading-8 text-[var(--color-muted)]">
                  {forum.name}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {errorMessage ? (
          <Card className="rounded-[1.5rem] border-[rgba(255,124,124,0.24)] bg-[rgba(255,124,124,0.08)]">
            <CardContent className="px-6 py-5 text-sm leading-7 text-[var(--color-danger)]">
              <p className="font-semibold">
                {expiredSession
                  ? "La sesión ya no es válida."
                  : "No se pudo cargar la discusión."}
              </p>
              <p className="mt-1 opacity-80">{errorMessage}</p>
            </CardContent>
          </Card>
        ) : null}

        {postingWindow.cutoffDateReached ? (
          <Card className="rounded-[1.5rem] border-[rgba(255,191,144,0.24)] bg-[rgba(255,191,144,0.08)]">
            <CardContent className="px-6 py-5 text-sm leading-7 text-[var(--color-accent-soft)]">
              <p className="font-semibold">La publicación está cerrada.</p>
              <p className="mt-1 opacity-80">
                Puedes seguir consultando la discusión.
                {postingWindow.cutoffDate
                  ? ` La fecha límite fue el ${new Intl.DateTimeFormat("es-ES", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(postingWindow.cutoffDate * 1000))}.`
                  : ""}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {postingWindow.isPastDueButOpen ? (
          <Card className="rounded-[1.5rem] border-[rgba(255,191,144,0.24)] bg-[rgba(255,191,144,0.08)]">
            <CardContent className="px-6 py-5 text-sm leading-7 text-[var(--color-accent-soft)]">
              <p className="font-semibold">La fecha de entrega ya ha pasado.</p>
              <p className="mt-1 opacity-80">
                Aun puedes responder en esta discusión
                {postingWindow.cutoffDate
                  ? ` hasta la fecha límite: ${new Intl.DateTimeFormat("es-ES", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(postingWindow.cutoffDate * 1000))}.`
                  : "."}
              </p>
            </CardContent>
          </Card>
        ) : null}

        <section className="flex flex-col gap-4">
          {posts.length > 0 ? (
            posts.map((post, index) => (
              <Card
                key={post.id}
                className="animate-rise-in rounded-[1.7rem]"
                style={{ animationDelay: `${index * 45}ms` }}
              >
                <CardContent className="px-6 py-6">
                  <div className="flex flex-col gap-5">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        {post.authorPictureUrl ? (
                          <AvatarImage
                            src={getMoodleMediaProxyUrl(post.authorPictureUrl)}
                            alt={post.authorName || "Usuario"}
                          />
                        ) : null}
                        <AvatarFallback>{getInitials(post.authorName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[var(--color-foreground)]">
                          {post.authorName || "Usuario"}
                        </p>
                        <h2 className="mt-1 text-xl font-semibold text-[var(--color-foreground)]">
                          {post.subject}
                        </h2>
                      </div>
                    </div>

                    {post.message ? (
                      <>
                        <Separator />
                        <RichHtml
                          html={post.message}
                          className="text-sm leading-8 text-[var(--color-muted)]"
                        />
                      </>
                    ) : null}

                    {!postingWindow.cutoffDateReached &&
                    ((discussion?.canReply && post.canReply) ||
                      (postingWindow.isPastDueButOpen && !discussion?.locked)) ? (
                      <>
                        <Separator />
                        <ForumReplyForm
                          postId={post.id}
                          subject={post.replySubject || `Re: ${post.subject}`}
                          returnPath={returnPath}
                        />
                      </>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="hero-panel rounded-[1.7rem]">
              <CardContent className="px-8 py-10">
                <p className="text-[0.72rem] font-semibold tracking-[0.24em] text-[var(--color-accent-soft)] uppercase">
                  Sin mensajes
                </p>
                <h2 className="display-face mt-4 text-4xl text-[var(--color-foreground)]">
                  Esta discusión está vacía.
                </h2>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
}
