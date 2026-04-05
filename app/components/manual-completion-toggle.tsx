"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  toggleManualCompletionAction,
  type ManualCompletionState,
} from "@/app/actions/course";
import { Button } from "@/app/components/ui/button";

type ManualCompletionToggleProps = {
  courseModuleId: number;
  isCompleted: boolean;
  returnPath: string;
};

const initialState: ManualCompletionState = {
  error: null,
  success: false,
};

function SubmitButton({ isCompleted }: { isCompleted: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="outline" size="sm" isDisabled={pending}>
      {pending
        ? "Guardando..."
        : isCompleted
          ? "Marcar pendiente"
          : "Marcar hecha"}
    </Button>
  );
}

export function ManualCompletionToggle({
  courseModuleId,
  isCompleted,
  returnPath,
}: ManualCompletionToggleProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    toggleManualCompletionAction,
    initialState
  );
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (state.success) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
        router.refresh();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [router, state.success]);

  if (showSuccess) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--success)]/12 px-3 py-1.5 text-xs font-semibold text-[var(--success)]">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {isCompleted ? "Marcada pendiente" : "¡Completada!"}
      </span>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <input type="hidden" name="courseModuleId" value={courseModuleId} />
      <input type="hidden" name="completed" value={isCompleted ? "0" : "1"} />
      <input type="hidden" name="returnPath" value={returnPath} />
      <SubmitButton isCompleted={isCompleted} />
      {state.error ? (
        <p className="text-xs leading-5 text-[var(--color-danger)]">{state.error}</p>
      ) : null}
    </form>
  );
}
