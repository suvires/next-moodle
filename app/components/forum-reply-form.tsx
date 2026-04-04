"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createForumReplyAction,
  type ForumFormState,
} from "@/app/actions/forum";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";

const initialState: ForumFormState = {
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button size="sm" disabled={pending}>
      {pending ? "Enviando..." : "Responder"}
    </Button>
  );
}

type ForumReplyFormProps = {
  postId: number;
  subject: string;
  returnPath: string;
};

export function ForumReplyForm({
  postId,
  subject,
  returnPath,
}: ForumReplyFormProps) {
  const [state, formAction] = useActionState(createForumReplyAction, initialState);

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="subject" value={subject} />
      <input type="hidden" name="returnPath" value={returnPath} />

      <div className="flex flex-col gap-2">
        <Label htmlFor={`reply-${postId}`}>Respuesta</Label>
        <Textarea
          id={`reply-${postId}`}
          name="message"
          className="min-h-28"
          placeholder="Escribe tu respuesta"
          required
        />
      </div>

      {state.error ? (
        <p className="rounded-[1rem] border border-[rgba(255,124,124,0.24)] bg-[rgba(255,124,124,0.08)] px-4 py-3 text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
