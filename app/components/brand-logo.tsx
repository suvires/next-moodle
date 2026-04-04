import Image from "next/image";
import Link from "next/link";
import { getMoodleBranding, getMoodleBrandLogoProxyUrl } from "@/lib/moodle-brand";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  href?: string;
  compact?: boolean;
  className?: string;
  priority?: boolean;
};

export async function BrandLogo({
  href = "/",
  compact = false,
  className,
  priority = false,
}: BrandLogoProps) {
  const branding = await getMoodleBranding();
  const imageSrc = getMoodleBrandLogoProxyUrl(compact ? "compact" : "full");

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-white/4 px-3 py-2 backdrop-blur-md transition hover:border-[var(--color-accent)]/40 hover:bg-white/7",
        className
      )}
    >
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.14),rgba(255,255,255,0.03))] shadow-[0_14px_34px_rgba(0,0,0,0.25)]">
        <Image
          src={imageSrc}
          alt={branding.siteName}
          fill
          priority={priority}
          sizes="44px"
          className="object-contain p-2"
        />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[0.68rem] font-semibold tracking-[0.24em] text-[var(--color-accent-soft)] uppercase">
          Moodle
        </p>
        <p className="truncate text-sm font-medium text-[var(--color-foreground)]">
          {branding.siteName}
        </p>
      </div>
    </Link>
  );
}
