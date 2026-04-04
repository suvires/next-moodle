import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-14 w-full rounded-[1.15rem] border border-white/10 bg-white/4 px-4 text-[0.98rem] text-[var(--color-foreground)] outline-none transition placeholder:text-white/28 focus:border-[var(--color-accent-cool)] focus:bg-white/6 focus:ring-4 focus:ring-[rgba(102,215,255,0.12)]",
        className
      )}
      {...props}
    />
  );
}
