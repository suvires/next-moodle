"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  submitChoiceAction,
  type ChoiceFormState,
} from "@/app/actions/choice";
import { Button } from "@/app/components/ui/button";

const initialState: ChoiceFormState = {
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button size="sm" disabled={pending}>
      {pending ? "Enviando..." : "Votar"}
    </Button>
  );
}

type ChoiceVoteFormProps = {
  choiceId: number;
  options: { id: number; text: string }[];
  allowMultiple: boolean;
  returnPath: string;
};

export function ChoiceVoteForm({
  choiceId,
  options,
  allowMultiple,
  returnPath,
}: ChoiceVoteFormProps) {
  const [state, formAction] = useActionState(submitChoiceAction, initialState);
  const inputType = allowMultiple ? "checkbox" : "radio";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="choiceId" value={choiceId} />
      <input type="hidden" name="returnPath" value={returnPath} />

      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-sm text-[var(--color-foreground)] transition-colors hover:bg-white/4"
          >
            <input
              type={inputType}
              name="responses"
              value={option.id}
              className="accent-[var(--color-accent)]"
            />
            {option.text}
          </label>
        ))}
      </div>

      {state.error ? (
        <p className="rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
