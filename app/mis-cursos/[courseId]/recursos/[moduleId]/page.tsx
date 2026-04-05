import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { RichHtml } from "@/app/components/rich-html";
import { Button, LinkButton } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { logger } from "@/lib/logger";
import { getMoodleMediaProxyUrl } from "@/lib/moodle-media";
import {
  getCourseContents,
  getPagesByCourses,
  getUserCourses,
  isAuthenticationError,
  resolveUserAccessProfile,
  type MoodleCourseAccessProfile,
  type MoodleCourseModule,
  type MoodleModuleContent,
  type MoodlePage,
  viewResource,
} from "@/lib/moodle";
import { getCourseRoleLabel, getCourseRoleTone } from "@/lib/course-roles";
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
      <Card className="rounded-xl">
        <CardContent className="px-6 py-8 text-center">
          <p className="text-sm text-[var(--color-muted)]">
            Vista previa no disponible.
          </p>
          {resourceModule.url ? (
            <LinkButton as="a" href={resourceModule.url} target="_blank" rel="noreferrer" className="mt-4">Abrir recurso</LinkButton>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  if (resourceKind === "image") {
    return (
      <div className="overflow-hidden rounded-xl border border-[var(--color-muted)]/10 p-3 md:p-4">
        <Image
          src={proxiedUrl}
          alt={resourceModule.name}
          width={1600}
          height={1200}
          className="max-h-[78vh] w-full rounded-lg object-contain"
        />
      </div>
    );
  }

  if (resourceKind === "video") {
    return (
      <div className="overflow-hidden rounded-xl border border-[var(--color-muted)]/10 p-2">
        <video
          controls
          preload="metadata"
          src={proxiedUrl}
          className="min-h-[22rem] w-full rounded-lg bg-black"
        />
      </div>
    );
  }

  if (resourceKind === "audio") {
    return (
      <Card className="rounded-xl">
        <CardContent className="flex min-h-[18rem] items-center justify-center px-6 py-8">
          <audio controls preload="metadata" src={proxiedUrl} className="w-full max-w-2xl" />
        </CardContent>
      </Card>
    );
  }

  if (resourceKind === "document") {
    return (
      <div className="overflow-hidden rounded-xl border border-[var(--color-muted)]/10 p-2">
        <iframe
          src={proxiedUrl}
          title={resourceModule.name}
          className="min-h-[78vh] w-full rounded-lg border-0 bg-white"
        />
      </div>
    );
  }

  return (
    <Card className="rounded-xl">
      <CardContent className="px-6 py-8 text-center">
        <p className="text-sm text-[var(--color-muted)]">
          Formato no soportado para vista previa.
        </p>
        <LinkButton as="a" href={proxiedUrl} target="_blank" rel="noreferrer" className="mt-4">Abrir archivo</LinkButton>
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
  let pageData: MoodlePage | undefined;
  let courseAccess: MoodleCourseAccessProfile | null = null;

  try {
    const [coursesResult, sectionsResult, accessProfile] = await Promise.all([
      getUserCourses(session.token, session.userId),
      getCourseContents(session.token, parsedCourseId),
      resolveUserAccessProfile(session.token, session.userId).catch(() => null),
    ]);

    courses = coursesResult;
    sections = sectionsResult;
    courseAccess =
      accessProfile?.courseCapabilities.find(
        (course) => course.courseId === parsedCourseId
      ) || null;

    resourceMatch = findResourceModule(sections, parsedModuleId);

    if (resourceMatch?.module?.modname === "resource" && resourceMatch.module.instance) {
      await viewResource(session.token, resourceMatch.module.instance);
    }

    if (resourceMatch?.module?.modname === "page" && resourceMatch.module.instance) {
      const pages = await getPagesByCourses(session.token, [parsedCourseId]).catch(() => []);
      pageData = pages.find((p) => p.id === resourceMatch!.module.instance);
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

  const SUPPORTED_MODNAMES = ["resource", "folder", "page"];
  const course = courses.find((item) => item.id === parsedCourseId);
  const resourceModule = resourceMatch?.module;
  const isFolder = resourceModule?.modname === "folder";
  const isPage = resourceModule?.modname === "page";
  const content = !isFolder && !isPage ? pickPrimaryContent(resourceModule) : undefined;
  const proxiedUrl = content ? getMoodleMediaProxyUrl(content.fileurl) : undefined;
  const resourceKind = getResourceKind(content);
  const mimeLabel = getMimeLabel(content);
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

  if (
    (!course || !resourceModule || !SUPPORTED_MODNAMES.includes(resourceModule.modname)) &&
    !errorMessage
  ) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          breadcrumbs={[
            { label: "Mis cursos", href: "/mis-cursos" },
            { label: course?.fullname ?? "Curso", href: `/mis-cursos/${parsedCourseId}` },
            { label: resourceModule?.name ?? "Recurso" },
          ]}
      />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-5 py-6 md:px-8 md:py-8">

        <div className="flex flex-col gap-1">
          {course ? (
            <p className="text-sm text-[var(--color-muted)]">
              {course.fullname}
            </p>
          ) : null}
          <div className={`mb-2 inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getCourseRoleTone(effectiveCourseAccess.roleBucket)}`}>
            {getCourseRoleLabel(effectiveCourseAccess.roleBucket)}
          </div>
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            {resourceModule?.name || "Recurso"}
          </h1>
          {resourceModule?.description ? (
            <RichHtml
              html={resourceModule.description}
              className="mt-2 max-w-3xl text-sm leading-7 text-[var(--color-muted)]"
            />
          ) : null}
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
            {effectiveCourseAccess.roleBucket === "student"
              ? "Esta vista está orientada a consultar o descargar el recurso."
              : "Esta vista refleja tu rol real en el curso mientras revisas los recursos disponibles."}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          {isFolder ? (
            <p className="text-[var(--color-muted)]">
              Archivos: <span className="font-medium text-[var(--color-foreground)]">{resourceModule?.contents.filter((c) => c.filename && c.filename !== ".").length ?? 0}</span>
            </p>
          ) : isPage ? (
            <p className="text-[var(--color-muted)]">
              Tipo: <span className="font-medium text-[var(--color-foreground)]">Página</span>
            </p>
          ) : mimeLabel ? (
            <p className="text-[var(--color-muted)]">
              Formato: <span className="font-medium text-[var(--color-foreground)]">{mimeLabel}</span>
            </p>
          ) : null}
          {resourceMatch?.section ? (
            <p className="text-[var(--color-muted)]">
              Sección: <span className="font-medium text-[var(--color-foreground)]">{resourceMatch.section.name}</span>
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

        {resourceModule && isPage && pageData?.content ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <p className="mb-3 text-xs font-medium text-[var(--color-muted)]">Contenido</p>
              <Separator className="mb-4" />
              <RichHtml
                html={pageData.content}
                className="text-sm leading-7 text-[var(--color-muted)]"
              />
            </CardContent>
          </Card>
        ) : null}

        {resourceModule && isFolder ? (
          <Card className="rounded-xl">
            <CardContent className="px-5 py-5 md:px-6">
              <p className="mb-3 text-xs font-medium text-[var(--color-muted)]">
                Archivos ({resourceModule.contents.filter((c) => c.filename && c.filename !== ".").length})
              </p>
              <Separator className="mb-4" />
              <div className="flex flex-col gap-2">
                {resourceModule.contents
                  .filter((c) => c.fileurl && c.filename && c.filename !== ".")
                  .map((file, index) => {
                    const fileUrl = getMoodleMediaProxyUrl(file.fileurl);
                    const fileMime = inferMimeType(file);

                    return (
                      <div
                        key={`${file.filename}-${index}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-muted)]/10 px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-[var(--color-foreground)]">
                            {file.filename}
                          </p>
                          {fileMime ? (
                            <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                              {fileMime}
                            </p>
                          ) : null}
                        </div>
                        {fileUrl ? (
                          <LinkButton as="a" href={fileUrl} download={file.filename} size="sm" variant="outline">Descargar</LinkButton>
                        ) : null}
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {resourceModule && !isFolder && !isPage ? (
          <>
            <Card className="rounded-xl">
              <CardContent className="grid gap-5 px-6 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <div className="min-w-0">
                  {content?.filename && content.filename !== resourceModule.name ? (
                    <p className="truncate text-sm text-[var(--color-muted)]">
                      {content.filename}
                    </p>
                  ) : null}
                </div>

                {proxiedUrl ? (
                  <div className="flex flex-wrap gap-3 md:justify-end">
                    <LinkButton as="a" href={proxiedUrl} target="_blank" rel="noreferrer" variant="outline" size="sm">Abrir aparte</LinkButton>
                    <LinkButton as="a" href={proxiedUrl} download={content?.filename || resourceModule.name} size="sm">Descargar</LinkButton>
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
      </main>
    </div>
  );
}
