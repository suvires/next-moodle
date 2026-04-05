"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  bulkToggleCourseVisibilityAction,
  bulkMoveCoursesCategoryAction,
} from "@/app/actions/admin";
import type { AdminCourse, MoodleCategory } from "@/lib/moodle";

export function CourseBulkList({
  courses,
  categories,
}: {
  courses: AdminCourse[];
  categories: MoodleCategory[];
}) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [moveCategoryId, setMoveCategoryId] = useState<number>(
    categories[0]?.id ?? 0
  );
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; msg: string } | null>(null);

  const sortedCategories = [...categories].sort(
    (a, b) => (a.depth ?? 0) - (b.depth ?? 0) || a.name.localeCompare(b.name, "es")
  );

  const allSelected = courses.length > 0 && selectedIds.size === courses.length;

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(courses.map((c) => c.id)));
    }
  }

  function toggleOne(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearFeedback() {
    setFeedback(null);
  }

  function handleVisibility(visible: boolean) {
    clearFeedback();
    startTransition(async () => {
      const fd = new FormData();
      fd.set("courseIds", JSON.stringify([...selectedIds]));
      fd.set("visible", visible ? "1" : "0");
      const result = await bulkToggleCourseVisibilityAction({ error: null, success: false }, fd);
      if (result.error) {
        setFeedback({ type: "error", msg: result.error });
      } else {
        setFeedback({
          type: "success",
          msg: `${selectedIds.size} ${selectedIds.size === 1 ? "curso actualizado" : "cursos actualizados"}.`,
        });
        setSelectedIds(new Set());
      }
    });
  }

  function handleMoveCategory() {
    if (!moveCategoryId) return;
    clearFeedback();
    startTransition(async () => {
      const fd = new FormData();
      fd.set("courseIds", JSON.stringify([...selectedIds]));
      fd.set("categoryId", String(moveCategoryId));
      const result = await bulkMoveCoursesCategoryAction({ error: null, success: false }, fd);
      if (result.error) {
        setFeedback({ type: "error", msg: result.error });
      } else {
        setFeedback({
          type: "success",
          msg: `${selectedIds.size} ${selectedIds.size === 1 ? "curso movido" : "cursos movidos"} a la categoría.`,
        });
        setSelectedIds(new Set());
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Feedback */}
      {feedback ? (
        <div className={feedback.type === "error" ? "banner-danger" : "banner-info"}>
          <p>{feedback.msg}</p>
        </div>
      ) : null}

      {/* Bulk action bar */}
      {selectedIds.size > 0 ? (
        <div className="sticky top-4 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow)]">
          <span className="text-sm font-semibold text-[var(--foreground)]">
            {selectedIds.size} {selectedIds.size === 1 ? "curso seleccionado" : "cursos seleccionados"}
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleVisibility(true)}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--success)]/12 px-3 py-1.5 text-xs font-semibold text-[var(--success)] transition hover:bg-[var(--success)]/20 disabled:opacity-50"
            >
              Hacer visibles
            </button>
            <button
              type="button"
              onClick={() => handleVisibility(false)}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)] transition hover:bg-[var(--line)] disabled:opacity-50"
            >
              Hacer ocultos
            </button>
          </div>

          {sortedCategories.length > 0 ? (
            <div className="flex items-center gap-2">
              <select
                value={moveCategoryId}
                onChange={(e) => setMoveCategoryId(Number(e.target.value))}
                disabled={isPending}
                className="h-8 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 text-xs text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none disabled:opacity-50"
              >
                {sortedCategories.map((cat) => {
                  const depth = (cat.depth ?? 1) - 1;
                  const prefix = depth > 0 ? "  ".repeat(depth) + "└ " : "";
                  return (
                    <option key={cat.id} value={cat.id}>
                      {prefix}{cat.name}
                    </option>
                  );
                })}
              </select>
              <button
                type="button"
                onClick={handleMoveCategory}
                disabled={isPending || !moveCategoryId}
                className="inline-flex items-center rounded-full bg-[var(--warning)]/12 px-3 py-1.5 text-xs font-semibold text-[var(--warning)] transition hover:bg-[var(--warning)]/20 disabled:opacity-50"
              >
                Mover
              </button>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            Cancelar
          </button>
        </div>
      ) : null}

      {/* Select-all row */}
      <div className="flex items-center gap-2 px-1">
        <input
          type="checkbox"
          id="select-all"
          checked={allSelected}
          onChange={toggleAll}
          className="h-4 w-4 rounded accent-[var(--accent)]"
        />
        <label htmlFor="select-all" className="text-xs text-[var(--muted)] cursor-pointer select-none">
          {allSelected ? "Deseleccionar todos" : `Seleccionar todos (${courses.length})`}
        </label>
      </div>

      {/* Course grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => {
          const isSelected = selectedIds.has(course.id);
          return (
            <div
              key={course.id}
              className={`surface-card relative flex flex-col gap-3 rounded-xl p-5 transition ${
                isSelected ? "ring-2 ring-[var(--accent)]" : ""
              }`}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                aria-label={`Seleccionar ${course.fullname}`}
                checked={isSelected}
                onChange={() => toggleOne(course.id)}
                className="absolute right-4 top-4 h-4 w-4 rounded accent-[var(--accent)]"
              />

              <div className="flex flex-wrap items-center gap-2 pr-6">
                <span className="chip chip-muted">{course.shortname}</span>
                <span className={course.visible ? "chip chip-success" : "chip chip-warning"}>
                  {course.visible ? "Visible" : "Oculto"}
                </span>
                {course.categoryName ? (
                  <span className="chip chip-muted">{course.categoryName}</span>
                ) : null}
              </div>

              <Link
                href={`/administracion/cursos/${course.id}`}
                className="font-semibold leading-snug text-[var(--foreground)] hover:underline"
              >
                {course.fullname}
              </Link>

              {course.enrolledUserCount !== undefined ? (
                <p className="text-xs text-[var(--muted)]">
                  {course.enrolledUserCount.toLocaleString("es-ES")} matriculados
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
