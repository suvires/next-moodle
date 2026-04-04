import sanitizeHtml from "sanitize-html";
import { getMoodleMediaProxyUrl, isAllowedMoodleUrl } from "@/lib/moodle-media";

type RichHtmlProps = {
  html?: string | null;
  className?: string;
  stripMoodleLinks?: boolean;
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
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  "*": ["class", "style", "title", "aria-label"],
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

function isMoodleLink(href: string) {
  const configuredUrl = process.env.MOODLE_API_URL?.trim();

  if (configuredUrl) {
    try {
      const moodleOrigin = new URL(configuredUrl).origin;
      return new URL(href, moodleOrigin).origin === moodleOrigin;
    } catch {
      return href.includes("mod/") || href.includes("/course/") || href.includes("pluginfile.php");
    }
  }

  return href.includes("mod/") || href.includes("/course/") || href.includes("pluginfile.php");
}

function sanitizeMoodleHtml(html: string, stripMoodleLinks = false) {
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
      a: (tagName, attribs) => {
        const href = attribs.href?.trim();

        if (stripMoodleLinks && href && isMoodleLink(href)) {
          const filteredAttribs = Object.fromEntries(
            Object.entries({
              class: attribs.class,
              title: attribs.title,
              "aria-label": attribs["aria-label"],
            }).filter(([, value]) => typeof value === "string" && value.length > 0)
          );

          return {
            tagName: "span",
            attribs: filteredAttribs,
          };
        }

        return sanitizeHtml.simpleTransform("a", {
          ...attribs,
          rel: "noreferrer noopener",
          target: "_blank",
        })(tagName, attribs);
      },
    },
  }).trim();
}

export function RichHtml({ html, className, stripMoodleLinks = false }: RichHtmlProps) {
  if (!html) {
    return null;
  }

  const sanitized = sanitizeMoodleHtml(html, stripMoodleLinks);

  if (!sanitized) {
    return null;
  }

  return (
    <div
      className={className ? `rich-html ${className}` : "rich-html"}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
