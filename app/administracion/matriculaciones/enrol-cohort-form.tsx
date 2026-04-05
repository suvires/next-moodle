"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { enrollCohortAction } from "@/app/actions/admin";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import type { MoodleCohort } from "@/lib/moodle";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button variant="primary" type="submit" isDisabled={pending}>
      {pending ? "Matriculando..." : "Matricular cohorte"}
    </Button>
  );
}

export function EnrolCohortForm({
  courseId,
  cohorts,
}: {
  courseId: number;
  cohorts: MoodleCohort[];
}) {
  const [state, formAction] = useActionState(enrollCohortAction, {
    error: null,
    success: false,
  });

  if (cohorts.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">
        No hay cohortes disponibles en la plataforma.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <div className="banner-danger">
          <p>{state.error}</p>
        </div>
      )}
      {state.success && (
        <div className="banner-info">
          <p>Cohorte matriculada correctamente. Los usuarios de la cohorte ahora tienen acceso al curso.</p>
        </div>
      )}

      <input type="hidden" name="courseId" value={courseId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="enrol-cohortId">Cohorte</Label>
          <select
            id="enrol-cohortId"
            name="cohortId"
            required
            className="h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] transition hover:border-[var(--line-strong)] focus:border-[var(--foreground)] focus:outline-none"
          >
            <option value="">Selecciona una cohorte…</option>
            {cohorts.map((cohort) => (
              <option key={cohort.id} value={cohort.id}>
                {cohort.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="enrol-cohort-roleId">
            ID de rol <span className="text-[var(--muted)]">(5 = alumno)</span>
          </Label>
          <input
            id="enrol-cohort-roleId"
            name="roleId"
            type="number"
            min={1}
            defaultValue={5}
            className="h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] transition hover:border-[var(--line-strong)] focus:border-[var(--foreground)] focus:outline-none"
          />
        </div>
      </div>

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
