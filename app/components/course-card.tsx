"use client";

import { Chip } from "@heroui/react";
import { Card, CardContent } from "@/app/components/ui/card";
import { RichHtml } from "@/app/components/rich-html";
import { Separator } from "@/app/components/ui/separator";

type CourseCardProps = {
  course: {
    id: number;
    fullname: string;
    categoryName?: string;
    summary?: string;
    enrolledUsersCount?: number;
  };
  action?: React.ReactNode;
  animationDelay?: number;
};

export function CourseCard({ course, action, animationDelay }: CourseCardProps) {
  return (
    <Card
      className="animate-rise-in rounded-xl transition duration-300"
      style={animationDelay !== undefined ? { animationDelay: `${animationDelay}ms` } : undefined}
    >
      <CardContent className="flex h-full flex-col px-5 py-5">
        <h2 className="text-base font-semibold leading-snug text-[var(--color-foreground)]">
          {course.fullname}
        </h2>

        {course.categoryName ? (
          <Chip size="sm" variant="soft" className="mt-1">{course.categoryName}</Chip>
        ) : null}

        {course.enrolledUsersCount ? (
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            {course.enrolledUsersCount}{" "}
            {course.enrolledUsersCount === 1 ? "estudiante inscrito" : "estudiantes inscritos"}
          </p>
        ) : null}

        {course.summary ? (
          <>
            <Separator className="my-4" />
            <RichHtml
              html={course.summary}
              className="line-clamp-3 text-sm leading-relaxed text-[var(--color-muted)]"
            />
          </>
        ) : null}

        {action ? (
          <div className="mt-auto pt-4">{action}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
