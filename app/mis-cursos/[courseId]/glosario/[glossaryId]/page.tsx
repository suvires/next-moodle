import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { RichHtml } from "@/app/components/rich-html";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { logger } from "@/lib/logger";
import {
  getGlossariesByCourses,
  getGlossaryEntries,
  getUserCourses,
  isAuthenticationError,
  resolveUserAccessProfile,
  type MoodleCourseAccessProfile,
} from "@/lib/moodle";
import { getCourseRoleLabel, getCourseRoleTone } from "@/lib/course-roles";
import { getSession } from "@/lib/session";

type GlossaryPageProps = {
  params: Promise<{
    courseId: string;
    glossaryId: string;
  }>;
};

export default async function GlossaryPage({ params }: GlossaryPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const { courseId, glossaryId } = await params;
  const parsedCourseId = Number(courseId);
  const parsedGlossaryId = Number(glossaryId);

  if (
    !Number.isInteger(parsedCourseId) ||
    parsedCourseId <= 0 ||
    !Number.isInteger(parsedGlossaryId) ||
    parsedGlossaryId <= 0
  ) {
    notFound();
  }

  let courses = [] as Awaited<ReturnType<typeof getUserCourses>>;
  let glossaries = [] as Awaited<ReturnType<typeof getGlossariesByCourses>>;
  let entries = [] as Awaited<ReturnType<typeof getGlossaryEntries>>;
  let errorMessage: string | null = null;
  let expiredSession = false;
  let courseAccess: MoodleCourseAccessProfile | null = null;

  try {
    const [coursesResult, glossariesResult, entriesResult, accessProfile] =
      await Promise.all([
      getUserCourses(session.token, session.userId),
      getGlossariesByCourses(session.token, [parsedCourseId]),
      getGlossaryEntries(session.token, parsedGlossaryId),
      resolveUserAccessProfile(session.token, session.userId).catch(
        () => null
      ),
    ]);

    courses = coursesResult;
    glossaries = glossariesResult;
    entries = entriesResult;
    courseAccess =
      accessProfile?.courseCapabilities.find(
        (item) => item.courseId === parsedCourseId
      ) || null;
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Glossary page load failed", {
      userId: session.userId,
      courseId: parsedCourseId,
      glossaryId: parsedGlossaryId,
      error,
    });
    errorMessage = "No se pudo cargar el glosario.";
  }

  const course = courses.find((item) => item.id === parsedCourseId);

  if (!course && !errorMessage) {
    notFound();
  }

  const glossary = glossaries.find((g) => g.id === parsedGlossaryId);

  if (!glossary && !errorMessage) {
    notFound();
  }

  const sortedEntries = [...entries].sort((a, b) =>
    a.concept.localeCompare(b.concept, "es")
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
    <main className="flex min-h-screen flex-1 px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          sectionLabel="Glosario"
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link href={`/mis-cursos/${parsedCourseId}`}>Volver</Link>
            </Button>
          }
        />

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
            {glossary?.name || "Glosario"}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {sortedEntries.length}{" "}
            {sortedEntries.length === 1 ? "entrada" : "entradas"}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
            {effectiveCourseAccess.roleBucket === "student"
              ? "Esta vista está orientada a consultar términos y definiciones del glosario."
              : "Esta vista muestra el glosario con el mismo contenido base, pero ya contextualizado con tu rol real en el curso."}
          </p>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            {expiredSession
              ? "La sesion ya no es valida."
              : "No se pudo cargar el glosario."}
          </div>
        ) : null}

        {glossary?.intro ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Descripcion</h2>
              <Separator className="my-3" />
              <RichHtml
                html={glossary.intro}
                className="text-sm leading-7 text-[var(--color-muted)]"
              />
            </CardContent>
          </Card>
        ) : null}

        {sortedEntries.length > 0 ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <h2 className="text-lg font-semibold">Entradas</h2>
              <Separator className="my-3" />
              <div className="flex flex-col gap-4">
                {sortedEntries.map((entry) => (
                  <div key={entry.id} className="rounded-lg px-4 py-3">
                    <p className="text-sm font-bold text-[var(--color-foreground)]">
                      {entry.concept}
                    </p>
                    <RichHtml
                      html={entry.definition}
                      className="mt-2 text-sm leading-7 text-[var(--color-muted)]"
                    />
                    {entry.authorName ? (
                      <p className="mt-2 text-xs text-[var(--color-muted)]">
                        Por {entry.authorName}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : !errorMessage ? (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            Este glosario no tiene entradas todavia.
          </p>
        ) : null}
      </div>
    </main>
  );
}
