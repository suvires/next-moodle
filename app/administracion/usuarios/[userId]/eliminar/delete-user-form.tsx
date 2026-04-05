"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { deleteUserAction } from "@/app/actions/admin";
import { Button } from "@/app/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button variant="danger" type="submit" isDisabled={pending}>
      {pending ? "Eliminando..." : "Sí, eliminar usuario"}
    </Button>
  );
}

export function DeleteUserForm({ userId }: { userId: number }) {
  const [state, formAction] = useActionState(deleteUserAction, {
    error: null,
    success: false,
  });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="userId" value={userId} />

      {state.error && (
        <div className="banner-danger">
          <p>{state.error}</p>
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
