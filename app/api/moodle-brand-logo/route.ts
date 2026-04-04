import { getMoodleBranding } from "@/lib/moodle-brand";

export async function GET(request: Request) {
  const variant =
    new URL(request.url).searchParams.get("variant") === "compact" ? "compact" : "full";
  const branding = await getMoodleBranding();
  const sourceUrl =
    (variant === "compact" ? branding.compactLogoUrl : branding.logoUrl) ||
    branding.logoUrl ||
    branding.compactLogoUrl;

  if (!sourceUrl) {
    return new Response("Logo not found", { status: 404 });
  }

  const upstream = await fetch(sourceUrl, {
    cache: "force-cache",
    next: {
      revalidate: 3600,
    },
  });

  if (!upstream.ok) {
    return new Response("Upstream error", { status: 502 });
  }

  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  const cacheControl = upstream.headers.get("cache-control");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  headers.set(
    "cache-control",
    cacheControl || "public, max-age=3600, stale-while-revalidate=86400"
  );

  return new Response(upstream.body, {
    status: 200,
    headers,
  });
}
