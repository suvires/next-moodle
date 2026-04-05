import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const BONEYARD_SKELETON_NAMES = [
  "admin-cohorte-detail",
  "admin-cohortes",
  "admin-cursos",
  "admin-dashboard",
  "admin-matriculaciones",
  "admin-usuarios",
  "assign-detail",
  "assignments-page",
  "blog",
  "book-detail",
  "calendar-page",
  "catalog",
  "choice-detail",
  "competencies",
  "contacts",
  "conversation-detail",
  "course-detail",
  "course-reports",
  "dashboard",
  "database-detail",
  "discussion-detail",
  "feedback-detail",
  "files",
  "forum-detail",
  "glossary-detail",
  "grades-page",
  "h5p-detail",
  "lesson-detail",
  "lti-detail",
  "messages-page",
  "notifications",
  "participants-page",
  "profile",
  "quiz-detail",
  "resource-page",
  "scorm-page",
  "search",
  "settings",
  "wiki-detail",
  "workshop-detail",
] as const;

export type BoneyardSkeletonName = (typeof BONEYARD_SKELETON_NAMES)[number];

function Surface({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]",
        className
      )}
    >
      {children}
    </div>
  );
}

function Line({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-full bg-[var(--surface-strong)]/90",
        className ?? "h-4 w-full"
      )}
    />
  );
}

function Pill({ className }: { className?: string }) {
  return <Line className={cn("h-3 w-20", className)} />;
}

function AvatarStub({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "size-11 rounded-full bg-[var(--surface-strong)]/90",
        className
      )}
    />
  );
}

function ButtonStub({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-10 rounded-full bg-[var(--surface-strong)]/90",
        className ?? "w-28"
      )}
    />
  );
}

function AppTopbarFixture() {
  return (
    <div className="topbar-panel rounded-[1.75rem] border border-[var(--line)] bg-[var(--surface)] px-5 py-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-4">
        <div className="size-10 rounded-2xl bg-[var(--surface-strong)]/90" />
        <div className="flex flex-1 items-center gap-3">
          <Line className="h-3 w-24" />
          <Line className="hidden h-3 w-16 md:block" />
        </div>
        <ButtonStub className="w-24" />
        <AvatarStub className="size-9" />
      </div>
    </div>
  );
}

function PublicHeaderFixture() {
  return (
    <Surface className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <div className="size-14 rounded-[1.25rem] bg-[var(--surface-strong)]/90" />
        <div className="space-y-2">
          <Line className="h-5 w-32" />
          <Line className="h-3 w-20" />
        </div>
      </div>
      <div className="flex gap-3">
        <ButtonStub className="w-24" />
        <ButtonStub className="w-28" />
      </div>
    </Surface>
  );
}

function IntroFixture({
  titleWidth = "w-56",
  subtitleWidth = "w-80",
  withPill = true,
}: {
  titleWidth?: string;
  subtitleWidth?: string;
  withPill?: boolean;
}) {
  return (
    <div className="space-y-3">
      {withPill ? <Pill /> : null}
      <Line className={cn("h-8", titleWidth)} />
      <Line className={cn("h-4", subtitleWidth)} />
      <Line className="h-4 w-2/3" />
    </div>
  );
}

function MetricGridFixture() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Surface key={index} className="space-y-4">
          <Line className="h-3 w-24" />
          <Line className="h-9 w-20" />
          <Line className="h-3 w-32" />
        </Surface>
      ))}
    </div>
  );
}

function LinkCardGridFixture({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: count }).map((_, index) => (
        <Surface key={index} className="space-y-3">
          <Line className="h-5 w-32" />
          <Line className="h-4 w-full" />
          <Line className="h-4 w-3/4" />
          <ButtonStub className="mt-2 w-28" />
        </Surface>
      ))}
    </div>
  );
}

function SearchBarFixture() {
  return (
    <div className="flex gap-3">
      <div className="h-11 flex-1 rounded-[1rem] bg-[var(--surface)] shadow-[var(--shadow-sm)] ring-1 ring-[var(--line)]" />
      <ButtonStub className="w-28" />
    </div>
  );
}

function ListFixture({
  count = 4,
  withAvatar = false,
  compact = false,
}: {
  count?: number;
  withAvatar?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <Surface
          key={index}
          className={cn("space-y-3", compact ? "p-4" : "p-5")}
        >
          <div className="flex items-start gap-4">
            {withAvatar ? <AvatarStub /> : null}
            <div className="min-w-0 flex-1 space-y-3">
              <Line className="h-5 w-2/5" />
              <Line className="h-4 w-full" />
              <Line className="h-4 w-4/5" />
            </div>
            <ButtonStub className="hidden w-24 md:block" />
          </div>
        </Surface>
      ))}
    </div>
  );
}

