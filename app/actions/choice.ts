"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import { sanitizeReturnPath } from "@/lib/safe-redirect";
import { submitChoiceResponse, MoodleApiError } from "@/lib/moodle";
import {
  clearSessionIfAuthenticationError,
  requireSession,
} from "@/lib/session";
import { parseRequiredNumber } from "./validation";

export type ChoiceFormState = {
  error: string | null;
};

export async function submitChoiceAction(
  _previousState: ChoiceFormState,
  formData: FormData
): Promise<ChoiceFormState> {
  const session = await requireSession();

  const choiceId = parseRequiredNumber(formData.get("choiceId"));
  const returnPath = sanitizeReturnPath(formData.get("returnPath") as string | null, "/mis-cursos");

  const rawResponses = formData.getAll("responses");
  const responseIds = rawResponses
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);

  if (responseIds.length === 0) {
    return {
      error: "Selecciona al menos una opcion para votar.",
    };
  }

  try {
    await submitChoiceResponse(session.token, choiceId, responseIds);
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) {
      redirect("/");
    }

    if (error instanceof MoodleApiError) {
      logger.warn("Choice vote submission failed", {
        userId: session.userId,
        choiceId,
        code: error.code,
        error,
      });
    } else {
      logger.error("Unexpected choice vote submission failure", {
        userId: session.userId,
        choiceId,
        error,
      });
    }

    return {
      error:
        error instanceof MoodleApiError
          ? error.message
          : "No se pudo registrar el voto.",
    };
  }

  revalidatePath(returnPath);
  redirect(returnPath);
}
