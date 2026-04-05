import Link from "next/link";
import { redirect } from "next/navigation";
import { adminGetCategories, resolveUserAccessProfile } from "@/lib/moodle";
import { requireSession } from "@/lib/session";
import { CreateCategoryForm } from "./create-category-form";

export default async function NuevaCategoriePage() {
  const session = await requireSession();
  const profile = await resolveUserAccessProfile(session.token, session.userId);
  if (!profile.canManagePlatform) {
    redirect("/dashboard");
  }

  const categories = await adminGetCategories(session.token).catch(() => []);

  return (
    <div className="animate-rise-in flex flex-col gap-6">
      <div>
        <Link
          href="/administracion/categorias"
          className="mb-3 inline-flex items-center gap-1 text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]"
        >
          ← Categorías
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          Crear categoría
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Las categorías organizan los cursos de la plataforma.
        </p>
      </div>

      <div className="surface-card max-w-xl rounded-xl p-6">
        <CreateCategoryForm categories={categories} />
      </div>
    </div>
  );
}
