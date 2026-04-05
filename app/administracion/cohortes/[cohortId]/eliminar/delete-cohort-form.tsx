"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { deleteCohortAction } from "@/app/actions/admin";
import { Button } from "@/app/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button variant="primary" type="submit" isDisabled={pending}>
      {pending ? "Eliminando..." : "Eliminar cohorte"}
    </Button>
  );
}

export function DeleteCohortForm({ cohortId }: { cohortId: number }) {
  const [state, formAction] = useActionState(deleteCohortAction, {
    error: null,
    success: false,
  });

  return (
    <form action={formAction}>
      {state.error && (
        <div className="banner-danger mb-4">
          <p>{state.error}</p>
        </div>
      )}
      <input type="hidden" name="cohortId" value={cohortId} />
      <SubmitButton />
    </form>
  );
}
