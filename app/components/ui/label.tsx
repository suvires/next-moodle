"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

export function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn(
        "text-[0.68rem] font-semibold tracking-[0.24em] text-[var(--color-accent-soft)] uppercase",
        className
      )}
      {...props}
    />
  );
}
