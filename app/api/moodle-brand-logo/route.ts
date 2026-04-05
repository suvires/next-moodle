import { getMoodleBranding } from "@/lib/moodle-brand";
import { resolveAbsoluteMoodleUrl } from "@/lib/moodle-media";

const DEFAULT_CACHE_CONTROL = "public, max-age=3600, stale-while-revalidate=86400";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function getBrandInitials(siteName: string) {
  const initials = siteName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "C";
}

function buildFallbackSvg(siteName: string, variant: "compact" | "full") {
  const safeSiteName = escapeXml(siteName);
  const initials = escapeXml(getBrandInitials(siteName));
  const showLabel = variant === "full" && safeSiteName.length <= 24;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="${safeSiteName}">
      <defs>
        <linearGradient id="brand-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#1d4ed8" />
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="28" fill="url(#brand-gradient)" />
      <circle cx="64" cy="52" r="28" fill="rgba(255,255,255,0.14)" />
      <text
        x="64"
        y="${showLabel ? "61" : "66"}"
        fill="#f8fafc"
        font-family="ui-sans-serif, system-ui, sans-serif"
        font-size="${showLabel ? "34" : "40"}"
        font-weight="700"
        text-anchor="middle"
      >${initials}</text>
      ${
        showLabel
          ? `<text
        x="64"
        y="100"
        fill="#dbeafe"
        font-family="ui-sans-serif, system-ui, sans-serif"
        font-size="12"
        font-weight="600"
        text-anchor="middle"
      >${safeSiteName}</text>`
          : ""
      }
    </svg>
  `.trim();
}

function createFallbackResponse(
  siteName: string,
  variant: "compact" | "full",
  method: "GET" | "HEAD"
) {
  const svg = buildFallbackSvg(siteName, variant);
  const headers = new Headers({
    "cache-control": DEFAULT_CACHE_CONTROL,
    "content-length": Buffer.byteLength(svg).toString(),
    "content-type": "image/svg+xml; charset=utf-8",
    "x-brand-logo-fallback": "true",
  });

  return new Response(method === "HEAD" ? null : svg, {
    status: 200,
    headers,
  });
}

async function handleBrandLogoRequest(request: Request, method: "GET" | "HEAD") {
  const variant =
    new URL(request.url).searchParams.get("variant") === "compact" ? "compact" : "full";
  const branding = await getMoodleBranding();
  const sourceUrl =
    (variant === "compact" ? branding.compactLogoUrl : branding.logoUrl) ||
    branding.logoUrl ||
    branding.compactLogoUrl;

  if (!sourceUrl) {
    return createFallbackResponse(branding.siteName, variant, method);
  }

  const upstream = await fetch(resolveAbsoluteMoodleUrl(sourceUrl).toString(), {
    method,
    cache: "force-cache",
    next: { revalidate: 3600 },
  }).catch(() => null);

  if (!upstream?.ok) {
    return new Response(null, { status: 404 });
  }

  const headers = new Headers();
  const passthroughHeaderNames = [
    "cache-control",
    "content-length",
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
    headers.set("cache-control", DEFAULT_CACHE_CONTROL);
  }

  return new Response(method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    headers,
  });
}

export async function GET(request: Request) {
  return handleBrandLogoRequest(request, "GET");
}

export async function HEAD(request: Request) {
  return handleBrandLogoRequest(request, "HEAD");
}
