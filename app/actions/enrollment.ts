"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import { selfEnrolUser, MoodleApiError } from "@/lib/moodle";
import { clearSessionIfAuthenticationError, requireSession } from "@/lib/session";

export type EnrollmentFormState = { error: string | null; success: boolean };

export async function enrollAction(
  _previousState: EnrollmentFormState,
  formData: FormData
): Promise<EnrollmentFormState> {
  const session = await requireSession();

  const rawCourseId = formData.get("courseId");
  const courseId = Number(rawCourseId);

  if (!Number.isInteger(courseId) || courseId <= 0) {
    return { error: "Identificador de curso no válido.", success: false };
  }

  try {
    const result = await selfEnrolUser(session.token, courseId);

    if (!result.status && result.warnings.length > 0) {
      return { error: result.warnings.join(" "), success: false };
    }

    if (!result.status) {
      return {
        error: "No se pudo completar la inscripción. Es posible que el curso no admita inscripción libre.",
        success: false,
      };
    }
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) {
      redirect("/");
    }

    if (error instanceof MoodleApiError) {
      logger.warn("Self-enrollment failed", {
        userId: session.userId,
        courseId,
        code: error.code,
        error,
      });
    } else {
      logger.error("Unexpected self-enrollment failure", {
        userId: session.userId,
        courseId,
        error,
      });
    }

    return {
      error:
        error instanceof MoodleApiError
          ? error.message
          : "No se pudo completar la inscripción.",
      success: false,
    };
  }

  revalidatePath("/mis-cursos");
  return { error: null, success: true };
}
