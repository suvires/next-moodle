"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { unenrolUserAction } from "@/app/actions/admin";
import { Button } from "@/app/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button variant="outline" size="sm" type="submit" isDisabled={pending}>
      {pending ? "..." : "Desmatricular"}
    </Button>
  );
}

export function UnenrolForm({
  userId,
  courseId,
}: {
  userId: number;
  courseId: number;
}) {
  const [state, formAction] = useActionState(unenrolUserAction, {
    error: null,
    success: false,
  });

  if (state.success) {
    return (
      <span className="chip chip-muted text-xs">Desmatriculado</span>
    );
  }

  return (
    <form action={formAction} className="flex flex-shrink-0 flex-col items-end gap-1">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="courseId" value={courseId} />
      <SubmitButton />
      {state.error && (
        <p className="text-xs text-[var(--danger)]">{state.error}</p>
      )}
    </form>
  );
}
