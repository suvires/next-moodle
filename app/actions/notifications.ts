"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import { markAllNotificationsAsRead, MoodleApiError } from "@/lib/moodle";
import { clearSessionIfAuthenticationError, requireSession } from "@/lib/session";

export async function markAllNotificationsReadAction(): Promise<void> {
  const session = await requireSession();
  try {
    await markAllNotificationsAsRead(session.token, session.userId);
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) {
      redirect("/");
    }
    logger.error("Failed to mark notifications as read", { error });
  }
  revalidatePath("/notificaciones");
}
