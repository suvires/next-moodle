"use server";

import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { sendMessage, MoodleApiError } from "@/lib/moodle";
import {
  clearSessionIfAuthenticationError,
  requireSession,
} from "@/lib/session";
import { redirect } from "next/navigation";

export type MessagingFormState = {
  error: string | null;
};

export async function sendMessageAction(
  _previousState: MessagingFormState,
  formData: FormData
): Promise<MessagingFormState> {
  const session = await requireSession();

  const toUserId = Number(formData.get("toUserId"));
  const text = String(formData.get("text") || "").trim();
  const conversationId = String(formData.get("conversationId") || "");

  if (!Number.isInteger(toUserId) || toUserId <= 0) {
    return { error: "Destinatario no válido." };
  }

  if (!text) {
    return { error: "El mensaje no puede estar vacío." };
  }

  try {
    const result = await sendMessage(session.token, toUserId, text);

    if (result.error) {
      return { error: result.error };
    }
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) {
      redirect("/");
    }

    if (error instanceof MoodleApiError) {
      logger.warn("Send message failed", { toUserId, error });
      return { error: error.message };
    }

    logger.error("Unexpected error sending message", { toUserId, error });
    return { error: "No se pudo enviar el mensaje." };
  }

  if (conversationId) {
    revalidatePath(`/mensajes/${conversationId}`);
  }
  revalidatePath("/mensajes");

  return { error: null };
}
