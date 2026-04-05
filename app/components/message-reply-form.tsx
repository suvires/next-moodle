"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  sendMessageAction,
  type MessagingFormState,
} from "@/app/actions/messaging";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";

const initialState: MessagingFormState = {
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button size="sm" isDisabled={pending}>
      {pending ? "Enviando..." : "Enviar"}
    </Button>
  );
}

type MessageReplyFormProps = {
  toUserId: number;
  conversationId: string;
};

export function MessageReplyForm({
  toUserId,
  conversationId,
}: MessageReplyFormProps) {
  const [state, formAction] = useActionState(sendMessageAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="toUserId" value={toUserId} />
      <input type="hidden" name="conversationId" value={conversationId} />

      <Textarea
        name="text"
        className="min-h-20"
        placeholder="Escribe un mensaje"
        required
      />

      {state.error ? (
        <p className="banner-danger">{state.error}</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
