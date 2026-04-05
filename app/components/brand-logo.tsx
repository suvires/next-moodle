import Image from "next/image";
import Link from "next/link";
import { getMoodleBranding, getMoodleBrandLogoProxyUrl } from "@/lib/moodle-brand";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  href?: string;
  compact?: boolean;
  hideLabel?: boolean;
  size?: "default" | "lg" | "xl";
  className?: string;
  priority?: boolean;
};

const sizeStyles = {
  default: { container: "h-8 w-8", image: "", sizes: "32px" },
  lg: { container: "h-14 w-14", image: "", sizes: "56px" },
  xl: { container: "h-32 w-32", image: "", sizes: "128px" },
};

export async function BrandLogo({
  href = "/",
  compact = false,
  hideLabel = false,
  size = "default",
  className,
  priority = false,
}: BrandLogoProps) {
  const branding = await getMoodleBranding();
  const hasLogo = compact ? !!branding.compactLogoUrl : !!branding.logoUrl;
  const imageSrc = getMoodleBrandLogoProxyUrl(compact ? "compact" : "full");
  const s = sizeStyles[size];

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2.5 transition",
        className
      )}
    >
      {hasLogo ? (
        <div
          className={cn(
            "relative flex shrink-0 items-center justify-center overflow-hidden",
            s.container
          )}
        >
          <Image
            src={imageSrc}
            alt={branding.siteName}
            fill
            priority={priority}
            sizes={s.sizes}
            className={cn("object-contain", s.image)}
          />
        </div>
      ) : (
        <span
          className={cn(
            "text-sm font-semibold text-[var(--color-foreground)]",
            hideLabel && "sr-only"
          )}
        >
          {branding.siteName}
        </span>
      )}
    </Link>
  );
}
