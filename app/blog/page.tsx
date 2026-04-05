import Link from "next/link";
import { redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { RichHtml } from "@/app/components/rich-html";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { logger } from "@/lib/logger";
import { getBlogEntries, isAuthenticationError } from "@/lib/moodle";
import { getSession } from "@/lib/session";

function formatDate(value?: number) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value * 1000));
}

export default async function BlogPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  let entries = [] as Awaited<ReturnType<typeof getBlogEntries>>;
  let errorMessage: string | null = null;
  let expiredSession = false;

  try {
    entries = await getBlogEntries(session.token);
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Blog entries load failed", {
      userId: session.userId,
      error,
    });
    errorMessage = "No se pudieron cargar las entradas del blog.";
  }

  return (
    <main className="flex min-h-screen flex-1 px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          breadcrumbs={[{ label: "Blog" }]}
        />

        <div className="animate-rise-in">
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            Blog
          </h1>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            <p className="font-semibold">
              {expiredSession
                ? "La sesión ya no es válida."
                : "No se pudieron cargar las entradas."}
            </p>
            <p className="mt-1 opacity-80">{errorMessage}</p>
          </div>
        ) : null}

        {entries.length > 0 ? (
          <section className="flex flex-col gap-4">
            {entries.map((entry, index) => (
              <Card
                key={entry.id}
                className="animate-rise-in rounded-xl"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <CardContent className="px-5 py-5">
                  <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
                    {entry.subject}
                  </h2>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted)]">
                    {entry.authorName ? (
                      <span>{entry.authorName}</span>
                    ) : null}
                    {entry.created ? (
                      <span>{formatDate(entry.created)}</span>
                    ) : null}
                  </div>

                  {entry.summary ? (
                    <>
                      <Separator className="my-3" />
                      <RichHtml
                        html={entry.summary}
                        className="text-sm leading-relaxed text-[var(--color-muted)]"
                      />
                    </>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </section>
        ) : !errorMessage ? (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            No hay entradas de blog disponibles.
          </p>
        ) : null}
      </div>
    </main>
  );
}
