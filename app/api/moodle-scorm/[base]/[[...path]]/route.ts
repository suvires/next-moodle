import {
  appendMoodleToken,
  isMoodleAuthenticationFailureResponse,
  isAllowedMoodleUrl,
  resolveAbsoluteMoodleUrl,
} from "@/lib/moodle-media";
import {
  clearSessionAndReturnUnauthorized,
  getSessionOrUnauthorizedResponse,
} from "@/lib/session";

function decodeBaseSegment(base: string) {
  try {
    return Buffer.from(base, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

function buildUpstreamUrl(baseUrl: string, pathParts: string[], requestUrl: URL) {
  const joinedPath = pathParts.map((part) => encodeURIComponent(part)).join("/");
  const target = new URL(joinedPath || ".", baseUrl);

  for (const [key, value] of requestUrl.searchParams.entries()) {
    target.searchParams.append(key, value);
  }

  return target.toString();
}

async function handleScormRequest(
  request: Request,
  context: { params: Promise<{ base: string; path?: string[] }> },
  method: "GET" | "HEAD"
) {
  const sessionResult = await getSessionOrUnauthorizedResponse();

  if (sessionResult.response) {
    return sessionResult.response;
  }

  const { session } = sessionResult;

  const { base, path = [] } = await context.params;
  const decodedBase = decodeBaseSegment(base);

  if (!decodedBase) {
    return new Response("Invalid base", { status: 400 });
  }

  if (!isAllowedMoodleUrl(decodedBase)) {
    return new Response("Forbidden", { status: 403 });
  }

  const requestUrl = new URL(request.url);
  const upstreamUrl = buildUpstreamUrl(decodedBase, path, requestUrl);

  if (!isAllowedMoodleUrl(upstreamUrl)) {
    return new Response("Forbidden", { status: 403 });
  }

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

  const upstream = await fetch(appendMoodleToken(upstreamUrl, session.token), {
    method,
    headers: upstreamHeaders,
    cache: range ? "no-store" : "force-cache",
  });

  if (isMoodleAuthenticationFailureResponse(upstream)) {
    return clearSessionAndReturnUnauthorized();
  }

  if (!upstream.ok && upstream.status !== 206 && upstream.status !== 304) {
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

  headers.set("x-proxied-from", resolveAbsoluteMoodleUrl(upstreamUrl).origin);

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ base: string; path?: string[] }> }
) {
  return handleScormRequest(request, context, "GET");
}

export async function HEAD(
  request: Request,
  context: { params: Promise<{ base: string; path?: string[] }> }
) {
  return handleScormRequest(request, context, "HEAD");
}
