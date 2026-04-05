"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { deleteCourseAction } from "@/app/actions/admin";
import { Button } from "@/app/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button variant="primary" type="submit" isDisabled={pending}>
      {pending ? "Eliminando..." : "Eliminar curso"}
    </Button>
  );
}

export function DeleteCourseForm({ courseId }: { courseId: number }) {
  const [state, formAction] = useActionState(deleteCourseAction, {
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
      <input type="hidden" name="courseId" value={courseId} />
      <SubmitButton />
    </form>
  );
}
