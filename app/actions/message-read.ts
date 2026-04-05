"use server";

import { logger } from "@/lib/logger";
import { markMessageRead, MoodleApiError } from "@/lib/moodle";
import { clearSessionIfAuthenticationError, requireSession } from "@/lib/session";
import { redirect } from "next/navigation";

export async function markMessageReadAction(messageId: number): Promise<void> {
  const session = await requireSession();
  try {
    await markMessageRead(session.token, messageId);
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) {
      redirect("/");
    }
    logger.error("Failed to mark message as read", { messageId, error });
  }
}
