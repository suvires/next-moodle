"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { removeCohortMemberAction } from "@/app/actions/admin";
import { Button } from "@/app/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button variant="outline" size="sm" type="submit" isDisabled={pending}>
      {pending ? "..." : "Eliminar"}
    </Button>
  );
}

export function RemoveMemberForm({
  cohortId,
  userId,
  supported = true,
}: {
  cohortId: number;
  userId: number;
  supported?: boolean;
}) {
  const [state, formAction] = useActionState(removeCohortMemberAction, {
    error: null,
    success: false,
  });

  if (!supported) {
    return (
      <span className="chip chip-muted text-xs">No disponible</span>
    );
  }

  if (state.success) {
    return <span className="chip chip-muted text-xs">Eliminado</span>;
  }

  return (
    <form action={formAction} className="flex flex-shrink-0 flex-col items-end gap-1">
      <input type="hidden" name="cohortId" value={cohortId} />
      <input type="hidden" name="userId" value={userId} />
      <SubmitButton />
      {state.error && (
        <p className="text-xs text-[var(--danger)]">{state.error}</p>
      )}
    </form>
  );
}
