import Link from "next/link";
import { redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { logger } from "@/lib/logger";
import {
  getUpcomingEvents,
  getMonthlyView,
  isAuthenticationError,
} from "@/lib/moodle";
import type { MoodleCalendarEvent } from "@/lib/moodle";
import { getSession } from "@/lib/session";

type CalendarPageProps = {
  searchParams: Promise<{
    year?: string;
    month?: string;
  }>;
};

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function formatEventDate(timestamp?: number) {
  if (!timestamp) return null;
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp * 1000));
}

function eventTypeBadge(eventType: string) {
  switch (eventType) {
    case "due":
      return { label: "Entrega", tone: "text-[var(--color-danger)]" };
    case "course":
      return { label: "Curso", tone: "text-[var(--color-accent)]" };
    case "site":
      return { label: "Sitio", tone: "text-[var(--color-muted)]" };
    case "user":
      return { label: "Personal", tone: "text-[var(--color-accent)]" };
    case "group":
      return { label: "Grupo", tone: "text-[var(--color-accent)]" };
    default:
      return { label: eventType, tone: "text-[var(--color-muted)]" };
  }
}

function EventRow({ event }: { event: MoodleCalendarEvent }) {
  const badge = eventTypeBadge(event.eventType);
  const dateStr = formatEventDate(event.timeStart);

  return (
    <article className="flex flex-col gap-1.5 rounded-lg border border-[var(--color-foreground)]/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${badge.tone}`}>
            {badge.label}
          </span>
          {event.moduleName ? (
            <span className="rounded-md bg-[var(--color-foreground)]/[0.06] px-1.5 py-0.5 text-xs text-[var(--color-muted)]">
              {event.moduleName}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm font-medium text-[var(--color-foreground)]">
          {event.name}
        </p>
        {event.courseName ? (
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
            {event.courseName}
          </p>
        ) : null}
      </div>
      <div className="shrink-0 text-right">
        {dateStr ? (
          <p className="text-xs text-[var(--color-muted)]">{dateStr}</p>
        ) : null}
      </div>
    </article>
  );
}

export default async function CalendarPage({
  searchParams,
}: CalendarPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const sp = await searchParams;
  const now = new Date();
  const year = sp.year ? Number(sp.year) : now.getFullYear();
  const month = sp.month ? Number(sp.month) : now.getMonth() + 1;

  let upcomingEvents: MoodleCalendarEvent[] = [];
  let monthlyData: Awaited<ReturnType<typeof getMonthlyView>> = { weeks: [] };
  let errorMessage: string | null = null;
  let expiredSession = false;

  try {
    [upcomingEvents, monthlyData] = await Promise.all([
      getUpcomingEvents(session.token),
      getMonthlyView(session.token, year, month),
    ]);
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Calendar page load failed", {
      userId: session.userId,
      error,
    });
    errorMessage = "No se pudo cargar el calendario.";
  }

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  const today = now.getDate();
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;

  return (
    <main className="flex min-h-screen flex-1 px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          breadcrumbs={[{ label: "Calendario" }]}
        />

        <div>
          <div className="flex items-baseline justify-between gap-4">
            <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
              {MONTH_NAMES[month - 1]} {year}
            </h1>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href={`/calendario?year=${prevYear}&month=${prevMonth}`}>
                  Anterior
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/calendario?year=${nextYear}&month=${nextMonth}`}>
                  Siguiente
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
            {expiredSession
              ? "La sesión ya no es válida."
              : "No se pudo cargar el calendario."}
          </div>
        ) : null}

        <Card className="rounded-xl">
          <CardContent className="px-4 py-4 md:px-5">
            <div className="grid grid-cols-7 gap-px">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="py-2 text-center text-xs font-medium text-[var(--color-muted)]"
                >
                  {label}
                </div>
              ))}

              {monthlyData.weeks.flatMap((week) =>
                week.days.map((day) => {
                  const hasEvents = day.events.length > 0;
                  const isToday = isCurrentMonth && day.day === today;

                  return (
                    <div
                      key={day.timestamp || `empty-${day.day}`}
                      className={`relative min-h-[4rem] rounded-lg border p-2 ${
                        day.day === 0
                          ? "border-transparent"
                          : isToday
                            ? "border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5"
                            : "border-[var(--color-foreground)]/[0.06]"
                      }`}
                    >
                      {day.day > 0 ? (
                        <>
                          <span
                            className={`text-xs font-medium ${
                              isToday
                                ? "text-[var(--color-accent)]"
                                : "text-[var(--color-foreground)]"
                            }`}
                          >
                            {day.day}
                          </span>
                          {hasEvents ? (
                            <div className="mt-1 flex flex-col gap-0.5">
                              {day.events.slice(0, 2).map((event) => (
                                <div
                                  key={event.id}
                                  className="truncate rounded bg-[var(--color-accent)]/10 px-1 py-0.5 text-[0.6rem] leading-tight text-[var(--color-accent)]"
                                  title={event.name}
                                >
                                  {event.name}
                                </div>
                              ))}
                              {day.events.length > 2 ? (
                                <span className="text-[0.6rem] text-[var(--color-muted)]">
                                  +{day.events.length - 2} más
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {upcomingEvents.length > 0 ? (
          <div>
            <p className="mb-3 text-sm font-medium text-[var(--color-foreground)]">
              Próximos eventos ({upcomingEvents.length})
            </p>
            <div className="flex flex-col gap-2">
              {upcomingEvents.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
