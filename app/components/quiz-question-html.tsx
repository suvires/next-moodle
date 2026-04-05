import sanitizeHtml from "sanitize-html";
import { getMoodleMediaProxyUrl, isAllowedMoodleUrl } from "@/lib/moodle-media";

type QuizQuestionHtmlProps = {
  html?: string | null;
  className?: string;
};

const ALLOWED_TAGS = [
  ...sanitizeHtml.defaults.allowedTags,
  "img",
  "iframe",
  "video",
  "source",
  "figure",
  "figcaption",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "caption",
  "colgroup",
  "col",
  "hr",
  "span",
  "div",
  "s",
  "u",
  "input",
  "textarea",
  "select",
  "option",
  "label",
  "fieldset",
  "legend",
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  "*": ["class", "style", "title", "aria-label", "id", "role"],
  a: ["href", "name", "target", "rel"],
  img: ["src", "srcset", "alt", "title", "width", "height", "loading"],
  iframe: [
    "src",
    "title",
    "width",
    "height",
    "allow",
    "allowfullscreen",
    "frameborder",
  ],
  video: ["src", "controls", "width", "height", "poster", "preload"],
  source: ["src", "type"],
  table: ["summary"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan", "scope"],
  input: [
    "type",
    "name",
    "value",
    "checked",
    "disabled",
    "readonly",
    "placeholder",
    "size",
    "maxlength",
    "minlength",
    "min",
    "max",
    "step",
    "autocomplete",
  ],
  textarea: [
    "name",
    "rows",
    "cols",
    "placeholder",
    "maxlength",
    "minlength",
    "disabled",
    "readonly",
  ],
  select: ["name", "disabled", "multiple", "size"],
  option: ["value", "selected", "disabled"],
  label: ["for"],
  fieldset: ["disabled"],
};

const ALLOWED_SCHEMES = ["http", "https", "mailto", "tel", "data"];

function rewriteMoodleMediaUrl(rawUrl?: string) {
  if (!rawUrl) {
    return rawUrl;
  }

  if (rawUrl.startsWith("data:")) {
    return rawUrl;
  }

  try {
    return isAllowedMoodleUrl(rawUrl) ? getMoodleMediaProxyUrl(rawUrl) : rawUrl;
  } catch {
    return rawUrl;
  }
}

function rewriteSrcset(rawSrcset?: string) {
  if (!rawSrcset) {
    return rawSrcset;
  }

  return rawSrcset
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [url, descriptor] = entry.split(/\s+/, 2);
      const rewrittenUrl = rewriteMoodleMediaUrl(url);
      return descriptor ? `${rewrittenUrl} ${descriptor}` : rewrittenUrl;
    })
    .join(", ");
}

function rewriteMediaAttribs(attribs: Record<string, string | undefined>) {
  return Object.fromEntries(
    Object.entries({
      ...attribs,
      src: rewriteMoodleMediaUrl(attribs.src),
      srcset: rewriteSrcset(attribs.srcset),
      poster: rewriteMoodleMediaUrl(attribs.poster),
    }).filter((entry): entry is [string, string] => {
      const [, value] = entry;
      return typeof value === "string" && value.length > 0;
    })
  ) as Record<string, string>;
}

function sanitizeQuizHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ALLOWED_SCHEMES,
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
    },
    transformTags: {
      img: (tagName, attribs) => ({
        tagName,
        attribs: rewriteMediaAttribs(attribs),
      }),
      source: (tagName, attribs) => ({
        tagName,
        attribs: rewriteMediaAttribs(attribs),
      }),
      video: (tagName, attribs) => ({
        tagName,
        attribs: rewriteMediaAttribs(attribs),
      }),
      iframe: (tagName, attribs) => ({
        tagName,
        attribs: rewriteMediaAttribs(attribs),
      }),
      form: "div",
      button: "span",
      script: "span",
      a: (tagName, attribs) =>
        sanitizeHtml.simpleTransform("a", {
          ...attribs,
          rel: "noreferrer noopener",
          target: "_blank",
        })(tagName, attribs),
    },
  }).trim();
}

export function QuizQuestionHtml({
  html,
  className,
}: QuizQuestionHtmlProps) {
  if (!html) {
    return null;
  }

  const sanitized = sanitizeQuizHtml(html);

  if (!sanitized) {
    return null;
  }

  return (
    <div
      className={className ? `quiz-rendered ${className}` : "quiz-rendered"}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
