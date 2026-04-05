"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import {
  MoodleApiError,
  resolveUserAccessProfile,
  saveAssignmentGrade,
} from "@/lib/moodle";
import { sanitizeReturnPath } from "@/lib/safe-redirect";
import {
  clearSessionIfAuthenticationError,
  requireSession,
} from "@/lib/session";
import { toHtmlMessage } from "./formatting";
import { parseRequiredNumber } from "./validation";

export type AssignmentGradeFormState = {
  error: string | null;
  success: boolean;
};

export async function submitAssignmentGradeAction(
  _previousState: AssignmentGradeFormState,
  formData: FormData
): Promise<AssignmentGradeFormState> {
  const session = await requireSession();

  const assignId = parseRequiredNumber(formData.get("assignId"));
  const courseId = parseRequiredNumber(formData.get("courseId"));
  const userId = parseRequiredNumber(formData.get("userId"));
  const attemptNumber = Number(formData.get("attemptNumber") || -1);
  const grade = String(formData.get("grade") || "").trim();
  const feedback = String(formData.get("feedback") || "").trim();
  const returnPath = sanitizeReturnPath(
    formData.get("returnPath") as string | null,
    "/mis-cursos"
  );

  if (!grade) {
    return {
      error: "Indica una nota para guardar la revisión.",
      success: false,
    };
  }

  const accessProfile = await resolveUserAccessProfile(
    session.token,
    session.userId
  ).catch(() => null);
  const courseAccess = accessProfile?.courseCapabilities.find(
    (course) => course.courseId === courseId
  );

  if (!courseAccess || courseAccess.roleBucket === "student") {
    return {
      error: "Tu cuenta no puede calificar esta tarea desde la app.",
      success: false,
    };
  }

  try {
    await saveAssignmentGrade(session.token, {
      assignId,
      userId,
      grade,
      feedbackHtml: feedback ? toHtmlMessage(feedback) : undefined,
      attemptNumber:
        Number.isInteger(attemptNumber) && attemptNumber >= 0
          ? attemptNumber
          : -1,
    });
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) {
      redirect("/");
    }

    if (error instanceof MoodleApiError) {
      logger.warn("Assignment grading failed", {
        userId: session.userId,
        assignId,
        gradedUserId: userId,
        code: error.code,
        error,
      });
    } else {
      logger.error("Unexpected assignment grading failure", {
        userId: session.userId,
        assignId,
        gradedUserId: userId,
        error,
      });
    }

    return {
      error:
        error instanceof MoodleApiError
          ? error.message
          : "No se pudo guardar la revisión.",
      success: false,
    };
  }

  revalidatePath(returnPath);

  return {
    error: null,
    success: true,
  };
}
