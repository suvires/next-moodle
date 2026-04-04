import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { resolveScormExtractedFilePath } from "@/lib/scorm-package";
import {
  buildScormRuntimeInjection,
  decodeScormRuntimePayload,
} from "@/lib/scorm-runtime";
import { getSessionOrUnauthorizedResponse } from "@/lib/session";

const CONTENT_TYPES: Record<string, string> = {
  ".aac": "audio/aac",
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".htm": "text/html; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".oga": "audio/ogg",
  ".ogg": "audio/ogg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".wav": "audio/wav",
  ".webm": "video/webm",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
};

function getContentType(pathname: string) {
  return CONTENT_TYPES[extname(pathname).toLowerCase()] || "application/octet-stream";
}

function injectIntoHtmlDocument(html: string, injectedRuntime: string) {
  if (!injectedRuntime) {
    return html;
  }

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>\n${injectedRuntime}\n`);
  }

  if (/<html[^>]*>/i.test(html)) {
    return html.replace(/<html([^>]*)>/i, `<html$1>\n<head>\n${injectedRuntime}\n</head>\n`);
  }

  return `${injectedRuntime}\n${html}`;
}

async function handleRequest(
  request: Request,
  context: { params: Promise<{ cacheKey: string; path?: string[] }> },
  method: "GET" | "HEAD"
) {
  const sessionResult = await getSessionOrUnauthorizedResponse();

  if (sessionResult.response) {
    return sessionResult.response;
  }

  const { cacheKey, path = [] } = await context.params;

  let fileReference: Awaited<ReturnType<typeof resolveScormExtractedFilePath>> | null = null;

  try {
    fileReference = await resolveScormExtractedFilePath(cacheKey, path);
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  if (!fileReference) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers({
    "content-type": getContentType(fileReference.absolutePath),
    "cache-control": "private, max-age=300, stale-while-revalidate=3600",
  });

  if (method === "HEAD") {
    return new Response(null, { status: 200, headers });
  }

  const runtimePayload = decodeScormRuntimePayload(
    new URL(request.url).searchParams.get("__scorm_runtime")
  );

  if (headers.get("content-type")?.startsWith("text/html")) {
    const html = await readFile(fileReference.absolutePath, "utf8");
    const injectedRuntime = runtimePayload
      ? buildScormRuntimeInjection(runtimePayload)
      : "";
    const responseHtml = injectIntoHtmlDocument(html, injectedRuntime);

    return new Response(responseHtml, {
      status: 200,
      headers,
    });
  }

  const fileBuffer = await readFile(fileReference.absolutePath);

  return new Response(fileBuffer, {
    status: 200,
    headers,
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ cacheKey: string; path?: string[] }> }
) {
  return handleRequest(request, context, "GET");
}

export async function HEAD(
  request: Request,
  context: { params: Promise<{ cacheKey: string; path?: string[] }> }
) {
  return handleRequest(request, context, "HEAD");
}
