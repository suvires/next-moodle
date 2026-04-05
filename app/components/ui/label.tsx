import { Label as HeroLabel } from "@heroui/react";
import { cn } from "@/lib/utils";
import type * as React from "react";

export function Label({
  className,
  ...props
}: React.ComponentProps<typeof HeroLabel>) {
  return (
    <HeroLabel
      className={cn(
        "cursor-pointer text-xs font-semibold uppercase tracking-wide text-[var(--muted)]",
        className
      )}
      {...props}
    />
  );
}
