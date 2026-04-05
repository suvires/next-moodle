import Link from "next/link";
import type { CourseRoleActionSection } from "@/lib/course-roles";

function getToneClasses(
  tone: NonNullable<CourseRoleActionSection["tone"]> | undefined
) {
  switch (tone) {
    case "success":
      return {
        section: "border-[var(--success-soft)] bg-[var(--success-soft)]",
        pill: "bg-[var(--success-soft)] text-[var(--success)]",
      };
    case "warning":
      return {
        section: "border-[var(--warning-soft)] bg-[var(--warning-soft)]",
        pill: "bg-[var(--warning-soft)] text-[var(--warning)]",
      };
    case "accent":
      return {
        section:
          "border-[var(--accent)]/20 bg-[var(--accent)]/[0.05]",
        pill: "bg-[var(--accent)]/10 text-[var(--accent)]",
      };
    case "neutral":
    default:
      return {
        section: "border-[var(--line)] bg-[var(--surface)]",
        pill: "bg-[var(--surface-strong)] text-[var(--muted)]",
      };
  }
}

export function CourseRoleActionGrid({
  sections,
}: {
  sections: CourseRoleActionSection[];
}) {
  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4">
      {sections.map((section) => {
        const toneClasses = getToneClasses(section.tone);

        return (
          <section
            key={section.title}
            className={`rounded-2xl border px-5 py-5 ${toneClasses.section}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] ${toneClasses.pill}`}
              >
                {section.title}
              </span>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
              {section.description}
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {section.actions.map((action) =>
                action.href ? (
                  <Link
                    key={`${section.title}-${action.title}-${action.href}`}
                    href={action.href}
                    className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-4 transition hover:border-[var(--line-strong)] hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)]"
                  >
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {action.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {action.body}
                    </p>
                  </Link>
                ) : (
                  <div
                    key={`${section.title}-${action.title}`}
                    className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-4"
                  >
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {action.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {action.body}
                    </p>
                  </div>
                )
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
