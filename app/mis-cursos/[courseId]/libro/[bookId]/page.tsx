import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { RichHtml } from "@/app/components/rich-html";
import { Button, LinkButton } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { logger } from "@/lib/logger";
import {
  getBooksByCourses,
  getCourseContents,
  getUserCourses,
  isAuthenticationError,
  resolveUserAccessProfile,
  type MoodleCourseAccessProfile,
} from "@/lib/moodle";
import { getMoodleMediaProxyUrl } from "@/lib/moodle-media";
import { getCourseRoleLabel, getCourseRoleTone } from "@/lib/course-roles";
import { getSession } from "@/lib/session";

type BookPageProps = {
  params: Promise<{
    courseId: string;
    bookId: string;
  }>;
};

function cleanChapterTitle(filename?: string) {
  if (!filename) return "Sin titulo";
  const withoutExtension = filename.replace(/\.[^/.]+$/, "");
  return withoutExtension.replace(/^\d+[._\-\s]+/, "");
}

export default async function BookPage({ params }: BookPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const { courseId, bookId } = await params;
  const parsedCourseId = Number(courseId);
  const parsedBookId = Number(bookId);

  if (
    !Number.isInteger(parsedCourseId) ||
    parsedCourseId <= 0 ||
    !Number.isInteger(parsedBookId) ||
    parsedBookId <= 0
  ) {
    notFound();
  }

  let courses = [] as Awaited<ReturnType<typeof getUserCourses>>;
  let sections = [] as Awaited<ReturnType<typeof getCourseContents>>;
  let books = [] as Awaited<ReturnType<typeof getBooksByCourses>>;
  let errorMessage: string | null = null;
  let expiredSession = false;
  let courseAccess: MoodleCourseAccessProfile | null = null;

  try {
    const [coursesResult, sectionsResult, booksResult, accessProfile] =
      await Promise.all([
      getUserCourses(session.token, session.userId),
      getCourseContents(session.token, parsedCourseId),
      getBooksByCourses(session.token, [parsedCourseId]),
      resolveUserAccessProfile(session.token, session.userId).catch(
        () => null
      ),
    ]);

    courses = coursesResult;
    sections = sectionsResult;
    books = booksResult;
    courseAccess =
      accessProfile?.courseCapabilities.find(
        (item) => item.courseId === parsedCourseId
      ) || null;
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Book page load failed", {
      userId: session.userId,
      courseId: parsedCourseId,
      bookId: parsedBookId,
      error,
    });
    errorMessage = "No se pudo cargar el libro.";
  }

  const course = courses.find((item) => item.id === parsedCourseId);

  if (!course && !errorMessage) {
    notFound();
  }

  const bookModule = sections
    .flatMap((section) => section.modules)
    .find(
      (module) => module.modname === "book" && module.instance === parsedBookId
    );

  if (!bookModule && !errorMessage) {
    notFound();
  }

  const book = books.find((b) => b.id === parsedBookId);
  const chapters = (bookModule?.contents || []).filter(
    (c) => c.fileurl && c.filename && c.filename !== "."
  );
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
          sectionLabel="Libro"
          actions={
            <LinkButton href={`/mis-cursos/${parsedCourseId}`} variant="ghost" size="sm">Volver</LinkButton>
          }
      />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-5 py-6 md:px-8 md:py-8">

        <div>
          {course ? (
            <p className="mb-1 text-sm text-[var(--color-muted)]">
              {course.fullname}
            </p>
          ) : null}
          <div
            className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getCourseRoleTone(effectiveCourseAccess.roleBucket)}`}
          >
            {getCourseRoleLabel(effectiveCourseAccess.roleBucket)}
          </div>
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            {bookModule?.name || "Libro"}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {chapters.length} {chapters.length === 1 ? "capitulo" : "capitulos"}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
            {effectiveCourseAccess.roleBucket === "student"
              ? "Esta vista está orientada a recorrer y abrir los capítulos disponibles del libro."
              : "Esta vista mantiene la consulta de capítulos del libro, pero ya refleja tu rol real dentro del curso."}
          </p>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            {expiredSession
              ? "La sesion ya no es valida."
              : "No se pudo cargar el libro."}
          </div>
        ) : null}

        {book?.intro ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Introduccion</h2>
              <Separator className="my-3" />
              <RichHtml
                html={book.intro}
                className="text-sm leading-7 text-[var(--color-muted)]"
              />
            </CardContent>
          </Card>
        ) : null}

        {chapters.length > 0 ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Capitulos</h2>
              <Separator className="my-3" />
              <div className="flex flex-col gap-1">
                {chapters.map((chapter, index) => {
                  const proxiedUrl = chapter.fileurl
                    ? getMoodleMediaProxyUrl(chapter.fileurl)
                    : undefined;

                  return (
                    <div
                      key={`${chapter.filename}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-lg px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--color-foreground)]">
                          {cleanChapterTitle(chapter.filename)}
                        </p>
                      </div>
                      {proxiedUrl ? (
                        <LinkButton as="a" href={proxiedUrl} target="_blank" rel="noreferrer" size="sm" variant="outline">Abrir</LinkButton>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : !errorMessage ? (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            Este libro no tiene capitulos disponibles.
          </p>
        ) : null}
      </main>
    </div>
  );
}
