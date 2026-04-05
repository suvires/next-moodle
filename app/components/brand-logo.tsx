import { getMoodleBranding, getMoodleBrandLogoProxyUrl } from "@/lib/moodle-brand";
import { BrandLogoClient } from "./brand-logo-client";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  href?: string;
  compact?: boolean;
  size?: "default" | "lg" | "xl";
  className?: string;
  priority?: boolean;
};

export async function BrandLogo({
  href = "/",
  compact = false,
  size = "default",
  className,
  priority = false,
}: BrandLogoProps) {
  const branding = await getMoodleBranding();
  const hasLogo = compact ? !!branding.compactLogoUrl : !!branding.logoUrl;
  const imageSrc = hasLogo
    ? getMoodleBrandLogoProxyUrl(compact ? "compact" : "full")
    : undefined;

  return (
    <BrandLogoClient
      href={href}
      siteName={branding.siteName}
      imageSrc={imageSrc}
      size={size}
      className={cn(className)}
      priority={priority}
    />
  );
}
