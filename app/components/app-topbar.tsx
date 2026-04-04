import { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { BrandLogo } from "@/app/components/brand-logo";
import { getMoodleMediaProxyUrl } from "@/lib/moodle-media";

type AppTopbarProps = {
  fullName: string;
  userPictureUrl?: string;
  sectionLabel?: string;
  actions?: ReactNode;
};

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function AppTopbar({
  fullName,
  userPictureUrl,
  sectionLabel,
  actions,
}: AppTopbarProps) {
  return (
    <header className="topbar-panel app-grid rounded-[1.7rem] px-4 py-4 md:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <BrandLogo href="/mis-cursos" compact priority />
          {sectionLabel ? (
            <span className="metric-chip rounded-full px-3 py-1 text-[0.66rem] font-semibold tracking-[0.24em] text-[var(--color-accent-soft)] uppercase">
              {sectionLabel}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 md:justify-end">
          {actions}
          <div className="metric-chip flex items-center gap-3 rounded-[1rem] px-3 py-2">
            <Avatar className="h-11 w-11">
              {userPictureUrl ? (
                <AvatarImage
                  src={getMoodleMediaProxyUrl(userPictureUrl)}
                  alt={fullName}
                />
              ) : null}
              <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--color-foreground)]">
                {fullName}
              </p>
              <p className="truncate text-[0.72rem] text-[var(--color-muted)]">
                Campus activo
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
