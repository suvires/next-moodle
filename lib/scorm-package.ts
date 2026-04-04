import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import {
  access,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import {
  appendMoodleToken,
  isMoodleAuthenticationFailureResponse,
} from "@/lib/moodle-media";
import { MoodleApiError } from "@/lib/moodle";
import { encodeScormRuntimePayload } from "@/lib/scorm-runtime";

const execFileAsync = promisify(execFile);
const SCORM_CACHE_ROOT = join(tmpdir(), "react-moodle-scorm");
const READY_MARKER = ".ready";
const META_FILENAME = "meta.json";

type PrepareScormPackageInput = {
  token: string;
  scormId: number;
  packageUrl: string;
  packageHash?: string;
  revision?: number;
  launchPath: string;
};

type ScormPackageMeta = {
  serveRoot: string;
};

function toBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function splitLaunchPath(launchPath: string) {
  const launchUrl = new URL(launchPath, "https://scorm.local/");
  const pathname = launchUrl.pathname.replace(/^\/+/, "") || "index.html";
  const search = launchUrl.search;

  return { pathname, search };
}

function getScormPackageCacheKey({
  scormId,
  packageUrl,
  packageHash,
  revision,
}: Omit<PrepareScormPackageInput, "token" | "launchPath">) {
  const stablePart = packageHash?.trim() || packageUrl;
  const digest = createHash("sha1")
    .update(`${scormId}:${revision || 0}:${stablePart}`)
    .digest("hex")
    .slice(0, 16);

  return `scorm-${scormId}-${digest}`;
}

function getPackagePaths(cacheKey: string) {
  const packageDir = join(SCORM_CACHE_ROOT, cacheKey);
  const filesDir = join(packageDir, "files");
  const zipPath = join(packageDir, "package.zip");
  const readyPath = join(packageDir, READY_MARKER);
  const metaPath = join(packageDir, META_FILENAME);

  return { packageDir, filesDir, zipPath, readyPath, metaPath };
}

async function pathExists(target: string) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function detectServeRoot(filesDir: string, launchPathname: string) {
  const directMatch = join(filesDir, launchPathname);

  if (await pathExists(directMatch)) {
    return filesDir;
  }

  const topLevelEntries = await readdir(filesDir, { withFileTypes: true });
  const topLevelDirectories = topLevelEntries.filter((entry) => entry.isDirectory());

  if (topLevelDirectories.length === 1) {
    const nestedRoot = join(filesDir, topLevelDirectories[0].name);

    if (await pathExists(join(nestedRoot, launchPathname))) {
      return nestedRoot;
    }
  }

  return filesDir;
}

async function waitForReady(readyPath: string, timeoutMs = 30000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await pathExists(readyPath)) {
      return;
    }

    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }

  throw new Error("Timed out waiting for SCORM package extraction.");
}

export async function prepareScormPackage(input: PrepareScormPackageInput) {
  const cacheKey = getScormPackageCacheKey(input);
  const { packageDir, filesDir, zipPath, readyPath, metaPath } = getPackagePaths(cacheKey);
  const lockDir = `${packageDir}.lock`;
  const { pathname } = splitLaunchPath(input.launchPath);

  await mkdir(SCORM_CACHE_ROOT, { recursive: true });

  if (await pathExists(readyPath)) {
    return cacheKey;
  }

  try {
    await mkdir(lockDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      await waitForReady(readyPath);
      return cacheKey;
    }

    throw error;
  }

  try {
    await rm(packageDir, { recursive: true, force: true });
    await mkdir(filesDir, { recursive: true });

    const response = await fetch(appendMoodleToken(input.packageUrl, input.token), {
      cache: "no-store",
    });

    if (isMoodleAuthenticationFailureResponse(response)) {
      throw new MoodleApiError("La sesión con Moodle ya no es válida.", "invalidtoken");
    }

    if (!response.ok) {
      throw new Error(`SCORM package download failed with ${response.status}.`);
    }

    const packageBuffer = Buffer.from(await response.arrayBuffer());
    await writeFile(zipPath, packageBuffer);

    await execFileAsync("/usr/bin/unzip", ["-o", zipPath, "-d", filesDir]);

    const serveRoot = await detectServeRoot(filesDir, pathname);

    await writeFile(
      metaPath,
      JSON.stringify({
        serveRoot,
      } satisfies ScormPackageMeta)
    );
    await writeFile(readyPath, "ok");
  } catch (error) {
    await rm(packageDir, { recursive: true, force: true });
    throw error;
  } finally {
    await rm(lockDir, { recursive: true, force: true });
    await unlink(zipPath).catch(() => undefined);
  }

  return cacheKey;
}

export function getScormExtractedLaunchUrl(
  cacheKey: string,
  launchPath: string,
  runtimePayload?: Parameters<typeof encodeScormRuntimePayload>[0]
) {
  const { pathname, search } = splitLaunchPath(launchPath);
  const url = new URL(
    `/api/moodle-scorm-package/${toBase64Url(cacheKey)}/${pathname}`,
    "http://localhost"
  );

  if (search) {
    const searchParams = new URLSearchParams(search.replace(/^\?/, ""));
    for (const [key, value] of searchParams.entries()) {
      url.searchParams.append(key, value);
    }
  }

  if (runtimePayload) {
    url.searchParams.set("__scorm_runtime", encodeScormRuntimePayload(runtimePayload));
  }

  return `${url.pathname}${url.search}`;
}

export async function resolveScormExtractedFilePath(
  encodedCacheKey: string,
  pathParts: string[]
) {
  const cacheKey = Buffer.from(encodedCacheKey, "base64url").toString("utf8");
  const { metaPath, readyPath } = getPackagePaths(cacheKey);

  if (!(await pathExists(readyPath)) || !(await pathExists(metaPath))) {
    return null;
  }

  const meta = JSON.parse(await readFile(metaPath, "utf8")) as ScormPackageMeta;
  const relativePath = pathParts.length > 0 ? pathParts.join("/") : "index.html";
  const resolvedPath = resolve(meta.serveRoot, relativePath);
  const resolvedRoot = resolve(meta.serveRoot);

  if (!resolvedPath.startsWith(`${resolvedRoot}/`) && resolvedPath !== resolvedRoot) {
    return null;
  }

  const fileStats = await stat(resolvedPath).catch(() => null);

  if (!fileStats?.isFile()) {
    return null;
  }

  return {
    absolutePath: resolvedPath,
    cacheKey,
  };
}
