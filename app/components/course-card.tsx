"use client";

import Image from "next/image";
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
    courseImageUrl?: string;
  };
  action?: React.ReactNode;
  animationDelay?: number;
};

export function CourseCard({ course, action, animationDelay }: CourseCardProps) {
  const proxyImageUrl = course.courseImageUrl
    ? `/api/moodle-course-image?url=${encodeURIComponent(course.courseImageUrl)}`
    : undefined;

  return (
    <Card
      className="animate-rise-in overflow-hidden rounded-xl transition duration-300"
      style={animationDelay !== undefined ? { animationDelay: `${animationDelay}ms` } : undefined}
    >
      {proxyImageUrl ? (
        <div className="relative h-36 w-full bg-[var(--surface-strong)]">
          <Image
            src={proxyImageUrl}
            alt={course.fullname}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : null}

      <CardContent className="flex h-full flex-col px-5 py-5">
        {course.categoryName ? (
          <Chip size="sm" variant="soft" className="mb-2 self-start">{course.categoryName}</Chip>
        ) : null}

        <h2 className="text-base font-semibold leading-snug text-[var(--color-foreground)]">
          {course.fullname}
        </h2>

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
