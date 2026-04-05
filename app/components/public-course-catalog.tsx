"use client";

import { startTransition, useDeferredValue, useState } from "react";
import { Pagination } from "@heroui/react";
import { CourseCard } from "@/app/components/course-card";
import { Input } from "@/app/components/ui/input";
import type { MoodleCatalogCourse } from "@/lib/moodle";
import { cn } from "@/lib/utils"; // used for section className

type PublicCourseCatalogProps = {
  courses: MoodleCatalogCourse[];
  initialQuery?: string;
  pageSize?: number;
  className?: string;
  showSearchLabel?: boolean;
};

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function stripHtml(html?: string) {
  if (!html) {
    return "";
  }

  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function PublicCourseCatalog({
  courses,
  initialQuery = "",
  pageSize = 8,
  className,
  showSearchLabel = false,
}: PublicCourseCatalogProps) {
  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = normalizeSearchText(deferredQuery);

  const filteredCourses = courses.filter((course) => {
    if (!normalizedQuery) {
      return true;
    }

    const haystack = normalizeSearchText(
      [
        course.fullname,
        course.shortname,
        course.categoryName,
        stripHtml(course.summary),
      ]
        .filter(Boolean)
        .join(" ")
    );

    return haystack.includes(normalizedQuery);
  });

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const visibleCourses = filteredCourses.slice(pageStart, pageStart + pageSize);

  return (
    <section className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-3">
        {showSearchLabel ? (
          <label
            htmlFor="public-course-search"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]"
          >
            Buscar cursos
          </label>
        ) : null}
        <Input
          id="public-course-search"
          type="search"
          value={query}
          placeholder="Buscar cursos, áreas o palabras clave..."
          className="h-11"
          onChange={(event) => {
            const nextQuery = event.target.value;

            startTransition(() => {
              setQuery(nextQuery);
              setPage(1);
            });
          }}
        />
      </div>

      {visibleCourses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {visibleCourses.map((course, index) => (
            <CourseCard
              key={course.id}
              course={course}
              animationDelay={index * 40}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-[var(--line)] px-4 py-8 text-center text-sm text-[var(--muted)]">
          {normalizedQuery
            ? "No hay coincidencias con esa búsqueda."
            : "No hay cursos públicos visibles en este momento."}
        </p>
      )}

      {filteredCourses.length > pageSize ? (
        <Pagination className="justify-center">
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.Previous
                isDisabled={currentPage === 1}
                onPress={() => startTransition(() => setPage((p) => Math.max(1, p - 1)))}
              >
                <Pagination.PreviousIcon />
                <span>Anterior</span>
              </Pagination.Previous>
            </Pagination.Item>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Pagination.Item key={p}>
                <Pagination.Link
                  isActive={p === currentPage}
                  onPress={() => startTransition(() => setPage(p))}
                >
                  {p}
                </Pagination.Link>
              </Pagination.Item>
            ))}
            <Pagination.Item>
              <Pagination.Next
                isDisabled={currentPage >= totalPages}
                onPress={() => startTransition(() => setPage((p) => Math.min(totalPages, p + 1)))}
              >
                <span>Siguiente</span>
                <Pagination.NextIcon />
              </Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination>
      ) : null}
    </section>
  );
}
