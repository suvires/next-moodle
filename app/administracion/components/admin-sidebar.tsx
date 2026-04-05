"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/administracion", label: "Panel" },
  { href: "/administracion/usuarios", label: "Usuarios" },
  { href: "/administracion/cursos", label: "Cursos" },
  { href: "/administracion/categorias", label: "Categorías" },
  { href: "/administracion/matriculaciones", label: "Matriculaciones" },
  { href: "/administracion/cohortes", label: "Cohortes" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/administracion") {
      return pathname === "/administracion";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="shrink-0 md:w-52">
      {/* Mobile: horizontal scroll row */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 md:hidden">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              isActive(link.href)
                ? "border-[var(--warning)] bg-[var(--warning-soft)] text-[var(--warning)]"
                : "border-[var(--line)] text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Desktop: sticky vertical nav */}
      <div className="sticky top-20 hidden md:block">
        <div className="rounded-xl border border-[var(--warning-soft)] bg-[var(--warning-soft)] px-3 py-3">
          <div className="mb-3 px-2">
            <span className="chip chip-warning text-[0.68rem] uppercase tracking-widest">
              Administración
            </span>
          </div>
          <nav className="flex flex-col gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive(link.href)
                    ? "font-semibold text-[var(--warning)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
}
