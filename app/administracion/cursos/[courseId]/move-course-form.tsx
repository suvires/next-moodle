"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { moveCourseAction } from "@/app/actions/admin";
import type { MoodleCategory } from "@/lib/moodle";
import { Button } from "@/app/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button variant="primary" type="submit" isDisabled={pending}>
      {pending ? "Moviendo..." : "Mover a categoría"}
    </Button>
  );
}

export function MoveCourseForm({
  courseId,
  currentCategoryId,
  categories,
}: {
  courseId: number;
  currentCategoryId?: number;
  categories: MoodleCategory[];
}) {
  const [state, formAction] = useActionState(moveCourseAction, {
    error: null,
    success: false,
  });

  const sorted = [...categories].sort(
    (a, b) => (a.depth ?? 0) - (b.depth ?? 0) || a.name.localeCompare(b.name, "es")
  );

  if (sorted.length === 0) return null;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? <div className="banner-danger"><p>{state.error}</p></div> : null}
      {state.success ? <div className="banner-info"><p>Curso movido correctamente.</p></div> : null}

      <input type="hidden" name="courseId" value={courseId} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="move-categoryId" className="text-xs font-medium text-[var(--muted)]">
          Categoría de destino
        </label>
        <select
          id="move-categoryId"
          name="categoryId"
          defaultValue={currentCategoryId ?? sorted[0]?.id}
          className="h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] transition hover:border-[var(--line-strong)] focus:border-[var(--foreground)] focus:outline-none"
        >
          {sorted.map((cat) => {
            const depth = (cat.depth ?? 1) - 1;
            const prefix = depth > 0 ? "  ".repeat(depth) + "└ " : "";
            return (
              <option key={cat.id} value={cat.id}>
                {prefix}{cat.name}
              </option>
            );
          })}
        </select>
      </div>

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
