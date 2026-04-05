import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "default" | "primary" | "outline" | "ghost" | "danger";
  size?: "default" | "sm" | "lg";
};

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default:
    "bg-[var(--foreground)] text-white hover:opacity-90",
  primary:
    "bg-[var(--accent)] text-white hover:bg-[var(--accent-soft)]",
  outline:
    "border border-[var(--line-strong)] text-[var(--foreground)] hover:bg-[var(--surface-strong)]",
  ghost:
    "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-strong)]",
  danger:
    "bg-[var(--danger)] text-white hover:opacity-90",
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-sm rounded-lg",
  default: "h-10 px-5 text-sm rounded-full",
  lg: "h-12 px-6 text-base rounded-full",
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
        "inline-flex items-center justify-center font-medium transition duration-150 disabled:pointer-events-none disabled:opacity-40",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  );
}
