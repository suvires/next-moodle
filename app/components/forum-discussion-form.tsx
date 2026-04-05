"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createForumDiscussionAction,
  type ForumFormState,
} from "@/app/actions/forum";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";

const initialState: ForumFormState = {
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} className="w-full sm:w-auto">
      {pending ? "Publicando..." : "Nuevo hilo"}
    </Button>
  );
}

type ForumDiscussionFormProps = {
  forumId: number;
  returnPath: string;
};

export function ForumDiscussionForm({
  forumId,
  returnPath,
}: ForumDiscussionFormProps) {
  const [state, formAction] = useActionState(
    createForumDiscussionAction,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="forumId" value={forumId} />
      <input type="hidden" name="returnPath" value={returnPath} />

      <div className="flex flex-col gap-2">
        <Label htmlFor={`forum-subject-${forumId}`}>Asunto</Label>
        <Input
          id={`forum-subject-${forumId}`}
          name="subject"
          placeholder="Título del hilo"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`forum-message-${forumId}`}>Mensaje</Label>
        <Textarea
          id={`forum-message-${forumId}`}
          name="message"
          placeholder="Escribe tu mensaje"
          required
        />
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
