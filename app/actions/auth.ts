"use server";

import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import { authenticateWithMoodle, MoodleApiError } from "@/lib/moodle";
import { clearSession, createSession } from "@/lib/session";

export type LoginFormState = {
  error: string | null;
};

function inferIdentifierType(identifier: string) {
  return identifier.includes("@") ? "email" : "username";
}

export async function loginAction(
  _previousState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const identifier = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const identifierType = inferIdentifierType(identifier);

  if (!identifier || !password) {
    return {
      error: "Introduce tu usuario o email y tu contrasena para continuar.",
    };
  }

  let authResult: Awaited<ReturnType<typeof authenticateWithMoodle>>;

  try {
    authResult = await authenticateWithMoodle(identifier, password);
  } catch (error) {
    if (error instanceof MoodleApiError) {
      if (error.code === "invalidlogin") {
        logger.info("Moodle login rejected credentials", {
          identifierType,
          code: error.code,
        });
      } else {
        logger.warn("Moodle login failed", {
          identifierType,
          code: error.code,
          error,
        });
      }

      return {
        error:
          error.code === "invalidlogin"
            ? "Usuario/email o contrasena incorrectos."
            : "No se pudo iniciar sesion. Intentalo de nuevo.",
      };
    }

    logger.error("Unexpected login failure", {
      identifierType,
      error,
    });

    return {
      error: "No se pudo contactar con Moodle. Intentalo de nuevo.",
    };
  }

  await createSession({
    token: authResult.token,
    userId: authResult.user.id,
    username: authResult.user.username,
    fullName: authResult.user.fullName,
    userPictureUrl: authResult.user.userPictureUrl,
  });

  redirect("/mis-cursos");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}
