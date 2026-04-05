import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { AppTopbar } from "@/app/components/app-topbar";
import { RichHtml } from "@/app/components/rich-html";
import { Card, CardContent } from "@/app/components/ui/card";
import { logger } from "@/lib/logger";
import { getNotifications, markNotificationRead, isAuthenticationError } from "@/lib/moodle";
import { getSession } from "@/lib/session";

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(timestamp * 1000));
}

export default async function NotificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/");

  const { id } = await params;
  const notificationId = parseInt(id, 10);
  if (isNaN(notificationId)) notFound();

  let notifications: Awaited<ReturnType<typeof getNotifications>> = [];

  try {
    notifications = await getNotifications(session.token, session.userId);
  } catch (error) {
    if (isAuthenticationError(error)) redirect("/auth/session-expired");
    logger.error("Notification detail load failed", { userId: session.userId, error });
    notFound();
  }

  const notification = notifications.find((n) => n.id === notificationId);
  if (!notification) notFound();

  if (!notification.isRead) {
    after(async () => {
      try {
        await markNotificationRead(session.token, notificationId);
        revalidatePath("/notificaciones");
      } catch {
        // non-critical
      }
    });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          breadcrumbs={[
            { label: "Notificaciones", href: "/notificaciones" },
            { label: notification.subject },
          ]}
      />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-5 py-6 md:px-8 md:py-8">

        <div className="animate-rise-in flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
              {notification.subject}
            </h1>
            <div className="mt-1 flex flex-wrap gap-3 text-sm text-[var(--color-muted)]">
              {notification.fromUserName && (
                <span>De: {notification.fromUserName}</span>
              )}
              {notification.timeCreated && (
                <span>{formatTime(notification.timeCreated)}</span>
              )}
            </div>
          </div>

          <Card>
            <CardContent className="py-5">
              {notification.messageHtml ? (
                <RichHtml
                  html={notification.messageHtml}
                  className="text-sm leading-relaxed text-[var(--color-foreground)]"
                />
              ) : notification.message ? (
                <p className="text-sm leading-relaxed text-[var(--color-foreground)]">
                  {notification.message}
                </p>
              ) : (
                <p className="text-sm text-[var(--color-muted)]">Sin contenido.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
