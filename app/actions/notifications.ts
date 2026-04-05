"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import {
  getUnsupportedMoodleFeatureMessage,
  resolveMoodleFeatureSupport,
} from "@/lib/moodle-feature-support";
import { getSiteInfo, markAllNotificationsAsRead } from "@/lib/moodle";
import { clearSessionIfAuthenticationError, requireSession } from "@/lib/session";

export async function markAllNotificationsReadAction(): Promise<void> {
  const session = await requireSession();
  try {
    const siteInfo = await getSiteInfo(session.token);

    if (
      !resolveMoodleFeatureSupport(siteInfo.functions).notificationsMarkAllRead
    ) {
      logger.warn("Mark-all-notifications action skipped: unsupported by site", {
        feature: "notificationsMarkAllRead",
        reason: getUnsupportedMoodleFeatureMessage("notificationsMarkAllRead"),
      });
      revalidatePath("/notificaciones");
      return;
    }

    await markAllNotificationsAsRead(session.token, session.userId);
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) {
      redirect("/");
    }
    logger.error("Failed to mark notifications as read", { error });
  }
  revalidatePath("/notificaciones");
}
