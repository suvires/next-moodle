import Link from "next/link";
import { redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { logger } from "@/lib/logger";
import {
  getConversations,
  isAuthenticationError,
} from "@/lib/moodle";
import { getSession } from "@/lib/session";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatMessageTime(timestamp: number) {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    return new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  if (diffDays < 7) {
    return new Intl.DateTimeFormat("es-ES", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").trim();
}

export default async function MessagesPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  let conversations = [] as Awaited<ReturnType<typeof getConversations>>;
  let errorMessage: string | null = null;
  let expiredSession = false;

  try {
    conversations = await getConversations(session.token, session.userId);
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Messages page load failed", {
      userId: session.userId,
      error,
    });
    errorMessage = "No se pudieron cargar los mensajes.";
  }

  const unreadCount = conversations.filter((c) => !c.isRead).length;

  return (
    <div className="flex min-h-screen flex-col">
      <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          breadcrumbs={[{ label: "Mensajes" }]}
      />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-5 py-6 md:px-8 md:py-8">

        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
              Conversaciones
            </h1>
            {unreadCount > 0 ? (
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {unreadCount} sin leer
              </p>
            ) : null}
          </div>
          <p className="text-sm text-[var(--color-muted)]">
            {conversations.length} {conversations.length === 1 ? "conversación" : "conversaciones"}
          </p>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            {expiredSession
              ? "La sesión ya no es válida."
              : "No se pudieron cargar los mensajes."}
          </div>
        ) : null}

        {conversations.length > 0 ? (
          <Card className="rounded-xl">
            <CardContent className="p-2">
              <div className="flex flex-col">
                {conversations.map((conv) => {
                  const otherMember = conv.members.find(
                    (m) => m.id !== session.userId
                  );
                  const displayName =
                    conv.name ||
                    otherMember?.fullName ||
                    "Conversación";
                  const displayPicture = otherMember?.pictureUrl;

                  return (
                    <Link
                      key={conv.id}
                      href={`/mensajes/${conv.id}`}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 transition hover:bg-[var(--color-foreground)]/[0.04]"
                    >
                      <div className="relative shrink-0">
                        <Avatar className="h-10 w-10">
                          {displayPicture ? (
                            <AvatarImage
                              src={displayPicture}
                              alt={displayName}
                            />
                          ) : null}
                          <AvatarFallback className="text-xs text-[var(--color-muted)]">
                            {getInitials(displayName)}
                          </AvatarFallback>
                        </Avatar>
                        {!conv.isRead ? (
                          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p
                            className={`truncate text-sm ${
                              !conv.isRead
                                ? "font-semibold text-[var(--color-foreground)]"
                                : "text-[var(--color-foreground)]"
                            }`}
                          >
                            {displayName}
                          </p>
                          {conv.lastMessage ? (
                            <span className="shrink-0 text-xs text-[var(--color-muted)]">
                              {formatMessageTime(conv.lastMessage.createdAt)}
                            </span>
                          ) : null}
                        </div>
                        {conv.lastMessage ? (
                          <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">
                            {stripHtml(conv.lastMessage.text)}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : !errorMessage ? (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            No hay conversaciones.
          </p>
        ) : null}
      </main>
    </div>
  );
}
