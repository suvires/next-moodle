"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateCohortAction } from "@/app/actions/admin";
import type { MoodleCohort } from "@/lib/moodle";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button variant="primary" type="submit" isDisabled={pending}>
      {pending ? "Guardando..." : "Guardar cambios"}
    </Button>
  );
}

export function EditCohortForm({ cohort }: { cohort: MoodleCohort }) {
  const [state, formAction] = useActionState(updateCohortAction, {
    error: null,
    success: false,
  });

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error && (
        <div className="banner-danger">
          <p>{state.error}</p>
        </div>
      )}
      {state.success && (
        <div className="banner-info">
          <p>Cambios guardados correctamente.</p>
        </div>
      )}

      <input type="hidden" name="cohortId" value={cohort.id} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          name="name"
          defaultValue={cohort.name}
          placeholder="Nombre de la cohorte"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="idNumber">Identificador</Label>
        <Input
          id="idNumber"
          name="idNumber"
          defaultValue={cohort.idNumber ?? ""}
          placeholder="Identificador único (opcional)"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={cohort.description ?? ""}
          placeholder="Descripción de la cohorte"
          rows={3}
        />
      </div>

      <div className="flex items-center gap-2.5 pt-1">
        <input
          id="visible"
          name="visible"
          type="checkbox"
          value="1"
          defaultChecked={cohort.visible}
          className="h-4 w-4 rounded accent-[var(--accent)]"
        />
        <Label htmlFor="visible">Visible</Label>
      </div>

      {/* Hidden fallback for visible=0 when unchecked */}
      <input type="hidden" name="visible" value="0" />

      <div className="pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}
