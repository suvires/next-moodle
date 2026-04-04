import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { AppTopbar } from "@/app/components/app-topbar";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { RichHtml } from "@/app/components/rich-html";
import { Separator } from "@/app/components/ui/separator";
import { logger } from "@/lib/logger";
import {
  getUserCourses,
  getUsersById,
  isAuthenticationError,
} from "@/lib/moodle";
import { getSession } from "@/lib/session";

export default async function MyCoursesPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  let courses = [] as Awaited<ReturnType<typeof getUserCourses>>;
  let errorMessage: string | null = null;
  let expiredSession = false;
  let currentUserPictureUrl = session.userPictureUrl;

  try {
    courses = await getUserCourses(session.token, session.userId);

    if (!currentUserPictureUrl) {
      currentUserPictureUrl =
        (await getUsersById(session.token, [session.userId])).get(session.userId)
          ?.pictureUrl || undefined;
    }
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Courses dashboard load failed", {
      userId: session.userId,
      error,
    });
    errorMessage = "No se pudieron cargar tus cursos en este momento.";
  }

  return (
    <main className="grain-overlay relative flex min-h-screen flex-1 overflow-x-hidden px-5 py-6 md:px-8 md:py-8">
      <div className="ambient-orb ambient-orb-white left-[-6rem] top-[-2rem] h-52 w-52 md:h-72 md:w-72" />
      <div className="ambient-orb ambient-orb-blue right-[-8rem] top-12 h-72 w-72 md:h-[28rem] md:w-[28rem]" />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <AppTopbar
          fullName={session.fullName}
          userPictureUrl={currentUserPictureUrl}
          sectionLabel="Panel"
          actions={
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                Salir
              </Button>
            </form>
          }
        />

        <Card className="hero-panel animate-rise-in rounded-[2rem]">
          <CardContent className="relative z-10 grid gap-6 px-6 py-8 md:grid-cols-[minmax(0,1.3fr)_auto] md:px-8">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-semibold tracking-[0.28em] text-[var(--color-accent-soft)] uppercase">
                Mis cursos
              </p>
              <h1 className="display-face mt-4 text-balance text-5xl leading-[0.94] text-[var(--color-foreground)] md:text-6xl">
                Todo tu espacio académico en una sola vista.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-8 text-[var(--color-muted)] md:text-base">
                Accede a cursos, foros, recursos y paquetes interactivos sin perderte en la
                navegación original del campus.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:min-w-[18rem] md:grid-cols-1">
              <div className="metric-chip rounded-[1.25rem] px-4 py-4">
                <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-[var(--color-accent-soft)] uppercase">
                  Usuario
                </p>
                <p className="mt-2 text-lg font-semibold text-[var(--color-foreground)]">
                  {session.fullName}
                </p>
              </div>
              <div className="metric-chip rounded-[1.25rem] px-4 py-4">
                <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-[var(--color-accent-soft)] uppercase">
                  Cursos activos
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--color-foreground)]">
                  {courses.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {errorMessage ? (
          <Card className="rounded-[1.5rem] border-[rgba(255,124,124,0.24)] bg-[rgba(255,124,124,0.08)]">
            <CardContent className="px-6 py-5 text-sm leading-7 text-[var(--color-danger)]">
              <p className="font-semibold">
                {expiredSession ? "La sesión ya no es válida." : "No se pudieron cargar los cursos."}
              </p>
              <p className="mt-1 opacity-80">{errorMessage}</p>
              {expiredSession ? (
                <p className="mt-1 opacity-80">Vuelve a iniciar sesión.</p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.length > 0 ? (
            courses.map((course, index) => (
              <Card
                key={course.id}
                className="course-card animate-rise-in rounded-[1.8rem] transition duration-300"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <CardContent className="h-full p-0">
                  <Link href={`/mis-cursos/${course.id}`} className="flex h-full flex-col px-6 py-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-[var(--color-accent-soft)] uppercase">
                          {course.shortname && course.shortname !== course.fullname
                            ? course.shortname
                            : "Curso"}
                        </p>
                      </div>
                    </div>

                    <h2 className="display-face mt-6 text-3xl leading-tight text-[var(--color-foreground)]">
                      {course.fullname}
                    </h2>

                    {course.summary ? (
                      <>
                        <Separator className="my-5" />
                        <RichHtml
                          html={course.summary}
                          className="line-clamp-5 text-sm leading-7 text-[var(--color-muted)]"
                        />
                      </>
                    ) : (
                      <p className="mt-5 text-sm leading-7 text-[var(--color-muted)]">
                        Sin descripción visible.
                      </p>
                    )}
                  </Link>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="hero-panel col-span-full rounded-[1.8rem]">
              <CardContent className="px-8 py-10">
                <p className="text-[0.72rem] font-semibold tracking-[0.24em] text-[var(--color-accent-soft)] uppercase">
                  Sin cursos
                </p>
                <h2 className="display-face mt-4 text-4xl leading-tight text-[var(--color-foreground)]">
                  No hay cursos visibles para esta cuenta.
                </h2>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
}
