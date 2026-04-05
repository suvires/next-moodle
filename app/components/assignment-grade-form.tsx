"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  submitAssignmentGradeAction,
  type AssignmentGradeFormState,
} from "@/app/actions/assignment-grading";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";

const initialState: AssignmentGradeFormState = {
  error: null,
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button size="sm" isDisabled={pending}>
      {pending ? "Guardando..." : "Guardar revisión"}
    </Button>
  );
}

type AssignmentGradeFormProps = {
  assignId: number;
  courseId: number;
  userId: number;
  attemptNumber: number;
  returnPath: string;
  initialGrade?: string;
};

export function AssignmentGradeForm({
  assignId,
  courseId,
  userId,
  attemptNumber,
  returnPath,
  initialGrade,
}: AssignmentGradeFormProps) {
  const [state, formAction] = useActionState(
    submitAssignmentGradeAction,
    initialState
  );

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-soft)] p-4">
      <input type="hidden" name="assignId" value={assignId} />
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="attemptNumber" value={attemptNumber} />
      <input type="hidden" name="returnPath" value={returnPath} />

      <div className="grid gap-3 md:grid-cols-[minmax(0,180px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`grade-${assignId}-${userId}-${attemptNumber}`}>
            Nota
          </Label>
          <Input
            id={`grade-${assignId}-${userId}-${attemptNumber}`}
            name="grade"
            type="text"
            inputMode="decimal"
            placeholder="Ej. 8.5"
            defaultValue={initialGrade || ""}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`feedback-${assignId}-${userId}-${attemptNumber}`}>
            Comentario
          </Label>
          <Textarea
            id={`feedback-${assignId}-${userId}-${attemptNumber}`}
            name="feedback"
            className="min-h-24"
            placeholder="Comentario breve para el alumno"
          />
        </div>
      </div>

      {state.error ? (
        <p className="banner-danger">{state.error}</p>
      ) : null}

      {state.success ? (
        <p className="banner-success">Revisión guardada.</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
