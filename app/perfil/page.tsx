import { redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { RichHtml } from "@/app/components/rich-html";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Separator } from "@/app/components/ui/separator";
import { logger } from "@/lib/logger";
import { getUserProfile, getUserBadges, getUserCourses, isAuthenticationError } from "@/lib/moodle";
import { getMoodleMediaProxyUrl } from "@/lib/moodle-media";
import { getSession } from "@/lib/session";
import Link from "next/link";

function formatDate(timestamp?: number) {
  if (!timestamp) return null;
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(
    new Date(timestamp * 1000)
  );
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

export default async function PerfilPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  let profile: Awaited<ReturnType<typeof getUserProfile>> = null;
  let courseCount = 0;
  let badgeCount = 0;
  let errorMessage: string | null = null;

  try {
    const [userProfile, courses, badges] = await Promise.all([
      getUserProfile(session.token, session.userId),
      getUserCourses(session.token, session.userId),
      getUserBadges(session.token, session.userId).catch(() => []),
    ]);

    profile = userProfile;
    courseCount = courses.length;
    badgeCount = badges.length;
  } catch (error) {
    if (isAuthenticationError(error)) {
      redirect("/");
    }

    logger.error("Profile page load failed", {
      userId: session.userId,
      error,
    });
    errorMessage = "No se pudo cargar la información del perfil.";
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          breadcrumbs={[{ label: "Perfil" }]}
          actions={
            <Link
              href="/ajustes"
              className="text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]"
            >
              Ajustes
            </Link>
          }
      />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-5 py-6 md:px-8 md:py-8">

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            <p>{errorMessage}</p>
          </div>
        ) : null}

        {profile ? (
          <div className="animate-rise-in flex flex-col gap-5">
            <Card className="rounded-xl">
              <CardContent className="px-5 py-6">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                  <Avatar className="h-20 w-20">
                    {profile.pictureUrl ? (
                      <AvatarImage
                        src={getMoodleMediaProxyUrl(profile.pictureUrl)}
                        alt={profile.fullName}
                      />
                    ) : null}
                    <AvatarFallback className="text-xl">
                      {getInitials(profile.fullName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
                      {profile.fullName}
                    </h1>

                    {profile.email ? (
                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        {profile.email}
                      </p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-[var(--color-muted)] sm:justify-start">
                      {profile.department ? (
                        <span>{profile.department}</span>
                      ) : null}
                      {profile.institution ? (
                        <span>{profile.institution}</span>
                      ) : null}
                      {profile.city ? <span>{profile.city}</span> : null}
                      {profile.country ? <span>{profile.country}</span> : null}
                    </div>
                  </div>
                </div>

                {profile.description ? (
                  <>
                    <Separator className="my-5" />
                    <RichHtml
                      html={profile.description}
                      className="text-sm leading-relaxed text-[var(--color-muted)]"
                    />
                  </>
                ) : null}

                <Separator className="my-5" />

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--color-muted)]">
                  {profile.firstAccess ? (
                    <p>
                      <span className="font-medium text-[var(--color-foreground)]">
                        Primer acceso:
                      </span>{" "}
                      {formatDate(profile.firstAccess)}
                    </p>
                  ) : null}
                  {profile.lastAccess ? (
                    <p>
                      <span className="font-medium text-[var(--color-foreground)]">
                        Último acceso:
                      </span>{" "}
                      {formatDate(profile.lastAccess)}
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="rounded-xl">
                <CardContent className="flex items-center gap-4 px-5 py-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-accent)]/10">
                    <span className="text-lg font-semibold text-[var(--color-accent)]">
                      {courseCount}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-foreground)]">
                      {courseCount === 1 ? "Curso inscrito" : "Cursos inscritos"}
                    </p>
                    <Link
                      href="/mis-cursos"
                      className="text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
                    >
                      Ver cursos
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl">
                <CardContent className="flex items-center gap-4 px-5 py-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-accent)]/10">
                    <span className="text-lg font-semibold text-[var(--color-accent)]">
                      {badgeCount}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-foreground)]">
                      {badgeCount === 1 ? "Insignia obtenida" : "Insignias obtenidas"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : !errorMessage ? (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            No se encontró información del perfil.
          </p>
        ) : null}
      </main>
    </div>
  );
}
