import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { CourseRoleActionGrid } from "@/app/components/course-role-action-grid";
import { ForumModerationForm } from "@/app/components/forum-moderation-form";
import { ForumReplyForm } from "@/app/components/forum-reply-form";
import { RichHtml } from "@/app/components/rich-html";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
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
  resolveUserAccessProfile,
  type MoodleCourseAccessProfile,
  viewForum,
  viewForumDiscussion,
} from "@/lib/moodle";
import {
  getActivityRoleActions,
  getCourseRoleLabel,
  getCourseRoleTone,
  shouldShowStudentParticipationActions,
} from "@/lib/course-roles";
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
  let courseAccess: MoodleCourseAccessProfile | null = null;

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
            ? "Accesos rápidos para leer y responder dentro de la discusión."
            : "Accesos disponibles hoy para revisar la discusión desde tu rol real.",
        tone:
          effectiveCourseAccess.roleBucket === "student"
            ? "success"
            : effectiveCourseAccess.roleBucket === "course_manager"
              ? "warning"
              : "accent",
        actions: getActivityRoleActions({
          courseId: effectiveCourseAccess.courseId,
          courseAccess: effectiveCourseAccess,
          activityType: "forum_discussion",
        }),
      } as const
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          breadcrumbs={[
            { label: "Mis cursos", href: "/mis-cursos" },
            ...(course ? [{ label: course.fullname, href: `/mis-cursos/${course.id}` }] : []),
            ...(forum ? [{ label: forum.name, href: baseForumHref }] : []),
            { label: discussion?.title ?? "Discusión" },
          ]}
      />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-5 py-6 md:px-8 md:py-8">

        <div>
          {course ? (
            <p className="mb-1 text-sm text-[var(--color-muted)]">
              {course.fullname}
            </p>
          ) : null}
          {effectiveCourseAccess ? (
            <div className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getCourseRoleTone(effectiveCourseAccess.roleBucket)}`}>
              {getCourseRoleLabel(effectiveCourseAccess.roleBucket)}
            </div>
          ) : null}
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            {discussion?.title || "Discusión"}
          </h1>
          {forum ? (
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {forum.name}
            </p>
          ) : null}
          {effectiveCourseAccess ? (
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
              {effectiveCourseAccess.roleBucket === "student"
                ? "Esta vista está orientada a leer y responder dentro de la discusión."
                : "Esta vista refleja tu rol real en el curso mientras participas o revisas la discusión."}
            </p>
          ) : null}
        </div>

        {roleActionSection ? (
          <CourseRoleActionGrid sections={[roleActionSection]} />
        ) : null}

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            {expiredSession
              ? "La sesión ya no es válida."
              : "No se pudo cargar la discusión."}
          </div>
        ) : null}

        {postingWindow.cutoffDateReached ? (
          <div className="rounded-lg border border-[var(--color-foreground)]/10 bg-[var(--color-foreground)]/[0.03] px-4 py-3 text-sm text-[var(--color-muted)]">
            <p className="font-medium">La publicación está cerrada.</p>
            <p className="mt-0.5">
              Puedes seguir consultando la discusión.
              {postingWindow.cutoffDate
                ? ` La fecha límite fue el ${new Intl.DateTimeFormat("es-ES", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(postingWindow.cutoffDate * 1000))}.`
                : ""}
            </p>
          </div>
        ) : null}

        {postingWindow.isPastDueButOpen ? (
          <div className="rounded-lg border border-[var(--color-foreground)]/10 bg-[var(--color-foreground)]/[0.03] px-4 py-3 text-sm text-[var(--color-muted)]">
            <p className="font-medium">La fecha de entrega ya ha pasado.</p>
            <p className="mt-0.5">
              Aun puedes responder en esta discusión
              {postingWindow.cutoffDate
                ? ` hasta la fecha límite: ${new Intl.DateTimeFormat("es-ES", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(postingWindow.cutoffDate * 1000))}.`
                : "."}
            </p>
          </div>
        ) : null}

        {forum &&
        discussion &&
        posts[0] &&
        effectiveCourseAccess &&
        (effectiveCourseAccess.roleBucket === "editing_teacher" ||
          effectiveCourseAccess.roleBucket === "course_manager") ? (
          <ForumModerationForm
            courseId={forum.courseId}
            forumId={forum.id}
            discussionId={discussion.id}
            postId={posts[0].id}
            returnPath={returnPath}
            isPinned={discussion.pinned}
            isLocked={discussion.locked}
          />
        ) : null}

        <section className="flex flex-col gap-3">
          {posts.length > 0 ? (
            posts.map((post) => (
              <Card key={post.id} className="rounded-xl">
                <CardContent className="px-5 py-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9">
                        {post.authorPictureUrl ? (
                          <AvatarImage
                            src={getMoodleMediaProxyUrl(post.authorPictureUrl)}
                            alt={post.authorName || "Usuario"}
                          />
                        ) : null}
                        <AvatarFallback className="text-xs">{getInitials(post.authorName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--color-foreground)]">
                          {post.authorName || "Usuario"}
                        </p>
                        <h2 className="mt-0.5 text-base font-semibold text-[var(--color-foreground)]">
                          {post.subject}
                        </h2>
                      </div>
                    </div>

                    {post.message ? (
                      <>
                        <Separator />
                        <RichHtml
                          html={post.message}
                          className="text-sm leading-relaxed text-[var(--color-muted)]"
                        />
                      </>
                    ) : null}

                    {!postingWindow.cutoffDateReached &&
                    canParticipateAsStudent &&
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

                    {!postingWindow.cutoffDateReached &&
                    !canParticipateAsStudent &&
                    ((discussion?.canReply && post.canReply) ||
                      (postingWindow.isPastDueButOpen && !discussion?.locked)) ? (
                      <>
                        <Separator />
                        <p className="text-sm leading-7 text-[var(--color-muted)]">
                          La respuesta directa se oculta porque esta vista está
                          priorizando seguimiento y revisión según tu rol
                          actual.
                        </p>
                      </>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : !errorMessage ? (
            <p className="py-12 text-center text-sm text-[var(--color-muted)]">
              Esta discusión está vacía.
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
