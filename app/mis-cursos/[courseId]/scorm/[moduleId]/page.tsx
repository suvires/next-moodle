import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { RichHtml } from "@/app/components/rich-html";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { logger } from "@/lib/logger";
import {
  getScormExtractedLaunchUrl,
  prepareScormPackage,
} from "@/lib/scorm-package";
import { buildScormRuntimeInitialData } from "@/lib/scorm-runtime";
import {
  getScormAttemptCount,
  getCourseContents,
  getScormsByCourses,
  getScormScoes,
  getScormUserData,
  getUserCourses,
  isAuthenticationError,
  launchScormSco,
  resolveUserAccessProfile,
  type MoodleCourseModule,
  type MoodleCourseAccessProfile,
  type MoodleModuleContent,
  viewScorm,
} from "@/lib/moodle";
import { getCourseRoleLabel, getCourseRoleTone } from "@/lib/course-roles";
import { getSession } from "@/lib/session";

type ScormPageProps = {
  params: Promise<{
    courseId: string;
    moduleId: string;
  }>;
};

type ScormSummary = NonNullable<Awaited<ReturnType<typeof getScormsByCourses>>["scorms"]>[number];
type ScormSco = NonNullable<Awaited<ReturnType<typeof getScormScoes>>["scoes"]>[number];

function findScormModule(
  sections: Awaited<ReturnType<typeof getCourseContents>>,
  moduleId: number
) {
  for (const section of sections) {
    const scormModule = section.modules.find((item) => item.id === moduleId);

    if (scormModule) {
      return {
        section,
        module: scormModule,
      };
    }
  }

  return null;
}

function pickScormLaunchContent(module?: MoodleCourseModule) {
  if (!module) {
    return undefined;
  }

  const htmlCandidates = module.contents.filter((content) => {
    const filename = content.filename?.toLowerCase();
    return Boolean(
      content.fileurl &&
      filename &&
      filename !== "." &&
      (filename.endsWith(".html") || filename.endsWith(".htm"))
    );
  });

  return (
    htmlCandidates.find((content) => /index|launch|player|story/i.test(content.filename || "")) ||
    htmlCandidates[0]
  );
}

function getScormFormat(content?: MoodleModuleContent) {
  const filename = content?.filename?.toLowerCase();

  if (!filename) {
    return "Interactivo";
  }

  return filename.endsWith(".htm") || filename.endsWith(".html")
    ? "HTML"
    : "Interactivo";
}

