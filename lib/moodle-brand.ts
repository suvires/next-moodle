import { cache } from "react";
import { getMoodleSiteUrl, isAllowedMoodleUrl, resolveAbsoluteMoodleUrl } from "@/lib/moodle-media";

// Raw shape returned by tool_mobile_get_public_config
type RawMoodlePublicConfig = {
  sitename?: string;
  siteurl?: string;
  logourl?: string;
  compactlogourl?: string;
  logo?: string;
  compactlogo?: string;
  logocompact?: string;
  forcelogin?: number | boolean;
};

export type MoodleBranding = {
  siteName: string;
  siteUrl: string;
  logoUrl?: string;
  compactLogoUrl?: string;
};

function fallbackSiteName() {
  const hostname = new URL(getMoodleSiteUrl()).hostname.replace(/^www\./, "");
  const [subdomain, domain] = hostname.split(".");

  if (subdomain && domain) {
    return `${subdomain.charAt(0).toUpperCase()}${subdomain.slice(1)} ${domain
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())}`.trim();
  }

  return "Campus";
}

function normalizeUrl(rawUrl?: string) {
  if (!rawUrl) {
    return undefined;
  }

  try {
    const resolved = resolveAbsoluteMoodleUrl(rawUrl).toString();
    return isAllowedMoodleUrl(resolved) ? resolved : undefined;
  } catch {
    return undefined;
  }
}

function isValidConfig(payload: unknown): payload is RawMoodlePublicConfig {
  return (
    payload !== null &&
    typeof payload === "object" &&
    !("exception" in (payload as object))
  );
}

// tool_mobile_get_public_config is a CAPABILITY_ANONYMOUS function — no token required.
async function fetchPublicConfigAnonymous(): Promise<RawMoodlePublicConfig | null> {
  const response = await fetch(`${getMoodleSiteUrl()}/webservice/rest/server.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      wsfunction: "tool_mobile_get_public_config",
      moodlewsrestformat: "json",
    }),
    cache: "force-cache",
    next: { revalidate: 3600 },
  });

  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  return isValidConfig(payload) ? payload : null;
}

// Fallback: try with the service token (works when the token's service includes the mobile plugin).
async function fetchPublicConfigViaRest(): Promise<RawMoodlePublicConfig | null> {
  const token = process.env.MOODLE_API_TOKEN?.trim();
  if (!token) return null;

  const response = await fetch(`${getMoodleSiteUrl()}/webservice/rest/server.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      wstoken: token,
      wsfunction: "tool_mobile_get_public_config",
      moodlewsrestformat: "json",
    }),
    cache: "force-cache",
    next: { revalidate: 3600 },
  });

  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  return isValidConfig(payload) ? payload : null;
}

// Shared per-request cache — both getMoodleBranding and getSiteForceLogin
// resolve from the same call. The underlying fetch is cached at the HTTP layer
// (next.revalidate: 3600), so duplicate calls across requests are also free.
const getMoodlePublicConfig = cache(async (): Promise<RawMoodlePublicConfig | null> => {
  // Try without token first — tool_mobile_get_public_config is public.
  const anonymous = await fetchPublicConfigAnonymous().catch(() => null);
  if (anonymous) return anonymous;

  // Fall back to token-authenticated call (works when the service includes the mobile plugin).
  const withToken = await fetchPublicConfigViaRest().catch(() => null);
  return withToken;
});

export const getMoodleBranding = cache(async (): Promise<MoodleBranding> => {
  const config = await getMoodlePublicConfig();

  if (config) {
    const logoUrl = normalizeUrl(config.logourl || config.logo);
    const compactLogoUrl = normalizeUrl(
      config.compactlogourl || config.compactlogo || config.logocompact || config.logourl
    );

    return {
      siteName: config.sitename?.trim() || fallbackSiteName(),
      siteUrl: normalizeUrl(config.siteurl) || getMoodleSiteUrl(),
      logoUrl,
      compactLogoUrl,
    };
  }

  return {
    siteName: fallbackSiteName(),
    siteUrl: getMoodleSiteUrl(),
    logoUrl: normalizeUrl("/favicon.ico"),
    compactLogoUrl: normalizeUrl("/favicon.ico"),
  };
});

// Fallback: follow the redirect from a protected Moodle page and check the final URL.
// redirect: "manual" returns an opaque response with status 0 in Node.js fetch (undici),
// so we use the default redirect: "follow" and inspect res.url instead.
const detectForceLoginViaRedirect = cache(async (): Promise<boolean> => {
  try {
    const res = await fetch(`${getMoodleSiteUrl()}/course/index.php`, {
      next: { revalidate: 3600 },
    });
    return new URL(res.url).pathname.startsWith("/login");
  } catch {
    return false;
  }
});

export async function getSiteForceLogin(): Promise<boolean> {
  // 1. Mobile plugin config (available on instances with the Mobile App service enabled)
  const config = await getMoodlePublicConfig().catch(() => null);
  if (config) return Boolean(config.forcelogin);

  // 2. Redirect probe — works on any Moodle regardless of plugins
  return detectForceLoginViaRedirect();
}

export function getMoodleBrandLogoProxyUrl(variant: "full" | "compact" = "full") {
  return `/api/moodle-brand-logo?variant=${variant}`;
}
