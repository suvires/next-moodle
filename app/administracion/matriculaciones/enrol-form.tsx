"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { enrolUserAction } from "@/app/actions/admin";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button variant="primary" type="submit" isDisabled={pending}>
      {pending ? "Matriculando..." : "Matricular usuario"}
    </Button>
  );
}

export function EnrolForm({ courseId }: { courseId: number }) {
  const [state, formAction] = useActionState(enrolUserAction, {
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
          <p>Usuario matriculado correctamente.</p>
        </div>
      )}

      <input type="hidden" name="courseId" value={courseId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="enrol-userId">ID de usuario</Label>
          <Input
            id="enrol-userId"
            name="userId"
            type="number"
            min={1}
            placeholder="Ej: 42"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="enrol-roleId">
            ID de rol{" "}
            <span className="text-[var(--muted)]">(5 = alumno)</span>
          </Label>
          <Input
            id="enrol-roleId"
            name="roleId"
            type="number"
            min={1}
            defaultValue={5}
          />
        </div>
      </div>

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
