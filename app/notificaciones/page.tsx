import Link from "next/link";
import { redirect } from "next/navigation";
import { markAllNotificationsReadAction } from "@/app/actions/notifications";
import { AppTopbar } from "@/app/components/app-topbar";
import { Button } from "@/app/components/ui/button";
import { logger } from "@/lib/logger";
import {
  getUnsupportedMoodleFeatureMessage,
  resolveMoodleFeatureSupport,
} from "@/lib/moodle-feature-support";
import { getNotifications, getSiteInfo, isAuthenticationError } from "@/lib/moodle";
import { getSession } from "@/lib/session";

export default async function NotificationsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  let notifications: Awaited<ReturnType<typeof getNotifications>> = [];
  let errorMessage: string | null = null;
  let expiredSession = false;
  let supportsMarkAllRead = false;

  try {
    const [siteInfo, notificationsResult] = await Promise.all([
      getSiteInfo(session.token),
      getNotifications(session.token, session.userId),
    ]);
    notifications = notificationsResult;
    supportsMarkAllRead =
      resolveMoodleFeatureSupport(siteInfo.functions).notificationsMarkAllRead;
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Notifications load failed", {
      userId: session.userId,
      error,
    });
    errorMessage = "No se pudieron cargar las notificaciones.";
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          breadcrumbs={[{ label: "Notificaciones" }]}
      />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-5 py-6 md:px-8 md:py-8">

        <div className="animate-rise-in flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            Notificaciones
          </h1>
          {supportsMarkAllRead && notifications.some((n) => !n.isRead) ? (
            <form action={markAllNotificationsReadAction}>
              <Button variant="ghost" size="sm">
                Marcar todo como leído
              </Button>
            </form>
          ) : null}
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            <p className="font-semibold">
              {expiredSession
                ? "La sesión ya no es válida."
                : "Error al cargar notificaciones."}
            </p>
            <p className="mt-1 opacity-80">{errorMessage}</p>
            {expiredSession ? (
              <p className="mt-1 opacity-80">Vuelve a iniciar sesión.</p>
            ) : null}
          </div>
        ) : null}

        {!supportsMarkAllRead ? (
          <div className="rounded-lg border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/5 px-4 py-3 text-sm text-[var(--color-warning)]">
            {getUnsupportedMoodleFeatureMessage("notificationsMarkAllRead")}
          </div>
        ) : null}

        {notifications.length === 0 && !errorMessage ? (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            No tienes notificaciones.
          </p>
        ) : null}

        {notifications.length > 0 ? (
          <section className="flex flex-col divide-y divide-[var(--line)]">
            {notifications.map((notification, index) => (
              <Link
                key={notification.id}
                href={`/notificaciones/${notification.id}`}
                className="animate-rise-in flex items-center gap-3 py-3 transition hover:bg-[var(--surface-strong)] -mx-2 px-2 rounded-lg"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span
                  className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                    notification.isRead ? "bg-transparent" : "bg-[var(--color-accent)]"
                  }`}
                />
                <span
                  className={`text-sm ${
                    notification.isRead
                      ? "text-[var(--color-muted)]"
                      : "font-medium text-[var(--color-foreground)]"
                  }`}
                >
                  {notification.subject}
                </span>
              </Link>
            ))}
          </section>
        ) : null}
      </main>
    </div>
  );
}
