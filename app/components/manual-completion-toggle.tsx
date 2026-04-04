"use client";

import { useActionState, useEffect } from "react";
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
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
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

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

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
