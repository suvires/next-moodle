"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addCohortMemberAction } from "@/app/actions/admin";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button variant="primary" type="submit" isDisabled={pending}>
      {pending ? "Añadiendo..." : "Añadir miembro"}
    </Button>
  );
}

export function AddMemberForm({ cohortId }: { cohortId: number }) {
  const [state, formAction] = useActionState(addCohortMemberAction, {
    error: null,
    success: false,
  });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <div className="banner-danger">
          <p>{state.error}</p>
        </div>
      )}
      {state.success && (
        <div className="banner-info">
          <p>Miembro añadido correctamente.</p>
        </div>
      )}

      <input type="hidden" name="cohortId" value={cohortId} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="add-userId">ID de usuario</Label>
        <Input
          id="add-userId"
          name="userId"
          type="number"
          min={1}
          placeholder="Ej: 42"
          required
        />
      </div>

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
