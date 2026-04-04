#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const DEFAULT_ENV_PATH = ".env";
const SOURCE_DIRS = ["app", "lib"];
const FUNCTION_PATTERN = /\b(?:core|mod|enrol|tool|local)_[a-z0-9_]+\b/g;

function printHelp() {
  console.log(`Usage: node scripts/check-moodle-service-functions.mjs [options]

Checks which Moodle web service functions used by this repo are accessible with
the configured token. Functions returning access-related errors are reported as
"missing_or_denied" and listed as candidates to add to the Moodle service.

Options:
  --env <path>   Path to the env file. Default: .env
  --json         Print machine-readable JSON
  --help         Show this help
`);
}

function parseArgs(argv) {
  const options = {
    envPath: DEFAULT_ENV_PATH,
    json: false,
    help: false,
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
    ok: status === "available" || status === "available_invalid_params",
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
    available: results.filter((item) =>
      item.status === "available" || item.status === "available_invalid_params"
    ).length,
    missingOrDenied: results.filter((item) => item.status === "missing_or_denied").length,
    invalidToken: results.filter((item) => item.status === "invalid_token").length,
    errors: results.filter(
      (item) =>
        ![
          "available",
          "available_invalid_params",
          "missing_or_denied",
          "invalid_token",
        ].includes(item.status)
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

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const rootDir = process.cwd();
  const envPath = path.resolve(rootDir, options.envPath);
  const envValues = await loadEnvFile(envPath);
  const config = resolveMoodleConfig(envValues);
  const functions = await discoverUsedFunctions(rootDir);

  if (functions.length === 0) {
    throw new Error("No Moodle web service functions were found in app/ or lib/.");
  }

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
