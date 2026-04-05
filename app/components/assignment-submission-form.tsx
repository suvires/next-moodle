"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  submitAssignmentAction,
  type SubmissionFormState,
} from "@/app/actions/submission";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";

const initialState: SubmissionFormState = {
  error: null,
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button size="sm" isDisabled={pending}>
      {pending ? "Enviando..." : "Enviar entrega"}
    </Button>
  );
}

type AssignmentSubmissionFormProps = {
  assignId: number;
  returnPath: string;
};

export function AssignmentSubmissionForm({
  assignId,
  returnPath,
}: AssignmentSubmissionFormProps) {
  const [state, formAction] = useActionState(submitAssignmentAction, initialState);

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3">
      <input type="hidden" name="assignId" value={assignId} />
      <input type="hidden" name="returnPath" value={returnPath} />

      <div className="flex flex-col gap-2">
        <Label htmlFor={`submission-${assignId}`}>Texto de la entrega</Label>
        <Textarea
          id={`submission-${assignId}`}
          name="onlineText"
          className="min-h-28"
          placeholder="Escribe tu entrega"
          required
        />
      </div>

      {state.error ? (
        <p className="banner-danger">{state.error}</p>
      ) : null}

      {state.success ? (
        <p className="banner-success">Entrega enviada.</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