function CardGridFixture({
  count = 6,
  columns = "md:grid-cols-2 xl:grid-cols-3",
  bodyLines = 3,
}: {
  count?: number;
  columns?: string;
  bodyLines?: number;
}) {
  return (
    <div className={cn("grid gap-4", columns)}>
      {Array.from({ length: count }).map((_, index) => (
        <Surface key={index} className="flex h-full flex-col gap-3">
          <Line className="h-3 w-20" />
          <Line className="h-6 w-4/5" />
          {Array.from({ length: bodyLines }).map((__, lineIndex) => (
            <Line
              key={lineIndex}
              className={cn("h-4", lineIndex === bodyLines - 1 ? "w-2/3" : "w-full")}
            />
          ))}
          <ButtonStub className="mt-4 w-full" />
        </Surface>
      ))}
    </div>
  );
}

function CourseActionGridFixture() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Surface key={index} className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <Pill className="w-14" />
            <div className="size-8 rounded-2xl bg-[var(--surface-strong)]/90" />
          </div>
          <Line className="h-5 w-2/3" />
          <Line className="h-4 w-full" />
          <Line className="h-4 w-5/6" />
        </Surface>
      ))}
    </div>
  );
}

function SplitContentFixture({
  sidebar,
  content,
}: {
  sidebar: ReactNode;
  content: ReactNode;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="space-y-4">{sidebar}</div>
      <div className="space-y-4">{content}</div>
    </div>
  );
}

function TableFixture({ rows = 5 }: { rows?: number }) {
  return (
    <Surface className="overflow-hidden p-0">
      <div className="border-b border-[var(--line)] bg-[var(--surface-strong)]/35 p-4">
        <div className="grid grid-cols-4 gap-3">
          <Line className="h-4 w-3/4" />
          <Line className="h-4 w-3/4" />
          <Line className="h-4 w-3/4" />
          <Line className="h-4 w-3/4" />
        </div>
      </div>
      <div className="space-y-0">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="border-b border-[var(--line)] p-4 last:border-b-0">
            <div className="grid grid-cols-4 gap-3">
              <Line className="h-4 w-5/6" />
              <Line className="h-4 w-2/3" />
              <Line className="h-4 w-4/5" />
              <Line className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </Surface>
  );
}

function TimelineFixture() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "flex",
            index % 2 === 0 ? "justify-start" : "justify-end"
          )}
        >
          <Surface className="w-[82%] space-y-3 rounded-[1.5rem] p-4 md:w-[68%]">
            <Line className="h-4 w-1/3" />
            <Line className="h-4 w-full" />
            <Line className="h-4 w-2/3" />
          </Surface>
        </div>
      ))}
    </div>
  );
}

function EmbedFixture({ tall = false }: { tall?: boolean }) {
  return (
    <Surface
      className={cn(
        "p-0 overflow-hidden",
        tall ? "min-h-[42rem]" : "min-h-[18rem]"
      )}
    >
      <div className="h-full min-h-inherit bg-[var(--surface-strong)]/40" />
    </Surface>
  );
}

function BookFixture() {
  return (
    <SplitContentFixture
      sidebar={
        <Surface className="space-y-3">
          <Line className="h-5 w-24" />
          {Array.from({ length: 7 }).map((_, index) => (
            <Line key={index} className={cn("h-4", index === 6 ? "w-2/3" : "w-full")} />
          ))}
        </Surface>
      }
      content={
        <>
          <Surface className="space-y-4">
            <Line className="h-8 w-3/5" />
            {Array.from({ length: 6 }).map((_, index) => (
              <Line key={index} className={cn("h-4", index === 5 ? "w-2/3" : "w-full")} />
            ))}
          </Surface>
          <div className="flex justify-between gap-3">
            <ButtonStub className="w-28" />
            <ButtonStub className="w-28" />
          </div>
        </>
      }
    />
  );
}

