"use server";

import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import { sanitizeReturnPath } from "@/lib/safe-redirect";
import {
  MoodleApiError,
  processQuizAttempt,
  saveQuizAttempt,
  startQuizAttempt,
} from "@/lib/moodle";
import {
  clearSessionIfAuthenticationError,
  requireSession,
} from "@/lib/session";
import { parseRequiredNumber } from "./validation";

function buildQuizPath(
  rawPath: string | null,
  updates: Record<string, string | null | undefined>,
  fallback: string
) {
  const safePath = sanitizeReturnPath(rawPath, fallback);
  const url = new URL(safePath, "https://local.invalid");

  url.searchParams.delete("quizError");
  url.searchParams.delete("quizNotice");

  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  });

  const query = url.searchParams.toString();
  return query ? `${url.pathname}?${query}` : url.pathname;
}

function extractPreflightData(formData: FormData) {
  const password = String(formData.get("preflightPassword") || "").trim();

  if (!password) {
    return [] as Array<{ name: string; value: string }>;
  }

  return [{ name: "quizpassword", value: password }];
}

function extractAttemptData(formData: FormData) {
  const reservedKeys = new Set([
    "attemptId",
    "returnPath",
    "page",
    "nextPage",
    "intent",
    "preflightPassword",
  ]);

  const data: Array<{ name: string; value: string }> = [];

  for (const [name, value] of formData.entries()) {
    if (reservedKeys.has(name) || typeof value !== "string") {
      continue;
    }

    data.push({ name, value });
  }

  return data;
}

export async function startQuizAttemptAction(formData: FormData) {
  const session = await requireSession();

  const quizId = parseRequiredNumber(formData.get("quizId"));
  const fallbackPath = `/mis-cursos`;
  const returnPath = sanitizeReturnPath(
    formData.get("returnPath") as string | null,
    fallbackPath
  );
  const preflightData = extractPreflightData(formData);

  try {
    const attempt = await startQuizAttempt(
      session.token,
      quizId,
      preflightData
    );

    redirect(
      buildQuizPath(
        returnPath,
        {
          attempt: String(attempt.id),
          page: String(attempt.currentPage ?? 0),
          view: null,
          review: null,
        },
        fallbackPath
      )
    );
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) {
      redirect("/");
    }

    if (error instanceof MoodleApiError) {
      logger.warn("Quiz start failed", {
        userId: session.userId,
        quizId,
        code: error.code,
        error,
      });
    } else {
      logger.error("Unexpected quiz start failure", {
        userId: session.userId,
        quizId,
        error,
      });
    }

    redirect(
      buildQuizPath(
        returnPath,
        {
          quizError:
            error instanceof MoodleApiError
              ? error.message
              : "No se pudo iniciar el cuestionario.",
        },
        fallbackPath
      )
    );
  }
}

export async function submitQuizAttemptAction(formData: FormData) {
  const session = await requireSession();

  const attemptId = parseRequiredNumber(formData.get("attemptId"));
  const currentPage = Number(formData.get("page") || 0);
  const nextPage = Number(formData.get("nextPage") || -1);
  const intent = String(formData.get("intent") || "save");
  const fallbackPath = "/mis-cursos";
  const returnPath = sanitizeReturnPath(
    formData.get("returnPath") as string | null,
    fallbackPath
  );
  const preflightData = extractPreflightData(formData);
  const data = extractAttemptData(formData);

  try {
    switch (intent) {
      case "previous":
      case "next": {
        await processQuizAttempt(session.token, attemptId, data, false, false, preflightData);
        const targetPage =
          intent === "previous" ? Math.max(0, currentPage - 1) : Math.max(0, nextPage);

        redirect(
          buildQuizPath(
            returnPath,
            {
              attempt: String(attemptId),
              page: String(targetPage),
              view: null,
              review: null,
              quizNotice: null,
            },
            fallbackPath
          )
        );
      }
      case "summary": {
        await saveQuizAttempt(session.token, attemptId, data, preflightData);
        redirect(
          buildQuizPath(
            returnPath,
            {
              attempt: String(attemptId),
              view: "summary",
              review: null,
              page: null,
              quizNotice: null,
            },
            fallbackPath
          )
        );
      }
      case "finish": {
        const state = await processQuizAttempt(
          session.token,
          attemptId,
          data,
          true,
          false,
          preflightData
        );

        redirect(
          buildQuizPath(
            returnPath,
            state === "finished"
              ? {
                  review: String(attemptId),
                  attempt: null,
                  page: null,
                  view: null,
                  quizNotice: "Intento enviado correctamente.",
                }
              : {
                  attempt: String(attemptId),
                  view: "summary",
                  page: null,
                  review: null,
                  quizNotice: `Estado actual: ${state}.`,
                },
            fallbackPath
          )
        );
      }
      case "save":
      default: {
        await saveQuizAttempt(session.token, attemptId, data, preflightData);
        redirect(
          buildQuizPath(
            returnPath,
            {
              attempt: String(attemptId),
              page: String(Math.max(0, currentPage)),
              view: null,
              review: null,
              quizNotice: "Respuestas guardadas.",
            },
            fallbackPath
          )
        );
      }
    }
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) {
      redirect("/");
    }

    if (error instanceof MoodleApiError) {
      logger.warn("Quiz attempt action failed", {
        userId: session.userId,
        attemptId,
        intent,
        code: error.code,
        error,
      });
    } else {
      logger.error("Unexpected quiz attempt action failure", {
        userId: session.userId,
        attemptId,
        intent,
        error,
      });
    }

    redirect(
      buildQuizPath(
        returnPath,
        {
          attempt: String(attemptId),
          page:
            intent === "summary" || intent === "finish"
              ? null
              : String(Math.max(0, currentPage)),
          view: intent === "summary" || intent === "finish" ? "summary" : null,
          quizError:
            error instanceof MoodleApiError
              ? error.message
              : "No se pudo procesar el intento.",
        },
        fallbackPath
      )
    );
  }
}
