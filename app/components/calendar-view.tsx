"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Modal } from "@heroui/react";
import { LinkButton } from "@/app/components/ui/button";
import { resolveCalendarEventUrlAction } from "@/app/actions/calendar";
import sanitizeHtml from "sanitize-html";
import type { MoodleCalendarEvent, MoodleCalendarWeek } from "@/lib/moodle";

type CalendarViewProps = {
  monthlyData: { weeks: MoodleCalendarWeek[] };
  upcomingEvents: MoodleCalendarEvent[];
  year: number;
  month: number;
  isCurrentMonth: boolean;
  today: number;
};

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

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

function EventRow({
  event,
  onClick,
}: {
  event: MoodleCalendarEvent;
  onClick: () => void;
}) {
  const badge = eventTypeBadge(event.eventType);
  const dateStr = formatEventDate(event.timeStart);

  return (
    <article
      onClick={onClick}
      className="flex cursor-pointer flex-col gap-1.5 rounded-lg border border-[var(--color-foreground)]/[0.06] px-4 py-3 transition hover:bg-[var(--surface-strong)] sm:flex-row sm:items-center sm:justify-between"
    >
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

export function CalendarView({
  monthlyData,
  upcomingEvents,
  year,
  month,
  isCurrentMonth,
  today,
}: CalendarViewProps) {
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] = useState<MoodleCalendarEvent | null>(null);
  const [navigating, setNavigating] = useState(false);

  const selectedBadge = selectedEvent ? eventTypeBadge(selectedEvent.eventType) : null;
  const selectedDateStr = selectedEvent ? formatEventDate(selectedEvent.timeStart) : null;

  // Events with a module (instance = cmid) need server-side resolution.
  // Events that are course-level (no moduleName) can link directly.
  const directCourseUrl =
    selectedEvent && !selectedEvent.moduleName && selectedEvent.courseId
      ? `/mis-cursos/${selectedEvent.courseId}`
      : null;
  const needsResolution = !!(selectedEvent?.instance && selectedEvent?.moduleName);

  async function handleGoToActivity() {
    if (!selectedEvent) return;
    setNavigating(true);
    try {
      const url = await resolveCalendarEventUrlAction(
        selectedEvent.instance!,
        selectedEvent.courseId
      );
      if (url) {
        setSelectedEvent(null);
        router.push(url);
      }
    } finally {
      setNavigating(false);
    }
  }

  return (
    <>
      {/* Monthly grid */}
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
        <div className="px-4 py-4 md:px-5">
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
                              <button
                                key={event.id}
                                onClick={() => setSelectedEvent(event)}
                                className="w-full truncate rounded bg-[var(--color-accent)]/10 px-1 py-0.5 text-left text-[0.6rem] leading-tight text-[var(--color-accent)] transition hover:bg-[var(--color-accent)]/20"
                                title={event.name}
                              >
                                {event.name}
                              </button>
                            ))}
                            {day.events.length > 2 ? (
                              <button
                                onClick={() => setSelectedEvent(day.events[2])}
                                className="text-left text-[0.6rem] text-[var(--color-muted)] hover:underline"
                              >
                                +{day.events.length - 2} más
                              </button>
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
        </div>
      </div>

      {/* Upcoming events */}
      {upcomingEvents.length > 0 ? (
        <div>
          <p className="mb-3 text-sm font-medium text-[var(--color-foreground)]">
            Próximos eventos ({upcomingEvents.length})
          </p>
          <div className="flex flex-col gap-2">
            {upcomingEvents.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                onClick={() => setSelectedEvent(event)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* Event detail modal */}
      <Modal.Backdrop
        isOpen={!!selectedEvent}
        onOpenChange={(open) => { if (!open) setSelectedEvent(null); }}
      >
        <Modal.Container size="sm">
          <Modal.Dialog
            aria-label="Detalle del evento"
            className="rounded-[var(--radius-lg)] border border-[var(--line)] shadow-[var(--shadow-md)]"
          >
            <Modal.CloseTrigger />
            <Modal.Header className="mb-1">
              <div className="flex flex-col gap-1">
                {selectedBadge && (
                  <span className={`text-xs font-medium ${selectedBadge.tone}`}>
                    {selectedBadge.label}
                  </span>
                )}
                <Modal.Heading className="text-lg font-semibold text-[var(--color-foreground)]">
                  {selectedEvent?.name}
                </Modal.Heading>
              </div>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              {(selectedDateStr || selectedEvent?.courseName) && (
                <div className="flex flex-col gap-0.5 text-sm text-[var(--color-muted)]">
                  {selectedDateStr && <span>{selectedDateStr}</span>}
                  {selectedEvent?.courseName && <span>{selectedEvent.courseName}</span>}
                </div>
              )}
              {selectedEvent?.description && (
                <div
                  className="text-sm leading-relaxed text-[var(--color-foreground)]"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(selectedEvent.description),
                  }}
                />
              )}
            </Modal.Body>
            {(needsResolution || directCourseUrl) && (
              <Modal.Footer>
                {needsResolution ? (
                  <Button
                    className="w-full"
                    isDisabled={navigating}
                    onPress={handleGoToActivity}
                  >
                    {navigating ? "Abriendo..." : "Ir a la actividad"}
                  </Button>
                ) : (
                  <LinkButton
                    href={directCourseUrl!}
                    className="w-full"
                    onClick={() => setSelectedEvent(null)}
                  >
                    Ver curso
                  </LinkButton>
                )}
              </Modal.Footer>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