function AssignmentDetailFixture() {
  return (
    <div className="space-y-4">
      <Surface className="space-y-3">
        <Pill className="w-20" />
        <Line className="h-8 w-2/3" />
        <Line className="h-4 w-full" />
        <Line className="h-4 w-4/5" />
      </Surface>
      <CourseActionGridFixture />
      <Surface className="space-y-4">
        <Line className="h-6 w-1/3" />
        {Array.from({ length: 5 }).map((_, index) => (
          <Line key={index} className={cn("h-4", index === 4 ? "w-1/2" : "w-full")} />
        ))}
        <ButtonStub className="w-36" />
      </Surface>
      <Surface className="space-y-4">
        <Line className="h-6 w-1/3" />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-3">
            <Line className="h-4 w-full" />
            <Line className="h-4 w-5/6" />
            <Line className="h-4 w-4/6" />
          </div>
          <div className="space-y-3">
            <Line className="h-11 w-full rounded-[1rem]" />
            <Line className="h-24 w-full rounded-[1rem]" />
            <ButtonStub className="w-28" />
          </div>
        </div>
      </Surface>
    </div>
  );
}

function ReportsFixture() {
  return (
    <div className="space-y-4">
      <Surface className="space-y-4">
        <Pill className="w-20" />
        <Line className="h-8 w-1/2" />
        <Line className="h-4 w-3/4" />
      </Surface>
      <CourseActionGridFixture />
      <MetricGridFixture />
      <div className="grid gap-4 xl:grid-cols-2">
        <Surface className="space-y-4">
          <Line className="h-6 w-1/3" />
          {Array.from({ length: 5 }).map((_, index) => (
            <Line key={index} className={cn("h-4", index === 4 ? "w-1/2" : "w-full")} />
          ))}
        </Surface>
        <Surface className="space-y-4">
          <Line className="h-6 w-1/3" />
          {Array.from({ length: 5 }).map((_, index) => (
            <Line key={index} className={cn("h-4", index === 4 ? "w-2/3" : "w-full")} />
          ))}
        </Surface>
      </div>
    </div>
  );
}

function CourseDetailFixture() {
  return (
    <div className="space-y-4">
      <Surface className="space-y-4">
        <Pill className="w-24" />
        <Line className="h-8 w-2/3" />
        <Line className="h-4 w-full" />
        <Line className="h-4 w-3/4" />
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="space-y-3">
            <Line className="h-3 w-32" />
            <Line className="h-4 w-full" />
          </div>
          <Surface className="space-y-3 rounded-[1.25rem] bg-[var(--surface-soft)] p-4">
            <Line className="h-3 w-20" />
            <Line className="h-6 w-24" />
          </Surface>
        </div>
      </Surface>
      <CourseActionGridFixture />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Surface key={index} className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-3">
                <Line className="h-5 w-44" />
                <Line className="h-4 w-72 max-w-full" />
              </div>
              <ButtonStub className="w-24" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((__, itemIndex) => (
                <div key={itemIndex} className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--surface-soft)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <Line className="h-4 w-56 max-w-full" />
                      <Line className="h-3 w-40" />
                    </div>
                    <Pill className="w-16" />
                  </div>
                </div>
              ))}
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

