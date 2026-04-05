"use client";

import { useActionState, useOptimistic, startTransition } from "react";
import { toggleCourseVisibilityAction } from "@/app/actions/admin";
import type { AdminActionState } from "@/app/actions/admin";

const initialState: AdminActionState = { error: null, success: false };

export function CourseVisibilityToggle({
  courseId,
  isVisible,
}: {
  courseId: number;
  isVisible: boolean;
}) {
  const [state, formAction] = useActionState(toggleCourseVisibilityAction, initialState);
  const [optimisticVisible, setOptimisticVisible] = useOptimistic(isVisible);

  function handleToggle() {
    const nextVisible = !optimisticVisible;
    startTransition(() => {
      setOptimisticVisible(nextVisible);
      const fd = new FormData();
      fd.set("courseId", String(courseId));
      fd.set("visible", nextVisible ? "1" : "0");
      formAction(fd);
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleToggle}
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
          optimisticVisible
            ? "bg-[var(--success)]/12 text-[var(--success)] hover:bg-[var(--success)]/20"
            : "bg-[var(--surface-strong)] text-[var(--muted)] hover:bg-[var(--line-strong)]/30"
        }`}
      >
        <span
          className={`size-2 rounded-full ${optimisticVisible ? "bg-[var(--success)]" : "bg-[var(--muted)]"}`}
        />
        {optimisticVisible ? "Curso visible" : "Curso oculto"}
      </button>
      {state.error ? (
        <p className="text-xs text-[var(--danger)]">{state.error}</p>
      ) : null}
    </div>
  );
}
