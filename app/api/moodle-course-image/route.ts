import { isAllowedMoodleUrl, resolveAbsoluteMoodleUrl } from "@/lib/moodle-media";

async function handleRequest(request: Request, method: "GET" | "HEAD") {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return new Response("Missing url", { status: 400 });
  }

  if (!isAllowedMoodleUrl(rawUrl)) {
    return new Response("Forbidden", { status: 403 });
  }

  const token = process.env.MOODLE_API_TOKEN?.trim();
  if (!token) {
    return new Response("Server token not configured", { status: 503 });
  }

  const targetUrl = resolveAbsoluteMoodleUrl(rawUrl);
  targetUrl.searchParams.set("token", token);

  const upstream = await fetch(targetUrl.toString(), {
    method,
    cache: "force-cache",
    next: { revalidate: 3600 },
  }).catch(() => null);

  if (!upstream?.ok) {
    return new Response(null, { status: 404 });
  }

  const headers = new Headers();
  const passthrough = ["cache-control", "content-length", "content-type", "etag", "last-modified"];
  for (const name of passthrough) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (!headers.has("cache-control")) {
    headers.set("cache-control", "public, max-age=3600, stale-while-revalidate=86400");
  }

  return new Response(method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    headers,
  });
}

export async function GET(request: Request) {
  return handleRequest(request, "GET");
}

export async function HEAD(request: Request) {
  return handleRequest(request, "HEAD");
}