function GenericPageFixture(name: BoneyardSkeletonName) {
  switch (name) {
    case "admin-dashboard":
      return (
        <div className="space-y-4">
          <MetricGridFixture />
          <LinkCardGridFixture />
        </div>
      );
    case "admin-cohortes":
    case "admin-cursos":
    case "admin-matriculaciones":
    case "admin-usuarios":
      return (
        <div className="space-y-4">
          <IntroFixture titleWidth="w-64" subtitleWidth="w-72" withPill={false} />
          <SearchBarFixture />
          <ListFixture count={5} compact />
        </div>
      );
    case "admin-cohorte-detail":
      return (
        <SplitContentFixture
          sidebar={
            <>
              <Surface className="space-y-3">
                <Line className="h-6 w-32" />
                <ListFixture count={3} withAvatar compact />
              </Surface>
              <Surface className="space-y-3">
                <Line className="h-5 w-24" />
                <Line className="h-11 w-full rounded-[1rem]" />
                <ButtonStub className="w-full" />
              </Surface>
            </>
          }
          content={
            <>
              <Surface className="space-y-3">
                <Line className="h-8 w-1/2" />
                <Line className="h-4 w-full" />
                <Line className="h-4 w-2/3" />
              </Surface>
              <Surface className="space-y-3">
                <Line className="h-5 w-28" />
                <Line className="h-11 w-full rounded-[1rem]" />
                <Line className="h-24 w-full rounded-[1rem]" />
                <div className="flex justify-end">
                  <ButtonStub className="w-28" />
                </div>
              </Surface>
            </>
          }
        />
      );
    case "dashboard":
      return (
        <div className="space-y-5">
          <AppTopbarFixture />
          <IntroFixture titleWidth="w-64" subtitleWidth="w-72" />
          <CardGridFixture count={6} />
        </div>
      );
    case "course-detail":
      return (
        <div className="space-y-5">
          <AppTopbarFixture />
          <CourseDetailFixture />
        </div>
      );
    case "assignments-page":
      return (
        <div className="space-y-5">
          <AppTopbarFixture />
          <IntroFixture titleWidth="w-48" subtitleWidth="w-80" />
          <CourseActionGridFixture />
          <ListFixture count={4} />
        </div>
      );
    case "assign-detail":
      return (
        <div className="space-y-5">
          <AppTopbarFixture />
          <AssignmentDetailFixture />
        </div>
      );
    case "course-reports":
      return (
        <div className="space-y-5">
          <AppTopbarFixture />
          <ReportsFixture />
        </div>
      );
    case "participants-page":
      return (
        <div className="space-y-5">
          <AppTopbarFixture />
          <IntroFixture titleWidth="w-56" subtitleWidth="w-72" />
          <CourseActionGridFixture />
          <ListFixture count={4} withAvatar />
        </div>
      );
    case "quiz-detail":
      return (
        <div className="space-y-5">
          <AppTopbarFixture />
          <Surface className="space-y-4">
            <Pill className="w-20" />
            <Line className="h-8 w-2/3" />
            <Line className="h-4 w-4/5" />
          </Surface>
          <Surface className="space-y-4">
            <Line className="h-6 w-1/3" />
            {Array.from({ length: 5 }).map((_, index) => (
              <Line key={index} className={cn("h-4", index === 4 ? "w-2/3" : "w-full")} />
            ))}
          </Surface>
          <ListFixture count={4} compact />
        </div>
      );
    case "resource-page":
    case "scorm-page":
      return (
        <div className="space-y-5">
          <AppTopbarFixture />
          <Surface className="space-y-4">
            <Line className="h-8 w-2/3" />
            <Line className="h-4 w-full" />
            <Line className="h-4 w-3/4" />
          </Surface>
          <EmbedFixture tall={name === "scorm-page"} />
        </div>
      );
    case "messages-page":
      return (
        <div className="space-y-5">
          <AppTopbarFixture />
          <IntroFixture titleWidth="w-40" subtitleWidth="w-72" />
          <ListFixture count={5} withAvatar />
        </div>
      );
    case "conversation-detail":
      return (
        <div className="space-y-5">
          <AppTopbarFixture />
          <Surface className="space-y-3">
            <div className="flex items-center gap-4">
              <AvatarStub />
              <div className="flex-1 space-y-2">
                <Line className="h-5 w-40" />
                <Line className="h-4 w-28" />
              </div>
            </div>
          </Surface>
          <TimelineFixture />
          <Surface className="space-y-3">
            <Line className="h-24 w-full rounded-[1rem]" />
            <div className="flex justify-end">
              <ButtonStub className="w-28" />
            </div>
          </Surface>
        </div>
      );
    case "calendar-page":
      return (
        <div className="space-y-5">
          <AppTopbarFixture />
          <IntroFixture titleWidth="w-52" subtitleWidth="w-72" />
          <Surface className="space-y-4">
            <div className="grid grid-cols-7 gap-3">
              {Array.from({ length: 35 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-[1.25rem] bg-[var(--surface-strong)]/55"
                />
              ))}
            </div>
          </Surface>
          <ListFixture count={3} compact />
        </div>
      );
    case "catalog":
      return (
        <div className="space-y-5">
          <PublicHeaderFixture />
          <IntroFixture titleWidth="w-48" subtitleWidth="w-72" withPill={false} />
          <SearchBarFixture />
          <CardGridFixture count={6} />
        </div>
      );
    case "search":
      return (
        <div className="space-y-5">
          <AppTopbarFixture />
          <SearchBarFixture />
          <ListFixture count={4} compact />
        </div>
      );
    case "files":
    case "blog":
    case "contacts":
    case "notifications":
      return (
        <div className="space-y-5">
          <AppTopbarFixture />
          <IntroFixture titleWidth="w-44" subtitleWidth="w-72" />
          <ListFixture count={4} withAvatar={name === "contacts"} />
        </div>
      );
    case "forum-detail":
      return (
        <div className="space-y-5">
          <AppTopbarFixture />
          <IntroFixture titleWidth="w-56" subtitleWidth="w-72" />
          <Surface className="space-y-4">
            <Line className="h-11 w-full rounded-[1rem]" />
            <ButtonStub className="w-32" />
          </Surface>
          <ListFixture count={4} compact />
        </div>
      );
    case "discussion-detail":
      return (
        <div className="space-y-5">
          <AppTopbarFixture />
          <Surface className="space-y-4">
            <Line className="h-8 w-3/4" />
            <div className="flex items-center gap-3">
              <AvatarStub className="size-9" />
              <Line className="h-4 w-32" />
            </div>
            <Line className="h-4 w-full" />
            <Line className="h-4 w-full" />
            <Line className="h-4 w-2/3" />
          </Surface>
          <ListFixture count={3} withAvatar />
        </div>
      );
    case "database-detail":
      return (
        <div className="space-y-5">
          <AppTopbarFixture />
          <IntroFixture titleWidth="w-52" subtitleWidth="w-72" />
          <TableFixture />
        </div>
      );
    case "grades-page":
      return (
        <div className="space-y-5">
          <AppTopbarFixture />
          <IntroFixture titleWidth="w-48" subtitleWidth="w-72" />
          <CourseActionGridFixture />
          <TableFixture rows={8} />
        </div>
      );
    case "competencies":
      return (
        <div className="space-y-5">
          <AppTopbarFixture />
          <IntroFixture titleWidth="w-56" subtitleWidth="w-72" />
          <ListFixture count={4} compact />
        </div>
      );
    case "feedback-detail":
    case "choice-detail":
    case "workshop-detail":
      return (
        <div className="space-y-5">
          <AppTopbarFixture />
          <Surface className="space-y-4">
            <Line className="h-8 w-2/3" />
            <Line className="h-4 w-full" />
            <Line className="h-4 w-4/5" />
          </Surface>
          <Surface className="space-y-4">
            <Line className="h-6 w-1/3" />
            {Array.from({ length: 5 }).map((_, index) => (
              <Line key={index} className={cn("h-10 rounded-[1rem]", index === 4 ? "w-2/3" : "w-full")} />
            ))}
            <ButtonStub className="w-32" />
          </Surface>
        </div>
      );
    case "lti-detail":
    case "h5p-detail":
      return (
        <div className="space-y-5">
          <AppTopbarFixture />
          <Surface className="space-y-4">
            <Line className="h-8 w-2/3" />
            <Line className="h-4 w-full" />
          </Surface>
          <EmbedFixture />
        </div>
      );
    case "glossary-detail":
      return (
        <div className="space-y-5">
          <AppTopbarFixture />
          <IntroFixture titleWidth="w-56" subtitleWidth="w-72" />
          <SearchBarFixture />
          <ListFixture count={4} compact />
        </div>
      );
    case "lesson-detail":
      return (
        <div className="space-y-5">
          <AppTopbarFixture />
          <Surface className="space-y-4">
            <Line className="h-8 w-1/2" />
            {Array.from({ length: 7 }).map((_, index) => (
              <Line key={index} className={cn("h-4", index === 6 ? "w-3/4" : "w-full")} />
            ))}
          </Surface>
          <div className="flex justify-between gap-3">
            <ButtonStub className="w-28" />
            <ButtonStub className="w-28" />
          </div>
        </div>
      );
    case "book-detail":
      return (
        <div className="space-y-5">
          <AppTopbarFixture />
          <BookFixture />
        </div>
      );
    case "settings":
    case "profile":
      return (
        <div className="space-y-5">
          <AppTopbarFixture />
          <IntroFixture titleWidth="w-44" subtitleWidth="w-64" />
          <Surface className="space-y-4">
            <div className="flex items-center gap-4">
              <AvatarStub className="size-16" />
              <div className="flex-1 space-y-3">
                <Line className="h-6 w-40" />
                <Line className="h-4 w-24" />
              </div>
            </div>
          </Surface>
          <ListFixture count={3} compact />
        </div>
      );
    case "wiki-detail":
      return (
        <div className="space-y-5">
          <AppTopbarFixture />
          <Surface className="space-y-4">
            <Line className="h-8 w-2/3" />
            {Array.from({ length: 8 }).map((_, index) => (
              <Line key={index} className={cn("h-4", index === 7 ? "w-2/3" : "w-full")} />
            ))}
          </Surface>
        </div>
      );
    default:
      return (
        <div className="space-y-5">
          <AppTopbarFixture />
          <IntroFixture />
          <ListFixture count={3} />
        </div>
      );
  }
}

export function getBoneyardFixture(name: BoneyardSkeletonName) {
  return GenericPageFixture(name);
}
