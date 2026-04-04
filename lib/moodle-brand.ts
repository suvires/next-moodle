import { cache } from "react";
import { getMoodleSiteUrl, isAllowedMoodleUrl, resolveAbsoluteMoodleUrl } from "@/lib/moodle-media";

type RawMoodleBranding = {
  sitename?: string;
  siteurl?: string;
  logourl?: string;
  compactlogourl?: string;
  logo?: string;
  compactlogo?: string;
  logocompact?: string;
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

function normalizeBranding(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const raw = payload as RawMoodleBranding;
  const logoUrl = normalizeUrl(raw.logourl || raw.logo);
  const compactLogoUrl = normalizeUrl(
    raw.compactlogourl || raw.compactlogo || raw.logocompact || raw.logourl
  );

  return {
    siteName: raw.sitename?.trim() || fallbackSiteName(),
    siteUrl: normalizeUrl(raw.siteurl) || getMoodleSiteUrl(),
    logoUrl,
    compactLogoUrl,
  } satisfies MoodleBranding;
}

async function fetchBrandingViaRest() {
  const token = process.env.MOODLE_API_TOKEN?.trim();

  if (!token) {
    return null;
  }

  const response = await fetch(`${getMoodleSiteUrl()}/webservice/rest/server.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      wstoken: token,
      wsfunction: "tool_mobile_get_public_config",
      moodlewsrestformat: "json",
    }),
    cache: "force-cache",
    next: {
      revalidate: 3600,
    },
  });

  if (!response.ok) {
    return null;
  }

  return normalizeBranding(await response.json().catch(() => null));
}

async function fetchBrandingViaAjax() {
  const response = await fetch(
    `${getMoodleSiteUrl()}/lib/ajax/service.php?info=tool_mobile_get_public_config`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify([
        {
          index: 0,
          methodname: "tool_mobile_get_public_config",
          args: {},
        },
      ]),
      cache: "force-cache",
      next: {
        revalidate: 3600,
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  const payload = await response.json().catch(() => null);
  const data = Array.isArray(payload) ? payload[0]?.data : payload;

  return normalizeBranding(data);
}

export const getMoodleBranding = cache(async () => {
  const fromRest = await fetchBrandingViaRest().catch(() => null);

  if (fromRest) {
    return fromRest;
  }

  const fromAjax = await fetchBrandingViaAjax().catch(() => null);

  if (fromAjax) {
    return fromAjax;
  }

  return {
    siteName: fallbackSiteName(),
    siteUrl: getMoodleSiteUrl(),
    logoUrl: normalizeUrl("/favicon.ico"),
    compactLogoUrl: normalizeUrl("/favicon.ico"),
  } satisfies MoodleBranding;
});

export function getMoodleBrandLogoProxyUrl(variant: "full" | "compact" = "full") {
  return `/api/moodle-brand-logo?variant=${variant}`;
}
