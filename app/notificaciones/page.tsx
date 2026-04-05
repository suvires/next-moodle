import Link from "next/link";
import { redirect } from "next/navigation";
import { markAllNotificationsReadAction } from "@/app/actions/notifications";
import { AppTopbar } from "@/app/components/app-topbar";
import { RichHtml } from "@/app/components/rich-html";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { logger } from "@/lib/logger";
import { getNotifications, isAuthenticationError } from "@/lib/moodle";
import { getSession } from "@/lib/session";

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp * 1000));
}

export default async function NotificationsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  let notifications: Awaited<ReturnType<typeof getNotifications>> = [];
  let errorMessage: string | null = null;
  let expiredSession = false;

  try {
    notifications = await getNotifications(session.token, session.userId);
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Notifications load failed", {
      userId: session.userId,
      error,
    });
    errorMessage = "No se pudieron cargar las notificaciones.";
  }

  return (
    <main className="flex min-h-screen flex-1 px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          breadcrumbs={[{ label: "Notificaciones" }]}
        />

        <div className="animate-rise-in flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            Notificaciones
          </h1>
          {notifications.some((n) => !n.isRead) ? (
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

        {notifications.length === 0 && !errorMessage ? (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            No tienes notificaciones.
          </p>
        ) : null}

        {notifications.length > 0 ? (
          <section className="flex flex-col gap-3">
            {notifications.map((notification, index) => {
              const inner = (
                <CardContent className="flex gap-3">
                  <div className="relative mt-1.5 flex shrink-0">
                    {!notification.isRead ? (
                      <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-transparent" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2
                        className={`text-sm font-semibold ${
                          notification.isRead
                            ? "text-[var(--color-muted)]"
                            : "text-[var(--color-foreground)]"
                        }`}
                      >
                        {notification.subject}
                      </h2>
                      {notification.timeCreated ? (
                        <span className="shrink-0 text-xs text-[var(--color-muted)]">
                          {formatTime(notification.timeCreated)}
                        </span>
                      ) : null}
                    </div>
                    {notification.fromUserName ? (
                      <p className="text-xs text-[var(--color-muted)]">
                        De: {notification.fromUserName}
                      </p>
                    ) : null}
                    {notification.messageHtml ? (
                      <RichHtml
                        html={notification.messageHtml}
                        className="line-clamp-2 text-sm leading-relaxed text-[var(--color-muted)]"
                      />
                    ) : notification.message ? (
                      <p className="line-clamp-2 text-sm leading-relaxed text-[var(--color-muted)]">
                        {notification.message}
                      </p>
                    ) : null}
                  </div>
                </CardContent>
              );

              return (
                <Card
                  key={notification.id}
                  className="animate-rise-in transition duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {notification.contextUrl ? (
                    <Link
                      href={notification.contextUrl}
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
      </div>
    </main>
  );
}
