"use client";

import { startTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type ReactiveExternalLinkProps = {
  href: string;
  ariaLabel: string;
  className?: string;
};

const REFRESH_DELAYS_MS = [900, 2400, 5000];
const MAX_LISTEN_WINDOW_MS = 15000;

export function ReactiveExternalLink({
  href,
  ariaLabel,
  className,
}: ReactiveExternalLinkProps) {
  const router = useRouter();
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  function scheduleRefreshes() {
    cleanupRef.current?.();

    const refresh = () => {
      startTransition(() => {
        router.refresh();
      });
    };

    const timeoutIds = REFRESH_DELAYS_MS.map((delay) => window.setTimeout(refresh, delay));
    let cleanedUp = false;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refresh();
        cleanup();
      }
    };

    const handleFocus = () => {
      refresh();
      cleanup();
    };

    const cleanup = () => {
      if (cleanedUp) {
        return;
      }

      cleanedUp = true;
      timeoutIds.forEach((id) => window.clearTimeout(id));
      window.clearTimeout(stopListeningTimeoutId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };

    const stopListeningTimeoutId = window.setTimeout(cleanup, MAX_LISTEN_WINDOW_MS);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    cleanupRef.current = cleanup;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={ariaLabel}
      className={className}
      onClick={scheduleRefreshes}
    />
  );
}
