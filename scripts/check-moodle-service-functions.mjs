#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const DEFAULT_ENV_PATH = ".env";
const SOURCE_DIRS = ["app", "lib"];
const FUNCTION_PATTERN =
  /\b(?:core|mod|enrol|tool|local|message_popup|gradereport)_[a-z0-9_]+\b/g;
const EXACT_FUNCTION_PATTERN =
  /^(?:core|mod|enrol|tool|local|message_popup|gradereport)_[a-z0-9_]+$/;
const MANIFEST_PATH = "functions.md";
const AVAILABLE_STATUSES = new Set([
  "available",
  "available_invalid_params",
  "available_feature_disabled",
]);

function printHelp() {
  console.log(`Usage: node scripts/check-moodle-service-functions.mjs [options]

Checks which Moodle web service functions used by this repo are accessible with
the configured token. Functions returning access-related errors are reported as
"missing_or_denied" and listed as candidates to add to the Moodle service.

Modes:
  (default)      Probe each discovered function against the Moodle REST API.
  --list         Print sync-manifest function names only (no network calls needed).
  --list-discovered
                 Print raw regex-discovered names from app/ and lib/ for audit.
  --sync         Call local_next_moodle_sync_service_functions to sync functions
                 to the configured target service. Requires the plugin to be
                 installed and configured in Moodle.

Options:
  --env <path>       Path to the env file. Default: .env
  --json             Print machine-readable JSON
  --sync-token <t>   Token to use for --sync (overrides MOODLE_API_TOKEN)
  --dry-run          With --sync: compute diff but do not apply changes
  --help             Show this help
`);
}

function parseArgs(argv) {
  const options = {
    envPath: DEFAULT_ENV_PATH,
    json: false,
    help: false,
    list: false,
    listDiscovered: false,
    sync: false,
    syncToken: null,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--env") {
      const value = argv[index + 1];

      if (!value) {
        throw new Error("Missing value for --env.");
      }

      options.envPath = value;
      index += 1;
      continue;
    }

    if (arg === "--json") {
      options.json = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--list") {
      options.list = true;
      continue;
    }

    if (arg === "--list-discovered") {
      options.listDiscovered = true;
      continue;
    }

    if (arg === "--sync") {
      options.sync = true;
      continue;
    }

    if (arg === "--sync-token") {
      const value = argv[index + 1];

      if (!value) {
        throw new Error("Missing value for --sync-token.");
      }

      options.syncToken = value;
      index += 1;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function parseEnvFile(raw) {
  const values = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

async function loadEnvFile(envPath) {
  const raw = await readFile(envPath, "utf8");
  return parseEnvFile(raw);
}

function resolveMoodleConfig(envValues) {
  const rawUrl = envValues.MOODLE_API_URL?.trim();
  const token = envValues.MOODLE_API_TOKEN?.trim();
  const service = envValues.MOODLE_SERVICE?.trim();

  if (!rawUrl) {
    throw new Error("Missing MOODLE_API_URL in the env file.");
  }

  if (!token) {
    throw new Error("Missing MOODLE_API_TOKEN in the env file.");
  }

  if (!service) {
    throw new Error("Missing MOODLE_SERVICE in the env file.");
  }

  const normalizedUrl = stripTrailingSlash(rawUrl);
  let siteUrl = normalizedUrl;

  if (normalizedUrl.endsWith("/webservice/rest/server.php")) {
    siteUrl = normalizedUrl.replace(/\/webservice\/rest\/server\.php$/, "");
  } else if (normalizedUrl.endsWith("/login/token.php")) {
    siteUrl = normalizedUrl.replace(/\/login\/token\.php$/, "");
  }

  return {
    token,
    service,
    siteUrl,
    restUrl: `${siteUrl}/webservice/rest/server.php`,
  };
}

async function collectSourceFiles(directoryPath) {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const fullPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(fullPath)));
      continue;
    }

    if (/\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

async function discoverUsedFunctions(rootDir) {
  const found = new Set();

  for (const relativeDir of SOURCE_DIRS) {
    const fullDir = path.join(rootDir, relativeDir);
    let files = [];

    try {
      files = await collectSourceFiles(fullDir);
    } catch {
      continue;
    }

    for (const filePath of files) {
      const source = await readFile(filePath, "utf8");
      const matches = source.match(FUNCTION_PATTERN) || [];

      for (const match of matches) {
        found.add(match);
      }
    }
  }

  return [...found].sort();
}

function cleanCell(cell) {
  return cell.trim().replace(/^`|`$/g, "");
}

function isDividerRow(columns) {
  return columns.every((column) => /^:?-{3,}:?$/.test(column.replace(/\s+/g, "")));
}

async function readManifestFunctions(rootDir) {
  const manifestPath = path.join(rootDir, MANIFEST_PATH);
  const raw = await readFile(manifestPath, "utf8");
  const entries = [];

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed.startsWith("|")) {
      continue;
    }

    const columns = trimmed
      .split("|")
      .slice(1, -1)
      .map((column) => column.trim());

    if (columns.length < 3 || isDividerRow(columns)) {
      continue;
    }

    const [functionCell, wrapperCell, locationCell, syncCell] = columns;
    const wsfunction = cleanCell(functionCell);

    if (!EXACT_FUNCTION_PATTERN.test(wsfunction)) {
      continue;
    }

    entries.push({
      function: wsfunction,
      wrapper: cleanCell(wrapperCell),
      location: cleanCell(locationCell),
      sync: cleanCell(syncCell || "") || "include",
    });
  }

  return entries;
}

