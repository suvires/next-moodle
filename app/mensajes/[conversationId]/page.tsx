import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { MessageReplyForm } from "@/app/components/message-reply-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import { logger } from "@/lib/logger";
import {
  getConversationMessages,
  isAuthenticationError,
  markMessageRead,
} from "@/lib/moodle";
import { getSession } from "@/lib/session";

type ConversationPageProps = {
  params: Promise<{
    conversationId: string;
  }>;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatMessageTime(timestamp: number) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp * 1000));
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").trim();
}

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const { conversationId } = await params;
  const parsedConvId = Number(conversationId);

  if (!Number.isInteger(parsedConvId) || parsedConvId <= 0) {
    notFound();
  }

  let members = new Map<number, { id: number; fullName: string; pictureUrl?: string }>();
  let messages = [] as Array<{
    id: number;
    text: string;
    authorId: number;
    createdAt: number;
  }>;
  let errorMessage: string | null = null;
  let expiredSession = false;

  try {
    const result = await getConversationMessages(
      session.token,
      parsedConvId,
      session.userId
    );
    members = result.members;
    messages = result.messages;
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Conversation load failed", {
      userId: session.userId,
      conversationId: parsedConvId,
      error,
    });
    errorMessage = "No se pudo cargar la conversación.";
  }

  // Mark the latest message as read (fire-and-forget)
  const lastMessage = messages[messages.length - 1];
  if (lastMessage) {
    markMessageRead(session.token, lastMessage.id).catch(() => {});
  }

  const otherMember = Array.from(members.values()).find(
    (m) => m.id !== session.userId
  );
  const conversationName = otherMember?.fullName || "Conversación";
  const replyToUserId = otherMember?.id;

  return (
    <div className="flex min-h-screen flex-col">
      <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          breadcrumbs={[
            { label: "Mensajes", href: "/mensajes" },
            { label: conversationName },
          ]}
      />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-5 py-6 md:px-8 md:py-8">

        <div className="flex items-center gap-3">
          {otherMember ? (
            <Avatar className="h-8 w-8">
              {otherMember.pictureUrl ? (
                <AvatarImage
                  src={otherMember.pictureUrl}
                  alt={conversationName}
                />
              ) : null}
              <AvatarFallback className="text-xs text-[var(--color-muted)]">
                {getInitials(conversationName)}
              </AvatarFallback>
            </Avatar>
          ) : null}
          <h1 className="text-lg font-semibold text-[var(--color-foreground)]">
            {conversationName}
          </h1>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            {expiredSession
              ? "La sesión ya no es válida."
              : "No se pudo cargar la conversación."}
          </div>
        ) : null}

        {messages.length > 0 ? (
          <div className="flex flex-col gap-3">
            {messages.map((msg) => {
              const isOwn = msg.authorId === session.userId;
              const author = members.get(msg.authorId);

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="mt-1 h-7 w-7 shrink-0">
                    {author?.pictureUrl ? (
                      <AvatarImage
                        src={author.pictureUrl}
                        alt={author.fullName}
                      />
                    ) : null}
                    <AvatarFallback className="text-[0.6rem] text-[var(--color-muted)]">
                      {getInitials(author?.fullName || "?")}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={`max-w-[75%] rounded-xl px-3.5 py-2.5 ${
                      isOwn
                        ? "rounded-tr-sm bg-[var(--color-accent)]/10"
                        : "rounded-tl-sm bg-[var(--color-foreground)]/[0.06]"
                    }`}
                  >
                    <p className="text-sm leading-relaxed text-[var(--color-foreground)]">
                      {stripHtml(msg.text)}
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        isOwn
                          ? "text-right text-[var(--color-muted)]"
                          : "text-[var(--color-muted)]"
                      }`}
                    >
                      {formatMessageTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : !errorMessage ? (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            No hay mensajes en esta conversación.
          </p>
        ) : null}

        {replyToUserId ? (
          <Card className="rounded-xl">
            <CardContent className="px-4 py-4">
              <p className="mb-3 text-sm font-medium text-[var(--color-foreground)]">
                Responder
              </p>
              <MessageReplyForm
                toUserId={replyToUserId}
                conversationId={String(parsedConvId)}
              />
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  );
}
