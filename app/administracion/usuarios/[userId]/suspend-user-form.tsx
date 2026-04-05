"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { suspendUserAction } from "@/app/actions/admin";
import { Button } from "@/app/components/ui/button";

function SubmitButton({ suspended }: { suspended: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      variant={suspended ? "primary" : "outline"}
      size="sm"
      type="submit"
      isDisabled={pending}
    >
      {pending
        ? "Procesando..."
        : suspended
          ? "Reactivar usuario"
          : "Suspender usuario"}
    </Button>
  );
}

export function SuspendUserForm({
  userId,
  suspended,
}: {
  userId: number;
  suspended: boolean;
}) {
  const [state, formAction] = useActionState(suspendUserAction, {
    error: null,
    success: false,
  });

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="suspend" value={suspended ? "0" : "1"} />

      {state.error && (
        <div className="banner-danger">
          <p>{state.error}</p>
        </div>
      )}

      {state.success && (
        <div className="banner-info">
          <p>
            {suspended
              ? "Usuario reactivado correctamente."
              : "Usuario suspendido correctamente."}
          </p>
        </div>
      )}

      <SubmitButton suspended={suspended} />
    </form>
  );
}
