import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-32 w-full rounded-lg border border-[var(--color-line-strong)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--color-foreground)] outline-none transition placeholder:text-[var(--color-muted)] hover:border-[var(--foreground)] focus:border-[var(--foreground)] focus:ring-2 focus:ring-[var(--foreground)]/10",
        className
      )}
      {...props}
    />
  );
}