export default async function ScormPage({ params }: ScormPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const { courseId, moduleId } = await params;
  const parsedCourseId = Number(courseId);
  const parsedModuleId = Number(moduleId);

  if (
    !Number.isInteger(parsedCourseId) ||
    parsedCourseId <= 0 ||
    !Number.isInteger(parsedModuleId) ||
    parsedModuleId <= 0
  ) {
    notFound();
  }

  let courses = [] as Awaited<ReturnType<typeof getUserCourses>>;
  let sections = [] as Awaited<ReturnType<typeof getCourseContents>>;
  let errorMessage: string | null = null;
  let expiredSession = false;
  let scormMatch: ReturnType<typeof findScormModule> = null;
  let scormSummary: ScormSummary | null = null;
  let firstLaunchableSco: ScormSco | undefined;
  let extractedLaunchUrl: string | undefined;
  let runtimeInitialData: Record<string, string> = {};
  let courseAccess: MoodleCourseAccessProfile | null = null;

  try {
    const [coursesResult, sectionsResult, accessProfile] = await Promise.all([
      getUserCourses(session.token, session.userId),
      getCourseContents(session.token, parsedCourseId),
      resolveUserAccessProfile(session.token, session.userId).catch(
        () => null
      ),
    ]);

    courses = coursesResult;
    sections = sectionsResult;
    courseAccess =
      accessProfile?.courseCapabilities.find(
        (item) => item.courseId === parsedCourseId
      ) || null;

    scormMatch = findScormModule(sections, parsedModuleId);

    if (scormMatch?.module?.modname === "scorm" && scormMatch.module.instance) {
      await viewScorm(session.token, scormMatch.module.instance);
    }
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Scorm page load failed", {
      userId: session.userId,
      courseId: parsedCourseId,
      moduleId: parsedModuleId,
      error,
    });
    errorMessage = "No se pudo cargar el contenido.";
  }

  const course = courses.find((item) => item.id === parsedCourseId);
  const scormModule = scormMatch?.module;
  const launchContent = pickScormLaunchContent(scormModule);
  let launchUrl = undefined as string | undefined;
  let launchFormat = getScormFormat(launchContent);
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

  if (scormModule?.instance && !errorMessage) {
    const scormId = scormModule.instance;

    const [scormsByCoursesResult, scoesResult] = await Promise.all([
      getScormsByCourses(session.token, [parsedCourseId])
        .then((value) => ({ ok: true as const, value }))
        .catch(() => ({ ok: false as const })),
      getScormScoes(session.token, scormId)
        .then((value) => ({ ok: true as const, value }))
        .catch(() => ({ ok: false as const })),
    ]);

    scormSummary = scormsByCoursesResult.ok
      ? (scormsByCoursesResult.value.scorms || []).find((item) => item.id === scormId) || null
      : null;

    firstLaunchableSco = scoesResult.ok
      ? (scoesResult.value.scoes || []).find(
          (sco) => typeof sco.id === "number" && Boolean(sco.launch)
        )
      : undefined;

    if (firstLaunchableSco?.id) {
      await launchScormSco(session.token, scormId, firstLaunchableSco.id).catch((error) => {
        logger.warn("SCORM launch registration for first SCO failed", {
          userId: session.userId,
          courseId: parsedCourseId,
          moduleId: parsedModuleId,
          scormId,
          scoId: firstLaunchableSco?.id,
          error,
        });
      });
    } else {
      await launchScormSco(session.token, scormId, 0).catch((error) => {
        logger.warn("SCORM generic launch registration failed", {
          userId: session.userId,
          courseId: parsedCourseId,
          moduleId: parsedModuleId,
          scormId,
          error,
        });
      });
    }

    const attemptCountForRuntime = await getScormAttemptCount(
      session.token,
      scormId,
      session.userId
    )
      .then((value) => value)
      .catch(() => null);
    const attemptNumberForRuntime =
      typeof attemptCountForRuntime?.attemptscount === "number"
        ? Math.max(1, attemptCountForRuntime.attemptscount)
        : 1;
    const userDataForRuntime = await getScormUserData(
      session.token,
      scormId,
      attemptNumberForRuntime
    )
      .then((value) => value)
      .catch(() => null);

    if (firstLaunchableSco?.id && userDataForRuntime?.data) {
      const scoUserData =
        userDataForRuntime.data.find((item) => item.scoid === firstLaunchableSco?.id) || null;
      runtimeInitialData = buildScormRuntimeInitialData(scoUserData);
    }

    if (
      scormSummary?.packageurl &&
      firstLaunchableSco?.launch &&
      typeof firstLaunchableSco.id === "number"
    ) {
      try {
        const cacheKey = await prepareScormPackage({
          token: session.token,
          scormId,
          packageUrl: scormSummary.packageurl,
          packageHash:
            typeof scormSummary.sha1hash === "string" ? scormSummary.sha1hash : undefined,
          revision:
            typeof scormSummary.revision === "number" ? scormSummary.revision : undefined,
          launchPath: firstLaunchableSco.launch,
        });

        extractedLaunchUrl = getScormExtractedLaunchUrl(cacheKey, firstLaunchableSco.launch, {
          scormId,
          scoId: firstLaunchableSco.id,
          attempt: attemptNumberForRuntime,
          commitUrl: "/api/scorm-track",
          initialData: runtimeInitialData,
        });
        launchUrl = extractedLaunchUrl;
        launchFormat = getScormFormat({
          filename: firstLaunchableSco.launch,
        });
      } catch (error) {
        logger.error("SCORM package preparation failed", {
          userId: session.userId,
          courseId: parsedCourseId,
          moduleId: parsedModuleId,
          scormId,
          packageUrl: scormSummary.packageurl,
          launch: firstLaunchableSco.launch,
          error,
        });
      }
    }
  }

  if ((!course || !scormModule || scormModule.modname !== "scorm") && !errorMessage) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-1 px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          sectionLabel="Contenido interactivo"
          actions={
            <Button asChild variant="outline" size="sm">
              <Link href={`/mis-cursos/${parsedCourseId}`}>Volver al curso</Link>
            </Button>
          }
        />

        <div className="flex flex-col gap-1">
          <p className="text-sm text-[var(--color-muted)]">
            {course?.fullname || "Curso"}
          </p>
          <div
            className={`mt-2 inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getCourseRoleTone(effectiveCourseAccess.roleBucket)}`}
          >
            {getCourseRoleLabel(effectiveCourseAccess.roleBucket)}
          </div>
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            {scormModule?.name || "Contenido interactivo"}
          </h1>
          {scormModule?.description ? (
            <RichHtml
              html={scormModule.description}
              className="mt-2 max-w-3xl text-sm leading-7 text-[var(--color-muted)]"
            />
          ) : null}
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
            {effectiveCourseAccess.roleBucket === "student"
              ? "Esta vista está orientada a lanzar el contenido SCORM y seguir tu flujo de aprendizaje."
              : "Esta vista mantiene el acceso operativo al contenido SCORM, pero ya refleja tu rol real dentro del curso."}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <p className="text-[var(--color-muted)]">
            Formato: <span className="font-medium text-[var(--color-foreground)]">{launchFormat}</span>
          </p>
          {scormMatch?.section ? (
            <p className="text-[var(--color-muted)]">
              Sección: <span className="font-medium text-[var(--color-foreground)]">{scormMatch.section.name}</span>
            </p>
          ) : null}
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            {expiredSession
              ? "La sesión ya no es válida."
              : errorMessage}
          </div>
        ) : null}

        {scormModule ? (
          <>
            <Card className="rounded-xl">
              <CardContent className="grid gap-5 px-6 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <div className="min-w-0">
                  {launchContent?.filename ? (
                    <p className="truncate text-sm text-[var(--color-muted)]">
                      {launchContent.filename}
                    </p>
                  ) : null}
                </div>

                {launchUrl ? (
                  <div className="flex flex-wrap gap-3 md:justify-end">
                    <Button asChild variant="outline" size="sm">
                      <a href={launchUrl} target="_blank" rel="noreferrer">
                        Abrir aparte
                      </a>
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {launchUrl ? (
              <div className="overflow-hidden rounded-xl border border-[var(--color-muted)]/10 p-2">
                <iframe
                  src={launchUrl}
                  title={scormModule.name}
                  className="min-h-[80vh] w-full rounded-lg border-0 bg-white"
                  allow="fullscreen"
                />
              </div>
            ) : (
              <Card className="rounded-xl">
                <CardContent className="px-6 py-8 text-center">
                  <p className="text-sm text-[var(--color-muted)]">
                    Este contenido no está disponible para visualización.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}