function resolveManifestFunctions(entries) {
  return [...new Set(
    entries
      .filter((entry) => entry.sync !== "exclude-temp")
      .map((entry) => entry.function)
  )].sort();
}

function isErrorPayload(payload) {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      ("error" in payload ||
        "errorcode" in payload ||
        "exception" in payload ||
        "message" in payload)
  );
}

function classifyError(payload) {
  const code = String(payload.errorcode || payload.exception || "").toLowerCase();
  const message = String(payload.message || payload.error || "").toLowerCase();
  const combined = `${code} ${message}`;

  if (
    combined.includes("invalidtoken") ||
    combined.includes("invalid token") ||
    combined.includes("token no válida") ||
    combined.includes("token no valida") ||
    combined.includes("token not found")
  ) {
    return "invalid_token";
  }

  if (
    combined.includes("accessexception") ||
    combined.includes("access control exception") ||
    combined.includes("not available") ||
    combined.includes("can not be executed") ||
    combined.includes("cannot be executed") ||
    combined.includes("permission") ||
    combined.includes("required capability") ||
    combined.includes("servicenotavailable")
  ) {
    return "missing_or_denied";
  }

  if (
    combined.includes("invalid_parameter") ||
    combined.includes("invalidparameter") ||
    combined.includes("missing required key") ||
    combined.includes("missing required") ||
    combined.includes("invalid response value detected")
  ) {
    return "available_invalid_params";
  }

  if (
    combined.includes("disabled") ||
    combined.includes("deshabilitado") ||
    combined.includes("not enabled") ||
    combined.includes("not active") ||
    combined.includes("is turned off")
  ) {
    return "available_feature_disabled";
  }

  return "error";
}

async function probeFunction(restUrl, token, wsfunction) {
  const body = new URLSearchParams({
    wstoken: token,
    wsfunction,
    moodlewsrestformat: "json",
  });

  let response;

  try {
    response = await fetch(restUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    });
  } catch (error) {
    return {
      function: wsfunction,
      status: "network_error",
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }

  const text = await response.text();
  let payload;

  try {
    payload = JSON.parse(text);
  } catch {
    return {
      function: wsfunction,
      status: response.ok ? "unknown_response" : "http_error",
      ok: false,
      detail: text.slice(0, 500),
      httpStatus: response.status,
    };
  }

  if (response.ok && !isErrorPayload(payload)) {
    return {
      function: wsfunction,
      status: "available",
      ok: true,
      httpStatus: response.status,
    };
  }

  const status = isErrorPayload(payload) ? classifyError(payload) : "error";

  return {
    function: wsfunction,
    status,
    ok: AVAILABLE_STATUSES.has(status),
    httpStatus: response.status,
    errorcode: payload?.errorcode || payload?.exception,
    message: payload?.message || payload?.error,
  };
}

function formatReport(config, results, json) {
  const hasInvalidToken = results.some((item) => item.status === "invalid_token");
  const summary = {
    siteUrl: config.siteUrl,
    service: config.service,
    checked: results.length,
    available: results.filter((item) => AVAILABLE_STATUSES.has(item.status)).length,
    missingOrDenied: results.filter((item) => item.status === "missing_or_denied").length,
    invalidToken: results.filter((item) => item.status === "invalid_token").length,
    errors: results.filter(
      (item) =>
        ![...AVAILABLE_STATUSES, "missing_or_denied", "invalid_token"].includes(item.status)
    ).length,
    functionsToAdd: hasInvalidToken
      ? []
      : results
          .filter((item) => item.status === "missing_or_denied")
          .map((item) => item.function),
  };

  if (json) {
    return JSON.stringify({ summary, results }, null, 2);
  }

  const lines = [
    `Moodle site: ${summary.siteUrl}`,
    `Service: ${summary.service}`,
    `Functions checked: ${summary.checked}`,
    `Available: ${summary.available}`,
    `Missing or denied: ${summary.missingOrDenied}`,
    `Invalid token: ${summary.invalidToken}`,
    `Other errors: ${summary.errors}`,
    "",
  ];

  if (hasInvalidToken) {
    lines.push(
      "The configured MOODLE_API_TOKEN is not valid for this Moodle site, so the script cannot infer which functions are missing from the service."
    );
    lines.push("");
  }

  lines.push("Results:");

  for (const result of results) {
    const suffix = result.message ? ` - ${result.message}` : "";
    lines.push(`- ${result.function}: ${result.status}${suffix}`);
  }

  lines.push("");
  lines.push("Functions to add to the service:");

  if (summary.functionsToAdd.length === 0) {
    lines.push("- none");
  } else {
    for (const wsfunction of summary.functionsToAdd) {
      lines.push(`- ${wsfunction}`);
    }
  }

  return lines.join("\n");
}

