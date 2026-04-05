import * as React from "react";
import Link from "next/link";
import { buttonVariants } from "@heroui/styles";
import { cn } from "@/lib/utils";

export { Button } from "@heroui/react";

type LinkButtonVariant = "primary" | "secondary" | "tertiary" | "outline" | "ghost" | "danger" | "danger-soft";
type LinkButtonSize = "sm" | "md" | "lg";

type LinkButtonProps = {
  href: string;
  variant?: LinkButtonVariant;
  size?: LinkButtonSize;
  className?: string;
  children: React.ReactNode;
  /** Render as a plain anchor element instead of Next.js Link */
  as?: "a";
  target?: string;
  rel?: string;
  download?: string | boolean;
};

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  as: Comp,
  ...props
}: LinkButtonProps) {
  const classes = buttonVariants({ variant, size });
  if (Comp === "a") {
    return (
      <a href={href} className={cn(classes, className)} {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cn(classes, className)} {...(props as Record<string, unknown>)}>
      {children}
    </Link>
  );
}
