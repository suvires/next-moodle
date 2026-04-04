import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isAuthenticationError } from "@/lib/moodle";

const COOKIE_NAME = "moodle_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const LOGIN_PATH = "/";
const EXPIRED_SESSION_PATH = "/auth/session-expired";

export type MoodleSession = {
  token: string;
  userId: number;
  username: string;
  fullName: string;
  userPictureUrl?: string;
  expiresAt: number;
};

function getSessionSecret() {
  const secret = process.env.APP_SESSION_SECRET?.trim();

  if (!secret) {
    throw new Error(
      "Falta APP_SESSION_SECRET. Define un secreto de sesion dedicado para cifrar la cookie."
    );
  }

  return createHash("sha256").update(secret).digest();
}

function encrypt(value: string) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", getSessionSecret(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString("base64url");
}

function decrypt(value: string) {
  const payload = Buffer.from(value, "base64url");
  const iv = payload.subarray(0, IV_LENGTH);
  const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv("aes-256-gcm", getSessionSecret(), iv);

  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
}

export async function createSession(
  session: Omit<MoodleSession, "expiresAt">
) {
  const cookieStore = await cookies();
  const expiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000;
  const payload: MoodleSession = {
    ...session,
    expiresAt,
  };

  cookieStore.set(COOKIE_NAME, encrypt(JSON.stringify(payload)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function getSession(): Promise<MoodleSession | null> {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(COOKIE_NAME)?.value;

  if (!rawCookie) {
    return null;
  }

  try {
    const parsedSession = JSON.parse(decrypt(rawCookie)) as MoodleSession;

    if (parsedSession.expiresAt <= Date.now()) {
      return null;
    }

    return parsedSession;
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<MoodleSession> {
  const session = await getSession();

  if (!session) {
    redirect(LOGIN_PATH);
  }

  return session;
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function redirectToExpiredSession(): never {
  redirect(EXPIRED_SESSION_PATH);
}

export function redirectIfSessionExpired(error: unknown) {
  if (isAuthenticationError(error)) {
    redirectToExpiredSession();
  }
}

export async function clearSessionIfAuthenticationError(error: unknown) {
  if (!isAuthenticationError(error)) {
    return false;
  }

  await clearSession();
  return true;
}

export async function getSessionOrUnauthorizedResponse(): Promise<
  { session: MoodleSession; response: null } | { session: null; response: Response }
> {
  const session = await getSession();

  if (!session) {
    return {
      session: null,
      response: new Response("Unauthorized", { status: 401 }),
    };
  }

  return {
    session,
    response: null,
  };
}

export async function clearSessionAndReturnUnauthorized() {
  await clearSession();
  return new Response("Unauthorized", { status: 401 });
}
