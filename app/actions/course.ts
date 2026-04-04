"use server";

import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { updateActivityCompletionStatusManually, MoodleApiError } from "@/lib/moodle";
import { clearSessionIfAuthenticationError, requireSession } from "@/lib/session";

export type ManualCompletionState = {
  error: string | null;
  success: boolean;
};

function parseRequiredNumber(rawValue: FormDataEntryValue | null) {
  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Identificador no válido.");
  }

  return parsed;
}

export async function toggleManualCompletionAction(
  _previousState: ManualCompletionState,
  formData: FormData
): Promise<ManualCompletionState> {
  const session = await requireSession();

  const courseModuleId = parseRequiredNumber(formData.get("courseModuleId"));
  const completed = String(formData.get("completed")) === "1";
  const returnPath = String(formData.get("returnPath") || "/mis-cursos");

  try {
    await updateActivityCompletionStatusManually(session.token, courseModuleId, completed);
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) {
      return {
        error: "La sesión ha caducado. Vuelve a iniciar sesión.",
        success: false,
      };
    }

    if (error instanceof MoodleApiError) {
      logger.warn("Manual completion update failed", {
        userId: session.userId,
        courseModuleId,
        completed,
        code: error.code,
        error,
      });
    } else {
      logger.error("Unexpected manual completion update failure", {
        userId: session.userId,
        courseModuleId,
        completed,
        error,
      });
    }

    return {
      error: "No se pudo actualizar la actividad.",
      success: false,
    };
  }

  revalidatePath(returnPath);

  return {
    error: null,
    success: true,
  };
}
