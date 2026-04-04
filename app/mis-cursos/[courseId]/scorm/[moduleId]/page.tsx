import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { RichHtml } from "@/app/components/rich-html";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
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
  type MoodleCourseModule,
  type MoodleModuleContent,
  viewScorm,
} from "@/lib/moodle";
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
    return "SCORM";
  }

  return filename.endsWith(".htm") || filename.endsWith(".html")
    ? "SCORM HTML"
    : "SCORM";
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

  try {
    [courses, sections] = await Promise.all([
      getUserCourses(session.token, session.userId),
      getCourseContents(session.token, parsedCourseId),
    ]);

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
    errorMessage = "No se pudo cargar el paquete SCORM.";
  }

  const course = courses.find((item) => item.id === parsedCourseId);
  const scormModule = scormMatch?.module;
  const launchContent = pickScormLaunchContent(scormModule);
  let launchUrl = undefined as string | undefined;
  let launchFormat = getScormFormat(launchContent);

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
    <main className="grain-overlay relative flex min-h-screen flex-1 overflow-x-hidden px-5 py-6 md:px-8 md:py-8">
      <div className="ambient-orb ambient-orb-white left-[-6rem] top-[-2rem] h-52 w-52 md:h-72 md:w-72" />
      <div className="ambient-orb ambient-orb-blue right-[-8rem] top-12 h-72 w-72 md:h-[28rem] md:w-[28rem]" />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          sectionLabel="SCORM"
          actions={
            <Button asChild variant="outline" size="sm">
              <Link href={`/mis-cursos/${parsedCourseId}`}>Volver al curso</Link>
            </Button>
          }
        />

        <Card className="hero-panel rounded-[2rem]">
          <CardContent className="relative z-10 px-6 py-8 md:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl">
                <p className="text-[0.72rem] font-semibold tracking-[0.28em] text-[var(--color-accent-soft)] uppercase">
                  {course?.fullname || "Curso"}
                </p>
                <h1 className="display-face mt-4 text-balance text-5xl leading-[0.94] text-[var(--color-foreground)] md:text-6xl">
                  {scormModule?.name || "SCORM"}
                </h1>
                {scormModule?.description ? (
                  <>
                    <Separator className="my-5 max-w-xl" />
                    <RichHtml
                      html={scormModule.description}
                      className="max-w-3xl text-sm leading-8 text-[var(--color-muted)]"
                    />
                  </>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[18rem] lg:grid-cols-1">
                <div className="metric-chip rounded-[1.2rem] px-4 py-4">
                  <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-[var(--color-accent-soft)] uppercase">
                    Formato
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--color-foreground)]">
                    {launchFormat}
                  </p>
                </div>
                {scormMatch?.section ? (
                  <div className="metric-chip rounded-[1.2rem] px-4 py-4">
                    <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-[var(--color-accent-soft)] uppercase">
                      Sección
                    </p>
                    <p className="mt-2 text-sm text-[var(--color-foreground)]">
                      {scormMatch.section.name}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        {errorMessage ? (
          <Card className="rounded-[1.5rem] border-[rgba(255,124,124,0.24)] bg-[rgba(255,124,124,0.08)]">
            <CardContent className="px-6 py-5 text-sm leading-7 text-[var(--color-danger)]">
              <p className="font-semibold">
                {expiredSession
                  ? "La sesión ya no es válida."
                  : "No se pudo cargar el SCORM."}
              </p>
              <p className="mt-1 opacity-80">{errorMessage}</p>
            </CardContent>
          </Card>
        ) : null}

        {scormModule ? (
          <>
            <Card className="rounded-[1.7rem]">
              <CardContent className="grid gap-5 px-6 py-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
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
              <div className="overflow-hidden rounded-[1.8rem] border border-white/8 bg-[rgba(7,12,22,0.88)] p-2">
                <iframe
                  src={launchUrl}
                  title={scormModule.name}
                  className="min-h-[80vh] w-full rounded-[1.35rem] border-0 bg-white"
                  allow="fullscreen"
                />
              </div>
            ) : (
              <Card className="hero-panel rounded-[1.8rem]">
                <CardContent className="px-8 py-10">
                  <p className="text-[0.72rem] font-semibold tracking-[0.24em] text-[var(--color-accent-soft)] uppercase">
                    Lanzador no disponible
                  </p>
                  <h2 className="display-face mt-4 text-4xl leading-tight text-[var(--color-foreground)]">
                    Este SCORM no expone un archivo HTML de inicio a través de la API.
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-8 text-[var(--color-muted)]">
                    La reproducción embebida depende de que Moodle devuelva el archivo de lanzamiento
                    del paquete en la respuesta del módulo.
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
