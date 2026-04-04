import { logger } from "@/lib/logger";
import { insertScormTracks, isAuthenticationError } from "@/lib/moodle";
import {
  clearSessionAndReturnUnauthorized,
  getSessionOrUnauthorizedResponse,
} from "@/lib/session";

type TrackPayload = {
  scormId?: number;
  scoId?: number;
  attempt?: number;
  tracks?: Array<{
    element?: string;
    value?: string;
  }>;
};

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export async function POST(request: Request) {
  const sessionResult = await getSessionOrUnauthorizedResponse();

  if (sessionResult.response) {
    return sessionResult.response;
  }

  const { session } = sessionResult;
  const payload = (await request.json().catch(() => null)) as TrackPayload | null;

  if (
    !payload ||
    !isPositiveInteger(payload.scoId) ||
    !isPositiveInteger(payload.attempt) ||
    !Array.isArray(payload.tracks)
  ) {
    return new Response("Bad request", { status: 400 });
  }

  const tracks = payload.tracks
    .filter(
      (track): track is { element: string; value: string } =>
        typeof track.element === "string" && typeof track.value === "string"
    )
    .filter((track) => track.element.startsWith("cmi."));

  if (tracks.length === 0) {
    return Response.json({ ok: true, skipped: true });
  }

  try {
    await insertScormTracks(session.token, payload.scoId, payload.attempt, tracks);
    return Response.json({ ok: true });
  } catch (error) {
    logger.warn("SCORM track commit failed", {
      userId: session.userId,
      scormId: payload.scormId,
      scoId: payload.scoId,
      attempt: payload.attempt,
      trackCount: tracks.length,
      error,
    });

    if (isAuthenticationError(error)) {
      return clearSessionAndReturnUnauthorized();
    }

    return new Response("Upstream error", { status: 502 });
  }
}
