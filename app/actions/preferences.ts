"use server";

import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { setUserPreferences, MoodleApiError } from "@/lib/moodle";
import {
  clearSessionIfAuthenticationError,
  requireSession,
} from "@/lib/session";
import { redirect } from "next/navigation";

export type PreferencesFormState = {
  error: string | null;
  success: boolean;
};

export async function updatePreferencesAction(
  _previousState: PreferencesFormState,
  formData: FormData
): Promise<PreferencesFormState> {
  const session = await requireSession();

  const entries: Array<{ name: string; value: string }> = [];

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("pref_") && typeof value === "string") {
      entries.push({ name: key.slice(5), value });
    }
  }

  if (entries.length === 0) {
    return { error: "No hay preferencias para guardar.", success: false };
  }

  try {
    await setUserPreferences(session.token, session.userId, entries);
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) {
      redirect("/");
    }

    if (error instanceof MoodleApiError) {
      logger.warn("Update preferences failed", { error });
      return { error: error.message, success: false };
    }

    logger.error("Unexpected error updating preferences", { error });
    return { error: "No se pudieron guardar las preferencias.", success: false };
  }

  revalidatePath("/ajustes");

  return { error: null, success: true };
}