function resolveSyncConfig(envValues, syncTokenArg) {
  const rawUrl = envValues.MOODLE_API_URL?.trim();

  if (!rawUrl) {
    throw new Error("Missing MOODLE_API_URL in the env file.");
  }

  const token = syncTokenArg || envValues.MOODLE_API_TOKEN?.trim();

  if (!token) {
    throw new Error("Missing MOODLE_API_TOKEN in the env file (or pass --sync-token).");
  }

  let siteUrl = stripTrailingSlash(rawUrl);

  if (siteUrl.endsWith("/webservice/rest/server.php")) {
    siteUrl = siteUrl.replace(/\/webservice\/rest\/server\.php$/, "");
  } else if (siteUrl.endsWith("/login/token.php")) {
    siteUrl = siteUrl.replace(/\/login\/token\.php$/, "");
  }

  return {
    token,
    restUrl: `${siteUrl}/webservice/rest/server.php`,
  };
}

async function callSyncFunction(restUrl, token, functions, dryRun) {
  // Moodle REST expects indexed array notation: functions[0]=…&functions[1]=…
  const params = new URLSearchParams({
    wstoken: token,
    wsfunction: "local_next_moodle_sync_service_functions",
    moodlewsrestformat: "json",
    dryrun: dryRun ? "1" : "0",
  });

  functions.forEach((fn, i) => params.append(`functions[${i}]`, fn));

  let response;

  try {
    response = await fetch(restUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
      cache: "no-store",
    });
  } catch (error) {
    throw new Error(
      `Network error calling sync function: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  const text = await response.text();
  let payload;

  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(
      `Non-JSON response from Moodle sync endpoint (HTTP ${response.status}): ${text.slice(0, 300)}`
    );
  }

  if (payload && ("exception" in payload || "errorcode" in payload)) {
    throw new Error(
      `Moodle sync error [${payload.errorcode ?? payload.exception}]: ${payload.message ?? payload.error}`
    );
  }

  return payload;
}

function formatSyncResult(result, json) {
  if (json) {
    return JSON.stringify(result, null, 2);
  }

  const lines = [
    `Service: ${result.service_name} (id=${result.service_id})`,
    `Dry run: ${result.dryrun}`,
    `Added (${result.added.length}): ${result.added.length > 0 ? result.added.join(", ") : "none"}`,
    `Removed (${result.removed.length}): ${result.removed.length > 0 ? result.removed.join(", ") : "none"}`,
    `Unchanged: ${result.unchanged.length}`,
  ];

  return lines.join("\n");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const rootDir = process.cwd();

  if (options.listDiscovered) {
    const functions = await discoverUsedFunctions(rootDir);
    console.log(options.json ? JSON.stringify(functions, null, 2) : functions.join("\n"));
    return;
  }

  const manifestEntries = await readManifestFunctions(rootDir);
  const functions = resolveManifestFunctions(manifestEntries);

  // --list mode: no network calls, no env file needed.
  if (options.list) {
    console.log(options.json ? JSON.stringify(functions, null, 2) : functions.join("\n"));
    return;
  }

  const envPath = path.resolve(rootDir, options.envPath);
  const envValues = await loadEnvFile(envPath);

  if (functions.length === 0) {
    throw new Error(`No Moodle web service functions marked for sync were found in ${MANIFEST_PATH}.`);
  }

  // --sync mode: call the plugin webservice to sync the function list.
  if (options.sync) {
    const syncConfig = resolveSyncConfig(envValues, options.syncToken);
    const result = await callSyncFunction(syncConfig.restUrl, syncConfig.token, functions, options.dryRun);
    console.log(formatSyncResult(result, options.json));
    return;
  }

  // Default mode: probe each function.
  const config = resolveMoodleConfig(envValues);
  const results = [];

  for (const wsfunction of functions) {
    results.push(await probeFunction(config.restUrl, config.token, wsfunction));
  }

  console.log(formatReport(config, results, options.json));

  const hasUnexpectedErrors = results.some((item) =>
    ["network_error", "http_error", "unknown_response", "error", "invalid_token"].includes(
      item.status
    )
  );

  if (hasUnexpectedErrors) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
