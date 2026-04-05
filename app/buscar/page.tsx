import Link from "next/link";
import { redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { RichHtml } from "@/app/components/rich-html";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { logger } from "@/lib/logger";
import { searchGlobal, isAuthenticationError } from "@/lib/moodle";
import { getSession } from "@/lib/session";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  let results: Awaited<ReturnType<typeof searchGlobal>> = [];
  let errorMessage: string | null = null;
  let expiredSession = false;

  if (query) {
    try {
      results = await searchGlobal(session.token, query);
    } catch (error) {
      expiredSession = isAuthenticationError(error);
      logger.error("Global search failed", { userId: session.userId, query, error });
      errorMessage = "No se pudieron obtener los resultados de búsqueda.";
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          breadcrumbs={[{ label: "Buscar" }]}
      />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-5 py-6 md:px-8 md:py-8">

        <div className="animate-rise-in">
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            Buscar
          </h1>
        </div>

        <form action="/buscar" method="get" className="flex gap-3">
          <Input
            type="search"
            name="q"
            placeholder="Buscar contenido..."
            defaultValue={query}
          />
          <Button type="submit">Buscar</Button>
        </form>

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            <p className="font-semibold">
              {expiredSession
                ? "La sesión ya no es válida."
                : "Error en la búsqueda."}
            </p>
            <p className="mt-1 opacity-80">{errorMessage}</p>
            {expiredSession ? (
              <p className="mt-1 opacity-80">Vuelve a iniciar sesión.</p>
            ) : null}
          </div>
        ) : null}

        {!query ? (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            Escribe un término para buscar.
          </p>
        ) : results.length === 0 && !errorMessage ? (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            No se encontraron resultados para &ldquo;{query}&rdquo;.
          </p>
        ) : results.length > 0 ? (
          <section className="flex flex-col gap-3">
            <p className="text-sm text-[var(--color-muted)]">
              {results.length} resultado{results.length !== 1 ? "s" : ""}
            </p>
            {results.map((result, index) => {
              const inner = (
                <CardContent className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
                      {result.title}
                    </h2>
                    {result.area || result.component ? (
                      <span className="rounded-md bg-[var(--color-foreground)]/5 px-2 py-0.5 text-xs text-[var(--color-muted)]">
                        {result.area || result.component}
                      </span>
                    ) : null}
                  </div>
                  {result.courseName ? (
                    <p className="text-xs text-[var(--color-muted)]">
                      {result.courseName}
                    </p>
                  ) : null}
                  {result.content ? (
                    <RichHtml
                      html={result.content}
                      className="line-clamp-3 text-sm leading-relaxed text-[var(--color-muted)]"
                    />
                  ) : null}
                </CardContent>
              );

              return (
                <Card
                  key={`${result.itemId}-${index}`}
                  className="animate-rise-in transition duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {result.contextUrl ? (
                    <Link
                      href={result.contextUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {inner}
                    </Link>
                  ) : (
                    inner
                  )}
                </Card>
              );
            })}
          </section>
        ) : null}
      </main>
    </div>
  );
}
