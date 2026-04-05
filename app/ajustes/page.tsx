import Link from "next/link";
import { redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { PreferencesForm } from "@/app/components/preferences-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { logger } from "@/lib/logger";
import {
  getUserPreferences,
  getUserProfile,
  isAuthenticationError,
} from "@/lib/moodle";
import { getMoodleMediaProxyUrl } from "@/lib/moodle-media";
import { getSession } from "@/lib/session";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default async function SettingsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  let profile: Awaited<ReturnType<typeof getUserProfile>> = null;
  let preferences: Array<{ name: string; value: string }> = [];
  let errorMessage: string | null = null;
  let expiredSession = false;

  try {
    [profile, preferences] = await Promise.all([
      getUserProfile(session.token, session.userId),
      getUserPreferences(session.token, session.userId),
    ]);
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Settings page load failed", {
      userId: session.userId,
      error,
    });
    errorMessage = "No se pudieron cargar los ajustes.";
  }

  const avatarUrl = profile?.pictureUrl
    ? getMoodleMediaProxyUrl(profile.pictureUrl)
    : undefined;

  return (
    <main className="flex min-h-screen flex-1 px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          breadcrumbs={[
            { label: "Perfil", href: "/perfil" },
            { label: "Ajustes" },
          ]}
        />

        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            Ajustes
          </h1>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            {expiredSession
              ? "La sesión ya no es válida."
              : errorMessage}
          </div>
        ) : null}

        <Card className="rounded-xl">
          <CardContent>
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              Cuenta
            </h2>
            <Separator className="my-3" />
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={session.fullName} />
                ) : null}
                <AvatarFallback className="text-lg">
                  {getInitials(session.fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-[var(--color-foreground)]">
                  {profile?.fullName || session.fullName}
                </p>
                {profile?.email ? (
                  <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                    {profile.email}
                  </p>
                ) : null}
                {profile?.username ? (
                  <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                    @{profile.username}
                  </p>
                ) : null}
              </div>
            </div>

            {profile?.institution || profile?.department ? (
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                {profile.institution ? (
                  <p className="text-[var(--color-muted)]">
                    Institución:{" "}
                    <span className="text-[var(--color-foreground)]">
                      {profile.institution}
                    </span>
                  </p>
                ) : null}
                {profile.department ? (
                  <p className="text-[var(--color-muted)]">
                    Departamento:{" "}
                    <span className="text-[var(--color-foreground)]">
                      {profile.department}
                    </span>
                  </p>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardContent>
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              Preferencias
            </h2>
            <Separator className="my-3" />
            <PreferencesForm preferences={preferences} />
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardContent>
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              Enlaces rápidos
            </h2>
            <Separator className="my-3" />
            <div className="flex flex-col gap-2">
              <Link
                href="/perfil"
                className="rounded-lg px-3 py-2 text-sm text-[var(--color-foreground)] transition hover:bg-[var(--color-foreground)]/[0.04]"
              >
                Ver perfil completo
              </Link>
              <Link
                href="/archivos"
                className="rounded-lg px-3 py-2 text-sm text-[var(--color-foreground)] transition hover:bg-[var(--color-foreground)]/[0.04]"
              >
                Archivos privados
              </Link>
              <Link
                href="/notificaciones"
                className="rounded-lg px-3 py-2 text-sm text-[var(--color-foreground)] transition hover:bg-[var(--color-foreground)]/[0.04]"
              >
                Notificaciones
              </Link>
              <Link
                href="/mensajes"
                className="rounded-lg px-3 py-2 text-sm text-[var(--color-foreground)] transition hover:bg-[var(--color-foreground)]/[0.04]"
              >
                Mensajes
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
