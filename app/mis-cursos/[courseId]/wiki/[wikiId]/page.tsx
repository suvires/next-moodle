import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { RichHtml } from "@/app/components/rich-html";
import { Button, LinkButton } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { logger } from "@/lib/logger";
import {
  getWikisByCourses,
  getWikiSubwikiPages,
  getWikiPageContents,
  getUserCourses,
  isAuthenticationError,
  resolveUserAccessProfile,
  type MoodleCourseAccessProfile,
} from "@/lib/moodle";
import { getCourseRoleLabel, getCourseRoleTone } from "@/lib/course-roles";
import { getSession } from "@/lib/session";

type WikiPageProps = {
  params: Promise<{
    courseId: string;
    wikiId: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
};

export default async function WikiPage({
  params,
  searchParams,
}: WikiPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const [{ courseId, wikiId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const parsedCourseId = Number(courseId);
  const parsedWikiId = Number(wikiId);

  if (
    !Number.isInteger(parsedCourseId) ||
    parsedCourseId <= 0 ||
    !Number.isInteger(parsedWikiId) ||
    parsedWikiId <= 0
  ) {
    notFound();
  }

  const selectedPageId = resolvedSearchParams.page
    ? Number(resolvedSearchParams.page)
    : undefined;

  let courses = [] as Awaited<ReturnType<typeof getUserCourses>>;
  let wikis = [] as Awaited<ReturnType<typeof getWikisByCourses>>;
  let pages = [] as Awaited<ReturnType<typeof getWikiSubwikiPages>>;
  let pageContent: Awaited<ReturnType<typeof getWikiPageContents>> | null =
    null;
  let errorMessage: string | null = null;
  let expiredSession = false;
  let courseAccess: MoodleCourseAccessProfile | null = null;

  try {
    const [coursesResult, wikisResult, pagesResult, accessProfile] = await Promise.all([
      getUserCourses(session.token, session.userId),
      getWikisByCourses(session.token, [parsedCourseId]),
      getWikiSubwikiPages(session.token, parsedWikiId),
      resolveUserAccessProfile(session.token, session.userId).catch(() => null),
    ]);

    courses = coursesResult;
    wikis = wikisResult;
    pages = pagesResult;
    courseAccess =
      accessProfile?.courseCapabilities.find(
        (course) => course.courseId === parsedCourseId
      ) || null;

    if (selectedPageId && Number.isInteger(selectedPageId)) {
      pageContent = await getWikiPageContents(session.token, selectedPageId);
    }
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Wiki page load failed", {
      userId: session.userId,
      courseId: parsedCourseId,
      wikiId: parsedWikiId,
      error,
    });
    errorMessage = "No se pudo cargar la wiki.";
  }

  const course = courses.find((item) => item.id === parsedCourseId);

  if (!course && !errorMessage) {
    notFound();
  }

  const wiki = wikis.find((w) => w.id === parsedWikiId);

  if (!wiki && !errorMessage) {
    notFound();
  }

  const wikiBasePath = `/mis-cursos/${parsedCourseId}/wiki/${parsedWikiId}`;
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
    <div className="flex min-h-screen flex-col">
      <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          sectionLabel="Wiki"
          actions={
            <LinkButton href={selectedPageId ? wikiBasePath : `/mis-cursos/${parsedCourseId}`} variant="ghost" size="sm">Volver</LinkButton>
          }
      />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-5 py-6 md:px-8 md:py-8">

        <div>
          {course ? (
            <p className="mb-1 text-sm text-[var(--color-muted)]">
              {course.fullname}
            </p>
          ) : null}
          <div className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getCourseRoleTone(effectiveCourseAccess.roleBucket)}`}>
            {getCourseRoleLabel(effectiveCourseAccess.roleBucket)}
          </div>
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            {wiki?.name || "Wiki"}
          </h1>
          {!selectedPageId ? (
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {pages.length} {pages.length === 1 ? "pagina" : "paginas"}
            </p>
          ) : null}
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
            {effectiveCourseAccess.roleBucket === "student"
              ? "Esta vista está orientada a consultar las páginas de la wiki disponibles en la app."
              : "Esta vista refleja tu rol real en el curso mientras consultas el contenido de la wiki."}
          </p>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            {expiredSession
              ? "La sesion ya no es valida."
              : "No se pudo cargar la wiki."}
          </div>
        ) : null}

        {wiki?.intro && !selectedPageId ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Descripcion</h2>
              <Separator className="my-3" />
              <RichHtml
                html={wiki.intro}
                className="text-sm leading-7 text-[var(--color-muted)]"
              />
            </CardContent>
          </Card>
        ) : null}

        {selectedPageId && pageContent ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">
                {pageContent.title || "Pagina"}
              </h2>
              <Separator className="my-3" />
              <RichHtml
                html={pageContent.content}
                className="text-sm leading-7 text-[var(--color-muted)]"
              />
            </CardContent>
          </Card>
        ) : null}

        {!selectedPageId && pages.length > 0 ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Paginas</h2>
              <Separator className="my-3" />
              <div className="flex flex-col gap-1">
                {pages.map((wikiPage) => (
                  <Link
                    key={wikiPage.id}
                    href={`${wikiBasePath}?page=${wikiPage.id}`}
                    className="flex items-center justify-between rounded-lg px-4 py-3 transition-colors hover:bg-[var(--color-foreground)]/[0.03]"
                  >
                    <p className="text-sm font-medium text-[var(--color-foreground)]">
                      {wikiPage.title}
                    </p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : !selectedPageId && !errorMessage ? (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            Esta wiki no tiene paginas todavia.
          </p>
        ) : null}
      </main>
    </div>
  );
}
