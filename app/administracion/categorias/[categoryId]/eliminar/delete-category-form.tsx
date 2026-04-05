"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { deleteCategoryAction } from "@/app/actions/admin";
import { Button } from "@/app/components/ui/button";
import type { AdminActionState } from "@/app/actions/admin";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button variant="primary" type="submit" isDisabled={pending} className="bg-[var(--danger)] hover:bg-[var(--danger)]">
      {pending ? "Eliminando..." : "Confirmar eliminación"}
    </Button>
  );
}

export function DeleteCategoryForm({
  categoryId,
  categoryName,
}: {
  categoryId: number;
  categoryName: string;
}) {
  const [state, formAction] = useActionState(
    deleteCategoryAction,
    { error: null, success: false } as AdminActionState
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error && <div className="banner-danger"><p>{state.error}</p></div>}

      <input type="hidden" name="categoryId" value={categoryId} />

      <p className="text-sm text-[var(--muted)]">
        Vas a eliminar la categoría <span className="font-semibold text-[var(--foreground)]">{categoryName}</span>. Esta acción es permanente e irreversible.
      </p>

      <SubmitButton />
    </form>
  );
}
