"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import { sanitizeReturnPath } from "@/lib/safe-redirect";
import { saveAssignmentSubmission, MoodleApiError } from "@/lib/moodle";
import {
  clearSessionIfAuthenticationError,
  requireSession,
} from "@/lib/session";
import { parseRequiredNumber } from "./validation";
import { toHtmlMessage } from "./formatting";

export type SubmissionFormState = { error: string | null; success: boolean };

export async function submitAssignmentAction(
  _previousState: SubmissionFormState,
  formData: FormData
): Promise<SubmissionFormState> {
  const session = await requireSession();

  const assignId = parseRequiredNumber(formData.get("assignId"));
  const onlineText = String(formData.get("onlineText") || "").trim();
  const returnPath = sanitizeReturnPath(formData.get("returnPath") as string | null, "/mis-cursos");

  if (!onlineText) {
    return {
      error: "Escribe el contenido de tu entrega para continuar.",
      success: false,
    };
  }

  try {
    await saveAssignmentSubmission(
      session.token,
      assignId,
      toHtmlMessage(onlineText)
    );
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) {
      redirect("/");
    }

    if (error instanceof MoodleApiError) {
      logger.warn("Assignment submission failed", {
        userId: session.userId,
        assignId,
        code: error.code,
        error,
      });
    } else {
      logger.error("Unexpected assignment submission failure", {
        userId: session.userId,
        assignId,
        error,
      });
    }

    return {
      error:
        error instanceof MoodleApiError
          ? error.message
          : "No se pudo enviar la entrega.",
      success: false,
    };
  }

  revalidatePath(returnPath);
  return { error: null, success: true };
}
