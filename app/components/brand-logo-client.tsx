"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

type BrandLogoClientProps = {
  href: string;
  siteName: string;
  imageSrc?: string;
  size?: "default" | "lg" | "xl";
  className?: string;
  priority?: boolean;
};

const sizeStyles = {
  default: { container: "h-8 w-8", sizes: "32px" },
  lg: { container: "h-14 w-14", sizes: "56px" },
  xl: { container: "h-32 w-32", sizes: "128px" },
};

export function BrandLogoClient({
  href,
  siteName,
  imageSrc,
  size = "default",
  className,
  priority = false,
}: BrandLogoClientProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = !!imageSrc && !imgFailed;
  const s = sizeStyles[size];

  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2.5 transition", className)}
    >
      {showImage ? (
        <div
          className={cn(
            "relative flex shrink-0 items-center justify-center overflow-hidden",
            s.container
          )}
        >
          <Image
            src={imageSrc}
            alt={siteName}
            fill
            unoptimized
            priority={priority}
            sizes={s.sizes}
            className="object-contain"
            onError={() => setImgFailed(true)}
          />
        </div>
      ) : (
        <span className="text-sm font-semibold text-[var(--color-foreground)]">
          {siteName}
        </span>
      )}
    </Link>
  );
}
