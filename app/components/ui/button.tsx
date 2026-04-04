import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm";
};

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default:
    "border border-[rgba(255,163,102,0.45)] bg-[linear-gradient(135deg,var(--color-accent),#ffb36f)] text-[#09111f] shadow-[0_18px_42px_rgba(255,138,61,0.22)] hover:-translate-y-0.5 hover:shadow-[0_22px_56px_rgba(255,138,61,0.3)]",
  outline:
    "border border-white/10 bg-white/4 text-[var(--color-foreground)] hover:-translate-y-0.5 hover:border-[var(--color-accent)]/55 hover:bg-white/8",
  ghost:
    "bg-transparent text-[var(--color-muted)] hover:text-[var(--color-foreground)]",
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "min-h-12 px-5 text-[0.72rem] tracking-[0.22em]",
  sm: "min-h-10 px-4 text-[0.66rem] tracking-[0.2em]",
};

export function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center rounded-[1rem] font-semibold uppercase transition duration-200 disabled:pointer-events-none disabled:translate-y-0 disabled:cursor-wait disabled:border-white/8 disabled:bg-white/8 disabled:text-white/50",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  );
}
