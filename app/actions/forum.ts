"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import { sanitizeReturnPath } from "@/lib/safe-redirect";
import { addForumDiscussion, addForumReply, MoodleApiError } from "@/lib/moodle";
import {
  clearSessionIfAuthenticationError,
  requireSession,
} from "@/lib/session";
import { parseRequiredNumber } from "./validation";
import { toHtmlMessage } from "./formatting";

export type ForumFormState = {
  error: string | null;
};

export async function createForumDiscussionAction(
  _previousState: ForumFormState,
  formData: FormData
): Promise<ForumFormState> {
  const session = await requireSession();

  const forumId = parseRequiredNumber(formData.get("forumId"));
  const subject = String(formData.get("subject") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const returnPath = sanitizeReturnPath(formData.get("returnPath") as string | null, `/foros/${forumId}`);

  if (!subject || !message) {
    return {
      error: "Escribe un asunto y un mensaje para publicar el hilo.",
    };
  }

  try {
    await addForumDiscussion(session.token, forumId, subject, toHtmlMessage(message));
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) {
      redirect("/");
    }

    if (error instanceof MoodleApiError) {
      logger.warn("Forum discussion creation failed", {
        userId: session.userId,
        forumId,
        code: error.code,
        error,
      });
    } else {
      logger.error("Unexpected forum discussion creation failure", {
        userId: session.userId,
        forumId,
        error,
      });
    }

    return {
      error:
        error instanceof MoodleApiError
          ? error.message
          : "No se pudo publicar el hilo.",
    };
  }

  revalidatePath(returnPath);
  redirect(returnPath);
}

export async function createForumReplyAction(
  _previousState: ForumFormState,
  formData: FormData
): Promise<ForumFormState> {
  const session = await requireSession();

  const postId = parseRequiredNumber(formData.get("postId"));
  const subject = String(formData.get("subject") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const returnPath = sanitizeReturnPath(formData.get("returnPath") as string | null, "/mis-cursos");

  if (!message) {
    return {
      error: "Escribe una respuesta para continuar.",
    };
  }

  try {
    await addForumReply(
      session.token,
      postId,
      subject || "Re:",
      toHtmlMessage(message)
    );
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) {
      redirect("/");
    }

    if (error instanceof MoodleApiError) {
      logger.warn("Forum reply creation failed", {
        userId: session.userId,
        postId,
        code: error.code,
        error,
      });
    } else {
      logger.error("Unexpected forum reply creation failure", {
        userId: session.userId,
        postId,
        error,
      });
    }

    return {
      error:
        error instanceof MoodleApiError
          ? error.message
          : "No se pudo publicar la respuesta.",
    };
  }

  revalidatePath(returnPath);
  redirect(returnPath);
}
