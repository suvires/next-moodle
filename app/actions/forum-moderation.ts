"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import {
  deleteForumPost,
  MoodleApiError,
  resolveUserAccessProfile,
  setForumDiscussionLockState,
  setForumDiscussionPinState,
} from "@/lib/moodle";
import { sanitizeReturnPath } from "@/lib/safe-redirect";
import {
  clearSessionIfAuthenticationError,
  requireSession,
} from "@/lib/session";
import { parseRequiredNumber } from "./validation";

type ForumModerationState = {
  error: string | null;
};

async function requireForumModerationAccess(
  token: string,
  userId: number,
  courseId: number
) {
  const accessProfile = await resolveUserAccessProfile(token, userId).catch(
    () => null
  );
  const courseAccess = accessProfile?.courseCapabilities.find(
    (course) => course.courseId === courseId
  );

  return Boolean(
    courseAccess &&
      (courseAccess.roleBucket === "editing_teacher" ||
        courseAccess.roleBucket === "course_manager")
  );
}

export async function moderateForumDiscussionAction(
  _previousState: ForumModerationState,
  formData: FormData
): Promise<ForumModerationState> {
  const session = await requireSession();

  const courseId = parseRequiredNumber(formData.get("courseId"));
  const forumId = parseRequiredNumber(formData.get("forumId"));
  const discussionId = parseRequiredNumber(formData.get("discussionId"));
  const postId = parseRequiredNumber(formData.get("postId"));
  const intent = String(formData.get("intent") || "").trim();
  const returnPath = sanitizeReturnPath(
    formData.get("returnPath") as string | null,
    `/foros/${forumId}`
  );

  const canModerate = await requireForumModerationAccess(
    session.token,
    session.userId,
    courseId
  );

  if (!canModerate) {
    return {
      error: "Tu cuenta no puede moderar esta discusión desde la app.",
    };
  }

  try {
    if (intent === "pin") {
      await setForumDiscussionPinState(session.token, discussionId, true);
    } else if (intent === "unpin") {
      await setForumDiscussionPinState(session.token, discussionId, false);
    } else if (intent === "lock") {
      await setForumDiscussionLockState(
        session.token,
        forumId,
        discussionId,
        "locked"
      );
    } else if (intent === "unlock") {
      await setForumDiscussionLockState(
        session.token,
        forumId,
        discussionId,
        "unlocked"
      );
    } else if (intent === "delete") {
      await deleteForumPost(session.token, postId);
    } else {
      return {
        error: "Acción de moderación no válida.",
      };
    }
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) {
      redirect("/");
    }

    if (error instanceof MoodleApiError) {
      logger.warn("Forum moderation failed", {
        userId: session.userId,
        courseId,
        forumId,
        discussionId,
        intent,
        code: error.code,
        error,
      });
    } else {
      logger.error("Unexpected forum moderation failure", {
        userId: session.userId,
        courseId,
        forumId,
        discussionId,
        intent,
        error,
      });
    }

    return {
      error:
        error instanceof MoodleApiError
          ? error.message
          : "No se pudo completar la acción de moderación.",
    };
  }

  revalidatePath(returnPath);
  redirect(returnPath);
}
