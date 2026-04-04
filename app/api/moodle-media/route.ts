import {
  getMoodleMediaCandidates,
  isMoodleAuthenticationFailureResponse,
  isAllowedMoodleUrl,
  resolveAbsoluteMoodleUrl,
} from "@/lib/moodle-media";
import {
  clearSessionAndReturnUnauthorized,
  getSessionOrUnauthorizedResponse,
} from "@/lib/session";

async function handleMediaRequest(request: Request, method: "GET" | "HEAD") {
  const sessionResult = await getSessionOrUnauthorizedResponse();

  if (sessionResult.response) {
    return sessionResult.response;
  }

  const { session } = sessionResult;

  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return new Response("Missing url", { status: 400 });
  }

  if (!isAllowedMoodleUrl(rawUrl)) {
    return new Response("Forbidden", { status: 403 });
  }

  let upstream: Response | null = null;
  let sawAuthenticationFailure = false;
  const upstreamHeaders = new Headers();
  const range = request.headers.get("range");
  const ifNoneMatch = request.headers.get("if-none-match");
  const ifModifiedSince = request.headers.get("if-modified-since");

  if (range) {
    upstreamHeaders.set("range", range);
  }

  if (ifNoneMatch) {
    upstreamHeaders.set("if-none-match", ifNoneMatch);
  }

  if (ifModifiedSince) {
    upstreamHeaders.set("if-modified-since", ifModifiedSince);
  }

  for (const candidateUrl of getMoodleMediaCandidates(rawUrl, session.token)) {
    const response = await fetch(candidateUrl, {
      method,
      headers: upstreamHeaders,
      cache: range ? "no-store" : "force-cache",
    });

    if (isMoodleAuthenticationFailureResponse(response)) {
      sawAuthenticationFailure = true;
      continue;
    }

    if (response.ok || response.status === 206 || response.status === 304) {
      upstream = response;
      break;
    }
  }

  if (!upstream) {
    if (sawAuthenticationFailure) {
      return clearSessionAndReturnUnauthorized();
    }

    return new Response("Upstream error", { status: 502 });
  }

  const headers = new Headers();
  const passthroughHeaderNames = [
    "accept-ranges",
    "cache-control",
    "content-disposition",
    "content-length",
    "content-range",
    "content-type",
    "etag",
    "last-modified",
  ];

  for (const headerName of passthroughHeaderNames) {
    const value = upstream.headers.get(headerName);

    if (value) {
      headers.set(headerName, value);
    }
  }

  if (!headers.has("cache-control")) {
    headers.set(
      "cache-control",
      range
        ? "private, no-store"
        : "private, max-age=300, stale-while-revalidate=3600"
    );
  }

  if (!headers.has("accept-ranges")) {
    headers.set("accept-ranges", "bytes");
  }

  headers.set("x-proxied-from", resolveAbsoluteMoodleUrl(rawUrl).origin);

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}

export async function GET(request: Request) {
  return handleMediaRequest(request, "GET");
}

export async function HEAD(request: Request) {
  return handleMediaRequest(request, "HEAD");
}
