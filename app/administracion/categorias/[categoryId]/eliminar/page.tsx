import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { adminGetCategories, resolveUserAccessProfile } from "@/lib/moodle";
import { requireSession } from "@/lib/session";
import { DeleteCategoryForm } from "./delete-category-form";

export default async function EliminarCategoriePage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const session = await requireSession();
  const profile = await resolveUserAccessProfile(session.token, session.userId);
  if (!profile.canManagePlatform) {
    redirect("/dashboard");
  }

  const { categoryId } = await params;
  const id = Number(categoryId);
  if (!id) notFound();

  const categories = await adminGetCategories(session.token).catch(() => []);
  const category = categories.find((c) => c.id === id);
  if (!category) notFound();

  return (
    <div className="animate-rise-in flex flex-col gap-6">
      <div>
        <Link
          href={`/administracion/categorias/${id}`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]"
        >
          ← {category.name}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          Eliminar categoría
        </h1>
      </div>

      <div className="surface-card max-w-xl rounded-xl border border-[var(--danger)]/20 p-6">
        <DeleteCategoryForm categoryId={id} categoryName={category.name} />
      </div>
    </div>
  );
}
