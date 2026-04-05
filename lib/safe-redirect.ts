/**
 * Validates that a return path is a relative URL (starts with /)
 * to prevent open redirect attacks.
 */
export function sanitizeReturnPath(
  rawPath: string | null,
  fallback: string
): string {
  const path = rawPath?.trim() || fallback;

  // Must start with / and not start with // (protocol-relative URL)
  if (path.startsWith("/") && !path.startsWith("//")) {
    return path;
  }

  return fallback;
}
