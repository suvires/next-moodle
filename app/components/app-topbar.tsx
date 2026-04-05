import Link from "next/link";
import { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { BrandLogo } from "@/app/components/brand-logo";
import { getMoodleMediaProxyUrl } from "@/lib/moodle-media";
import { logoutAction } from "@/app/actions/auth";

export type Crumb = { label: string; href?: string };
export type AppTopbarNavItem = {
  href: string;
  label: string;
  badgeCount?: number;
};

type AppTopbarProps = {
  fullName: string;
  userPictureUrl?: string;
  /** Navigation hierarchy shown after the logo. Last item = current page (no link). */
  breadcrumbs?: Crumb[];
  /** Shorthand for a single breadcrumb with no link. */
  sectionLabel?: string;
  /** Context-specific actions (e.g. Tareas / Calificaciones tabs for a course). */
  actions?: ReactNode;
  unreadMessages?: number;
  unreadNotifications?: number;
  homeHref?: string;
  navItems?: AppTopbarNavItem[];
};

function getInitials(name: string) {
  return (
    name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?"
  );
}

export function AppTopbar({
  fullName,
  userPictureUrl,
  breadcrumbs,
  sectionLabel,
  actions,
  unreadMessages = 0,
  unreadNotifications = 0,
  homeHref = "/mis-cursos",
  navItems,
}: AppTopbarProps) {
  const crumbs: Crumb[] = breadcrumbs ?? (sectionLabel ? [{ label: sectionLabel }] : []);
  const resolvedNavItems =
    navItems ??
    [
      {
        href: "/mensajes",
        label: "Mensajes",
        badgeCount: unreadMessages,
      },
      {
        href: "/notificaciones",
        label: "Notificaciones",
        badgeCount: unreadNotifications,
      },
    ];

  return (
    <header className="topbar-panel sticky top-0 z-10 px-5 md:px-8">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4">

        {/* Left: logo + breadcrumb trail */}
        <div className="flex min-w-0 items-center text-sm">
          <BrandLogo href={homeHref} compact priority />
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex min-w-0 items-center">
              <span className="mx-2.5 shrink-0 text-[var(--line-strong)]">/</span>
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="shrink-0 text-[var(--muted)] transition hover:text-[var(--foreground)]"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="truncate font-medium text-[var(--foreground)]">
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </div>

        {/* Right: context actions + global nav + avatar */}
        <div className="flex shrink-0 items-center gap-5 text-sm">
          {actions && <div className="flex items-center gap-5">{actions}</div>}

          <nav className="hidden items-center gap-5 md:flex">
            {resolvedNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative text-[var(--muted)] transition hover:text-[var(--foreground)]"
              >
                {item.label}
                {item.badgeCount ? (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[0.6rem] font-bold text-white">
                    {item.badgeCount}
                  </span>
                ) : null}
              </Link>
            ))}
            <form action={logoutAction} className="inline">
              <button
                type="submit"
                className="text-[var(--muted)] transition hover:text-[var(--foreground)]"
              >
                Salir
              </button>
            </form>
          </nav>

          <Link href="/perfil" className="shrink-0 transition hover:opacity-75">
            <Avatar className="h-8 w-8">
              {userPictureUrl && (
                <AvatarImage src={getMoodleMediaProxyUrl(userPictureUrl)} alt={fullName} />
              )}
              <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
