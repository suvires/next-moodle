import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { RichHtml } from "@/app/components/rich-html";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { logger } from "@/lib/logger";
import { getMoodleMediaProxyUrl } from "@/lib/moodle-media";
import {
  getCourseContents,
  getUserCourses,
  isAuthenticationError,
  type MoodleCourseModule,
  type MoodleModuleContent,
  viewResource,
} from "@/lib/moodle";
import { getSession } from "@/lib/session";

type ResourcePageProps = {
  params: Promise<{
    courseId: string;
    moduleId: string;
  }>;
};

type ResourceKind = "image" | "video" | "audio" | "document" | "unsupported";

function inferMimeType(content?: MoodleModuleContent) {
  const mimeType = content?.mimetype?.trim().toLowerCase();

  if (mimeType) {
    return mimeType;
  }

  const filename = content?.filename?.toLowerCase();
  const extension = filename?.split(".").pop();

  if (!extension) {
    return undefined;
  }

  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif"].includes(extension)) {
    return `image/${extension === "jpg" ? "jpeg" : extension}`;
  }

  if (["mp4", "webm", "ogg", "mov"].includes(extension)) {
    return `video/${extension}`;
  }

  if (["mp3", "wav", "m4a", "aac", "oga"].includes(extension)) {
    return `audio/${extension}`;
  }

  if (extension === "pdf") {
    return "application/pdf";
  }

  if (["txt", "md", "html", "htm", "json", "xml"].includes(extension)) {
    return extension === "json"
      ? "application/json"
      : extension === "xml"
        ? "application/xml"
        : extension === "md" || extension === "txt"
          ? "text/plain"
          : "text/html";
  }

  return undefined;
}

function getResourceKind(content?: MoodleModuleContent): ResourceKind {
  const mimeType = inferMimeType(content);

  if (!mimeType) {
    return "unsupported";
  }

  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  if (mimeType.startsWith("audio/")) {
    return "audio";
  }

  if (
    mimeType === "application/pdf" ||
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === "application/xml" ||
    mimeType === "application/xhtml+xml"
  ) {
    return "document";
  }

  return "unsupported";
}

function pickPrimaryContent(module?: MoodleCourseModule) {
  if (!module) {
    return undefined;
  }

  const candidates = module.contents.filter(
    (content) => content.fileurl && content.filename !== "."
  );

  return (
    candidates.find((content) => {
      const kind = getResourceKind(content);
      return kind === "image" || kind === "video" || kind === "audio" || kind === "document";
    }) ||
    candidates.find((content) => Boolean(content.filename)) ||
    module.contents.find((content) => content.fileurl)
  );
}

function findResourceModule(
  sections: Awaited<ReturnType<typeof getCourseContents>>,
  moduleId: number
) {
  for (const section of sections) {
    const resourceModule = section.modules.find((item) => item.id === moduleId);

    if (resourceModule) {
      return {
        section,
        module: resourceModule,
      };
    }
  }

  return null;
}

function getMimeLabel(content?: MoodleModuleContent) {
  const mimeType = inferMimeType(content);

  if (!mimeType) {
    return null;
  }

  if (mimeType === "application/pdf") {
    return "PDF";
  }

  if (mimeType.startsWith("image/")) {
    return "Imagen";
  }

  if (mimeType.startsWith("video/")) {
    return "Vídeo";
  }

  if (mimeType.startsWith("audio/")) {
    return "Audio";
  }

  if (mimeType.startsWith("text/")) {
    return "Texto";
  }

  return mimeType;
}

