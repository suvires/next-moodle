import { BrandLogo } from "@/app/components/brand-logo";
import { LinkButton } from "@/app/components/ui/button";

export function PublicTopbar() {
  return (
    <header className="topbar-panel sticky top-0 z-10 px-5 md:px-8">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4">
        <BrandLogo priority compact />
        <nav className="flex flex-1 items-center gap-5 text-sm">
          <LinkButton href="/catalogo" variant="ghost" size="sm">
            Catálogo
          </LinkButton>
        </nav>
        <LinkButton href="/login" variant="primary" size="sm">
          Entrar
        </LinkButton>
      </div>
    </header>
  );
}
