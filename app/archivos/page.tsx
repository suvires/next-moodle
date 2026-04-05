import { redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { logger } from "@/lib/logger";
import { getPrivateFiles, isAuthenticationError } from "@/lib/moodle";
import { getMoodleMediaProxyUrl } from "@/lib/moodle-media";
import { getSession } from "@/lib/session";
import Link from "next/link";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function ArchivosPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  let files: Awaited<ReturnType<typeof getPrivateFiles>> = [];
  let errorMessage: string | null = null;

  try {
    files = await getPrivateFiles(session.token);
  } catch (error) {
    if (isAuthenticationError(error)) {
      redirect("/");
    }

    logger.error("Private files load failed", {
      userId: session.userId,
      error,
    });
    errorMessage = "No se pudieron cargar los archivos privados.";
  }

  return (
    <main className="flex min-h-screen flex-1 px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          breadcrumbs={[{ label: "Archivos" }]}
        />

        <div className="animate-rise-in">
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            Archivos privados
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Tus archivos almacenados en la plataforma.
          </p>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            <p>{errorMessage}</p>
          </div>
        ) : null}

        {!errorMessage && files.length === 0 ? (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            No tienes archivos privados.
          </p>
        ) : null}

        {files.length > 0 ? (
          <Card className="animate-rise-in rounded-xl">
            <CardContent className="px-0 py-0">
              {files.map((file, index) => (
                <div key={`${file.filepath}${file.filename}`}>
                  {index > 0 ? <Separator /> : null}
                  <div className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--color-foreground)]">
                        {file.filename}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[var(--color-muted)]">
                        <span>{formatFileSize(file.filesize)}</span>
                        {file.mimetype ? <span>{file.mimetype}</span> : null}
                      </div>
                    </div>

                    {file.fileUrl ? (
                      <a
                        href={getMoodleMediaProxyUrl(file.fileUrl)}
                        download={file.filename}
                        className="shrink-0"
                      >
                        <Button variant="outline" size="sm">
                          Descargar
                        </Button>
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
