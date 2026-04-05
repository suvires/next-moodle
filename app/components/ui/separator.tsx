import { Separator as HeroSeparator } from "@heroui/react";
import { cn } from "@/lib/utils";
import type * as React from "react";

type SeparatorProps = React.ComponentProps<typeof HeroSeparator> & {
  decorative?: boolean;
};

export function Separator({
  className,
  orientation = "horizontal",
  decorative,
  ...props
}: SeparatorProps) {
  return (
    <HeroSeparator
      orientation={orientation}
      className={cn(
        "shrink-0 bg-[var(--line)]",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
      {...props}
    />
  );
}
