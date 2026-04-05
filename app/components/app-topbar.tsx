import Link from "next/link";
import { ReactNode } from "react";
import { BrandLogo } from "@/app/components/brand-logo";
import { AppTopbarActions } from "@/app/components/app-topbar-actions";

export type Crumb = { label: string; href?: string };
export type AppTopbarNavItem = {
  href: string;
  label: string;
  badgeCount?: number;
};

type AppTopbarProps = {
  fullName: string;
  userPictureUrl?: string;
  /** Navigation hierarchy shown below the header bar. Last item = current page (no link). */
  breadcrumbs?: Crumb[];
  /** Shorthand for a single breadcrumb with no link. */
  sectionLabel?: string;
  /** Context-specific actions (e.g. tabs for a course). */
  actions?: ReactNode;
  unreadMessages?: number;
  unreadNotifications?: number;
  homeHref?: string;
  canManageOwnFiles?: boolean;
  /** @deprecated No longer rendered; accepted for backward compatibility. */
  navItems?: AppTopbarNavItem[];
};

export function AppTopbar({
  fullName,
  userPictureUrl,
  breadcrumbs,
  sectionLabel,
  actions,
  unreadMessages = 0,
  unreadNotifications = 0,
  homeHref = "/dashboard",
  canManageOwnFiles,
}: AppTopbarProps) {
  const crumbs: Crumb[] = breadcrumbs ?? (sectionLabel ? [{ label: sectionLabel }] : []);

  return (
    <>
      <header className="topbar-panel sticky top-0 z-10 px-5 md:px-8">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4">

          {/* Left: logo + nav links */}
          <div className="flex items-center gap-6">
            <BrandLogo href={homeHref} compact priority />
            <nav className="hidden items-center gap-5 text-sm md:flex">
              <Link
                href="/catalogo"
                className="text-[var(--muted)] transition hover:text-[var(--foreground)]"
              >
                Catálogo
              </Link>
              <Link
                href="/dashboard"
                className="text-[var(--muted)] transition hover:text-[var(--foreground)]"
              >
                Dashboard
              </Link>
              <Link
                href="/mis-cursos"
                className="text-[var(--muted)] transition hover:text-[var(--foreground)]"
              >
                Mis cursos
              </Link>
            </nav>
          </div>

          {/* Right: context actions + icon buttons + avatar dropdown */}
          <div className="flex shrink-0 items-center gap-2">
            {actions && (
              <div className="mr-2 flex items-center gap-4">{actions}</div>
            )}
            <AppTopbarActions
              fullName={fullName}
              userPictureUrl={userPictureUrl}
              unreadMessages={unreadMessages}
              unreadNotifications={unreadNotifications}
              canManageOwnFiles={canManageOwnFiles}
            />
          </div>
        </div>
      </header>

      {/* Breadcrumb — below sticky header, no background or border */}
      {crumbs.length > 1 && (
        <div className="pt-6">
          <div className="mx-auto flex max-w-5xl items-center px-5 text-sm md:px-8">
            {crumbs.map((crumb, i) => (
              <span key={i} className="flex items-center">
                {i > 0 && (
                  <span className="mx-2.5 shrink-0 text-[var(--line-strong)]">/</span>
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="text-[var(--muted)] transition hover:text-[var(--foreground)]"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-medium text-[var(--foreground)]">{crumb.label}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
