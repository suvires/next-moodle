function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function toBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

export function getMoodleSiteUrl() {
  const rawUrl = process.env.MOODLE_API_URL;

  if (!rawUrl) {
    throw new Error("Falta la variable de entorno MOODLE_API_URL.");
  }

  const normalizedUrl = stripTrailingSlash(rawUrl.trim());

  if (normalizedUrl.endsWith("/webservice/rest/server.php")) {
    return normalizedUrl.replace(/\/webservice\/rest\/server\.php$/, "");
  }

  if (normalizedUrl.endsWith("/login/token.php")) {
    return normalizedUrl.replace(/\/login\/token\.php$/, "");
  }

  return normalizedUrl;
}

export function resolveAbsoluteMoodleUrl(rawUrl: string) {
  return new URL(rawUrl, getMoodleSiteUrl());
}

export function isAllowedMoodleUrl(rawUrl: string) {
  const target = resolveAbsoluteMoodleUrl(rawUrl);
  const moodleSite = new URL(getMoodleSiteUrl());

  return target.origin === moodleSite.origin;
}

export function appendMoodleToken(rawUrl: string, token: string) {
  const target = resolveAbsoluteMoodleUrl(rawUrl);

  if (
    target.pathname.includes("/pluginfile.php/") &&
    !target.pathname.includes("/webservice/pluginfile.php/")
  ) {
    target.pathname = target.pathname.replace(
      "/pluginfile.php/",
      "/webservice/pluginfile.php/"
    );
  }

  if (target.pathname.includes("/tokenpluginfile.php/")) {
    target.pathname = target.pathname.replace(
      "/tokenpluginfile.php/",
      "/webservice/pluginfile.php/"
    );
  }

  if (!target.searchParams.has("token") && !target.searchParams.has("wstoken")) {
    target.searchParams.set("token", token);
  }

  return target.toString();
}

export function getMoodleMediaCandidates(rawUrl: string, token: string) {
  const absoluteOriginal = resolveAbsoluteMoodleUrl(rawUrl).toString();
  const tokenized = appendMoodleToken(rawUrl, token);

  return [...new Set([tokenized, absoluteOriginal])];
}

export function getMoodleMediaProxyUrl(rawUrl?: string) {
  if (!rawUrl) {
    return undefined;
  }

  return `/api/moodle-media?url=${encodeURIComponent(rawUrl)}`;
}

export function getMoodleScormProxyUrl(rawUrl?: string) {
  if (!rawUrl) {
    return undefined;
  }

  const absoluteUrl = resolveAbsoluteMoodleUrl(rawUrl);
  const pathnameParts = absoluteUrl.pathname.split("/").filter(Boolean);

  if (pathnameParts.length === 0) {
    return undefined;
  }

  const filename = pathnameParts[pathnameParts.length - 1];
  const baseUrl = new URL("./", absoluteUrl).toString();
  const encodedBase = toBase64Url(baseUrl);

  return `/api/moodle-scorm/${encodedBase}/${filename}${absoluteUrl.search}`;
}

export function isMoodleAuthenticationFailureResponse(response: Response) {
  if (response.status === 401 || response.status === 403) {
    return true;
  }

  if (!response.url) {
    return false;
  }

  const redirectedUrl = new URL(response.url);
  const moodleSite = new URL(getMoodleSiteUrl());

  return (
    redirectedUrl.origin === moodleSite.origin &&
    redirectedUrl.pathname.startsWith("/login/")
  );
}