function ResourcePreview({
  resourceModule,
  proxiedUrl,
  resourceKind,
}: {
  resourceModule: MoodleCourseModule;
  proxiedUrl?: string;
  resourceKind: ResourceKind;
}) {
  if (!proxiedUrl) {
    return (
      <Card className="hero-panel rounded-[1.8rem]">
        <CardContent className="px-8 py-10 text-center">
          <p className="text-[0.72rem] font-semibold tracking-[0.24em] text-[var(--color-accent-soft)] uppercase">
            Vista previa no disponible
          </p>
          <h2 className="display-face mt-4 text-4xl leading-tight text-[var(--color-foreground)]">
            Este recurso no incluye un archivo embebible.
          </h2>
          {resourceModule.url ? (
            <Button asChild className="mt-6">
              <a href={resourceModule.url} target="_blank" rel="noreferrer">
                Abrir recurso
              </a>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  if (resourceKind === "image") {
    return (
      <div className="overflow-hidden rounded-[1.8rem] border border-white/8 bg-[rgba(7,12,22,0.88)] p-3 md:p-4">
        <Image
          src={proxiedUrl}
          alt={resourceModule.name}
          width={1600}
          height={1200}
          className="max-h-[78vh] w-full rounded-[1.35rem] object-contain"
        />
      </div>
    );
  }

  if (resourceKind === "video") {
    return (
      <div className="overflow-hidden rounded-[1.8rem] border border-white/8 bg-[rgba(7,12,22,0.95)] p-2">
        <video
          controls
          preload="metadata"
          src={proxiedUrl}
          className="min-h-[22rem] w-full rounded-[1.35rem] bg-black"
        />
      </div>
    );
  }

  if (resourceKind === "audio") {
    return (
      <Card className="rounded-[1.8rem]">
        <CardContent className="flex min-h-[18rem] items-center justify-center px-6 py-8">
          <audio controls preload="metadata" src={proxiedUrl} className="w-full max-w-2xl" />
        </CardContent>
      </Card>
    );
  }

  if (resourceKind === "document") {
    return (
      <div className="overflow-hidden rounded-[1.8rem] border border-white/8 bg-[rgba(7,12,22,0.88)] p-2">
        <iframe
          src={proxiedUrl}
          title={resourceModule.name}
          className="min-h-[78vh] w-full rounded-[1.35rem] border-0 bg-white"
        />
      </div>
    );
  }

  return (
    <Card className="hero-panel rounded-[1.8rem]">
      <CardContent className="px-8 py-10 text-center">
        <p className="text-[0.72rem] font-semibold tracking-[0.24em] text-[var(--color-accent-soft)] uppercase">
          Vista previa no disponible
        </p>
        <h2 className="display-face mt-4 text-4xl leading-tight text-[var(--color-foreground)]">
          Este formato no se puede incrustar en la app.
        </h2>
        <Button asChild className="mt-6">
          <a href={proxiedUrl} target="_blank" rel="noreferrer">
            Abrir archivo
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

export default async function ResourcePage({ params }: ResourcePageProps) {
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
  let resourceMatch: ReturnType<typeof findResourceModule> = null;

  try {
    [courses, sections] = await Promise.all([
      getUserCourses(session.token, session.userId),
      getCourseContents(session.token, parsedCourseId),
    ]);

    resourceMatch = findResourceModule(sections, parsedModuleId);

    if (resourceMatch?.module?.modname === "resource" && resourceMatch.module.instance) {
      await viewResource(session.token, resourceMatch.module.instance);
    }
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Resource page load failed", {
      userId: session.userId,
      courseId: parsedCourseId,
      moduleId: parsedModuleId,
      error,
    });
    errorMessage = "No se pudo cargar el recurso.";
  }

  const course = courses.find((item) => item.id === parsedCourseId);
  const resourceModule = resourceMatch?.module;
  const content = pickPrimaryContent(resourceModule);
  const proxiedUrl = getMoodleMediaProxyUrl(content?.fileurl);
  const resourceKind = getResourceKind(content);
  const mimeLabel = getMimeLabel(content);

  if (
    (!course || !resourceModule || resourceModule.modname !== "resource") &&
    !errorMessage
  ) {
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
          sectionLabel="Recurso"
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
                {course ? (
                  <p className="text-[0.72rem] font-semibold tracking-[0.28em] text-[var(--color-accent-soft)] uppercase">
                    {course.fullname}
                  </p>
                ) : null}
                <h1 className="display-face mt-4 text-balance text-5xl leading-[0.94] text-[var(--color-foreground)] md:text-6xl">
                  {resourceModule?.name || "Recurso"}
                </h1>
                {resourceModule?.description ? (
                  <>
                    <Separator className="my-5 max-w-xl" />
                    <RichHtml
                      html={resourceModule.description}
                      className="max-w-3xl text-sm leading-8 text-[var(--color-muted)]"
                    />
                  </>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[18rem] lg:grid-cols-1">
                {mimeLabel ? (
                  <div className="metric-chip rounded-[1.2rem] px-4 py-4">
                    <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-[var(--color-accent-soft)] uppercase">
                      Formato
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[var(--color-foreground)]">
                      {mimeLabel}
                    </p>
                  </div>
                ) : null}
                {resourceMatch?.section ? (
                  <div className="metric-chip rounded-[1.2rem] px-4 py-4">
                    <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-[var(--color-accent-soft)] uppercase">
                      Sección
                    </p>
                    <p className="mt-2 text-sm text-[var(--color-foreground)]">
                      {resourceMatch.section.name}
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
                  : "No se pudo cargar el recurso."}
              </p>
              <p className="mt-1 opacity-80">{errorMessage}</p>
            </CardContent>
          </Card>
        ) : null}

        {resourceModule ? (
          <>
            <Card className="rounded-[1.7rem]">
              <CardContent className="grid gap-5 px-6 py-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <div className="min-w-0">
                  {content?.filename && content.filename !== resourceModule.name ? (
                    <p className="truncate text-sm text-[var(--color-muted)]">
                      {content.filename}
                    </p>
                  ) : null}
                </div>

                {proxiedUrl ? (
                  <div className="flex flex-wrap gap-3 md:justify-end">
                    <Button asChild variant="outline" size="sm">
                      <a href={proxiedUrl} target="_blank" rel="noreferrer">
                        Abrir aparte
                      </a>
                    </Button>
                    <Button asChild size="sm">
                      <a
                        href={proxiedUrl}
                        download={content?.filename || resourceModule.name}
                      >
                        Descargar
                      </a>
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <ResourcePreview
              resourceModule={resourceModule}
              proxiedUrl={proxiedUrl}
              resourceKind={resourceKind}
            />
          </>
        ) : null}
      </div>
    </main>
  );
}
