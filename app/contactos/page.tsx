import Link from "next/link";
import { redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Card, CardContent } from "@/app/components/ui/card";
import { logger } from "@/lib/logger";
import {
  getUnsupportedMoodleFeatureMessage,
  resolveMoodleFeatureSupport,
} from "@/lib/moodle-feature-support";
import { getContacts, getSiteInfo, isAuthenticationError } from "@/lib/moodle";
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

export default async function ContactsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  let contacts: Awaited<ReturnType<typeof getContacts>> = [];
  let errorMessage: string | null = null;
  let expiredSession = false;
  let supportsContacts = false;

  try {
    const siteInfo = await getSiteInfo(session.token);
    supportsContacts = resolveMoodleFeatureSupport(siteInfo.functions).contacts;

    if (supportsContacts) {
      contacts = await getContacts(session.token, session.userId);
    }
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Contacts load failed", {
      userId: session.userId,
      error,
    });
    errorMessage = "No se pudieron cargar los contactos.";
  }

  return (
    <main className="flex min-h-screen flex-1 px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          breadcrumbs={[
            { label: "Mensajes", href: "/mensajes" },
            { label: "Contactos" },
          ]}
        />

        <div className="animate-rise-in">
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
            Contactos
          </h1>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            <p className="font-semibold">
              {expiredSession
                ? "La sesión ya no es válida."
                : "Error al cargar contactos."}
            </p>
            <p className="mt-1 opacity-80">{errorMessage}</p>
            {expiredSession ? (
              <p className="mt-1 opacity-80">Vuelve a iniciar sesión.</p>
            ) : null}
          </div>
        ) : null}

        {!supportsContacts ? (
          <div className="rounded-lg border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/5 px-4 py-3 text-sm text-[var(--color-warning)]">
            {getUnsupportedMoodleFeatureMessage("contacts")}
          </div>
        ) : null}

        {supportsContacts && contacts.length === 0 && !errorMessage ? (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            No tienes contactos.
          </p>
        ) : null}

        {contacts.length > 0 ? (
          <section className="flex flex-col gap-3">
            {contacts.map((contact, index) => (
              <Card
                key={contact.id}
                className="animate-rise-in rounded-xl transition duration-300"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Link href="/mensajes">
                  <CardContent className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {contact.pictureUrl ? (
                        <AvatarImage
                          src={getMoodleMediaProxyUrl(contact.pictureUrl)}
                          alt={contact.fullName}
                        />
                      ) : null}
                      <AvatarFallback className="text-xs text-[var(--color-muted)]">
                        {getInitials(contact.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-[var(--color-foreground)]">
                      {contact.fullName}
                    </span>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
