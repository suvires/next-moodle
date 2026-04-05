import { redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { LinkButton } from "@/app/components/ui/button";
import { CalendarView } from "@/app/components/calendar-view";
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

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

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
    <div className="flex min-h-screen flex-col">
      <AppTopbar
          fullName={session.fullName}
          userPictureUrl={session.userPictureUrl}
          breadcrumbs={[{ label: "Calendario" }]}
      />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-5 py-6 md:px-8 md:py-8">

        <div>
          <div className="flex items-baseline justify-between gap-4">
            <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
              {MONTH_NAMES[month - 1]} {year}
            </h1>
            <div className="flex items-center gap-2">
              <LinkButton href={`/calendario?year=${prevYear}&month=${prevMonth}`} variant="ghost" size="sm">Anterior</LinkButton>
              <LinkButton href={`/calendario?year=${nextYear}&month=${nextMonth}`} variant="ghost" size="sm">Siguiente</LinkButton>
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

        <CalendarView
          monthlyData={monthlyData}
          upcomingEvents={upcomingEvents}
          year={year}
          month={month}
          isCurrentMonth={isCurrentMonth}
          today={today}
        />
      </main>
    </div>
  );
}
