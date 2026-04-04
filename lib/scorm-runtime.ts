type ScormRuntimePayload = {
  scormId: number;
  scoId: number;
  attempt: number;
  commitUrl: string;
  initialData: Record<string, string>;
};

const USER_DATA_ALIASES: Record<string, string> = {
  credit: "cmi.core.credit",
  entry: "cmi.core.entry",
  mode: "cmi.core.lesson_mode",
  parameters: "cmi.launch_data",
  score_raw: "cmi.core.score.raw",
  status: "cmi.core.lesson_status",
  student_id: "cmi.core.student_id",
  student_name: "cmi.core.student_name",
};

export function buildScormRuntimeInitialData(
  scoUserData?:
    | {
        userdata?: Array<{ element?: string; value?: string }>;
        defaultdata?: Array<{ element?: string; value?: string }>;
      }
    | null
) {
  const initialData: Record<string, string> = {
    "cmi.core._children":
      "student_id,student_name,lesson_location,credit,lesson_status,entry,score,total_time,lesson_mode,exit,session_time",
    "cmi.core.score._children": "raw,min,max",
    "cmi.student_data._children": "mastery_score,max_time_allowed,time_limit_action",
    "cmi.student_preference._children": "audio,language,speed,text",
  };

  for (const entry of scoUserData?.defaultdata || []) {
    if (entry.element) {
      initialData[entry.element] = entry.value || "";
    }
  }

  for (const entry of scoUserData?.userdata || []) {
    if (!entry.element) {
      continue;
    }

    const key =
      entry.element.startsWith("cmi.")
        ? entry.element
        : USER_DATA_ALIASES[entry.element] || entry.element;

    initialData[key] = entry.value || "";
  }

  return initialData;
}

export function encodeScormRuntimePayload(payload: ScormRuntimePayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function decodeScormRuntimePayload(rawValue?: string | null) {
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(
      Buffer.from(rawValue, "base64url").toString("utf8")
    ) as ScormRuntimePayload;
  } catch {
    return null;
  }
}

export function buildScormRuntimeInjection(payload: ScormRuntimePayload) {
  const serializedPayload = JSON.stringify(payload);

  return `
<script>
(() => {
  const config = ${serializedPayload};
  const errorMessages = {
    "0": "No error",
    "101": "General exception",
    "201": "Invalid argument error",
    "301": "Not initialized",
    "391": "Commit failure",
    "401": "Not implemented error",
    "402": "Invalid set value, element is a keyword",
    "403": "Element is read only",
    "404": "Element is write only",
    "405": "Incorrect data type"
  };
  const state = {
    initialized: false,
    terminated: false,
    lastError: "0",
    data: { ...config.initialData },
    dirty: false,
    commitInFlight: null
  };

  const persistablePrefixes = ["cmi."];
  const readOnlyElements = new Set([
    "cmi.core._children",
    "cmi.core.student_id",
    "cmi.core.student_name",
    "cmi.core.credit",
    "cmi.core.entry",
    "cmi.core.lesson_mode",
    "cmi.student_data._children",
    "cmi.student_preference._children",
    "cmi.core.score._children"
  ]);

  function setLastError(code) {
    state.lastError = code;
  }

  function isInitialized() {
    if (!state.initialized || state.terminated) {
      setLastError("301");
      return false;
    }
    return true;
  }

  function normalizeValue(value) {
    return value == null ? "" : String(value);
  }

  function isPersistableElement(element) {
    return (
      typeof element === "string" &&
      persistablePrefixes.some((prefix) => element.startsWith(prefix)) &&
      !element.endsWith("._children")
    );
  }

  async function commitTracks(useKeepalive = false) {
    if (!state.dirty && state.commitInFlight) {
      return state.commitInFlight;
    }

    const tracks = Object.entries(state.data)
      .filter(([element]) => isPersistableElement(element))
      .map(([element, value]) => ({
        element,
        value: normalizeValue(value)
      }));

    if (tracks.length === 0) {
      state.dirty = false;
      return true;
    }

    state.commitInFlight = fetch(config.commitUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        scormId: config.scormId,
        scoId: config.scoId,
        attempt: config.attempt,
        tracks
      }),
      keepalive: useKeepalive
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorBody = await response.text().catch(() => "");
          throw new Error(errorBody || "SCORM commit failed");
        }

        state.dirty = false;
        return true;
      })
      .catch((error) => {
        setLastError("391");
        return false;
      })
      .finally(() => {
        state.commitInFlight = null;
      });

    return state.commitInFlight;
  }

  function LMSInitialize() {
    if (state.initialized) {
      setLastError("101");
      return "false";
    }

    state.initialized = true;
    state.terminated = false;
    setLastError("0");
    return "true";
  }

  function LMSFinish() {
    if (!isInitialized()) {
      return "false";
    }

    state.terminated = true;
    state.initialized = false;
    void commitTracks(true);
    setLastError("0");
    return "true";
  }

  function LMSGetValue(element) {
    if (!isInitialized()) {
      return "";
    }

    setLastError("0");
    return normalizeValue(state.data[element] ?? "");
  }

  function LMSSetValue(element, value) {
    if (!isInitialized()) {
      return "false";
    }

    if (readOnlyElements.has(element)) {
      setLastError("403");
      return "false";
    }

    state.data[element] = normalizeValue(value);
    state.dirty = true;
    setLastError("0");
    return "true";
  }

  function LMSCommit() {
    if (!isInitialized()) {
      return "false";
    }

    void commitTracks(false);
    setLastError("0");
    return "true";
  }

  function LMSGetLastError() {
    return state.lastError;
  }

  function LMSGetErrorString(code) {
    return errorMessages[String(code)] || "Unknown error";
  }

  function LMSGetDiagnostic(code) {
    return LMSGetErrorString(code || state.lastError);
  }

  const api12 = {
    LMSInitialize,
    LMSFinish,
    LMSGetValue,
    LMSSetValue,
    LMSCommit,
    LMSGetLastError,
    LMSGetErrorString,
    LMSGetDiagnostic
  };

  const api2004 = {
    Initialize: LMSInitialize,
    Terminate: LMSFinish,
    GetValue: LMSGetValue,
    SetValue: LMSSetValue,
    Commit: LMSCommit,
    GetLastError: LMSGetLastError,
    GetErrorString: LMSGetErrorString,
    GetDiagnostic: LMSGetDiagnostic
  };

  function attachApi(target) {
    if (!target) {
      return;
    }

    target.API = api12;
    target.API_1484_11 = api2004;
  }

  attachApi(window);

  try {
    if (window.parent && window.parent !== window) {
      attachApi(window.parent);
    }
  } catch {}

  try {
    if (window.top && window.top !== window && window.top !== window.parent) {
      attachApi(window.top);
    }
  } catch {}

  window.__SCORM_RUNTIME__ = {
    config,
    state
  };

  window.addEventListener("pagehide", () => {
    void commitTracks(true);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      void commitTracks(true);
    }
  });

  window.setInterval(() => {
    if (state.dirty) {
      void commitTracks(false);
    }
  }, 15000);
})();
</script>`.trim();
}
