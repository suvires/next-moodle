import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { adminGetCategories, adminGetCourses, resolveUserAccessProfile } from "@/lib/moodle";
import { requireSession } from "@/lib/session";
import { EditCategoryForm } from "./edit-category-form";

export default async function CategoryDetailPage({
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

  const [allCategories, allCourses] = await Promise.all([
    adminGetCategories(session.token).catch(() => []),
    adminGetCourses(session.token).catch(() => []),
  ]);

  const category = allCategories.find((c) => c.id === id);
  if (!category) notFound();

  const categoryCourses = allCourses.filter((c) => c.categoryId === id);

  return (
    <div className="animate-rise-in flex flex-col gap-6">
      <div>
        <Link
          href="/administracion/categorias"
          className="mb-3 inline-flex items-center gap-1 text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]"
        >
          ← Categorías
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {category.name}
          </h1>
          <span className={category.visible !== false ? "chip chip-success" : "chip chip-warning"}>
            {category.visible !== false ? "Visible" : "Oculta"}
          </span>
          {category.idNumber && (
            <span className="chip chip-muted">{category.idNumber}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: info + cursos + danger */}
        <div className="flex flex-col gap-4">
          <div className="surface-card rounded-xl p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
              Información
            </h2>
            <dl className="flex flex-col gap-3">
              {[
                { label: "ID", value: String(category.id) },
                {
                  label: "Categoría padre",
                  value: category.parentId
                    ? allCategories.find((c) => c.id === category.parentId)?.name ?? `ID ${category.parentId}`
                    : "Raíz",
                },
                { label: "Profundidad", value: String(category.depth ?? "—") },
                { label: "Cursos", value: String(category.courseCount ?? categoryCourses.length) },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <dt className="text-xs text-[var(--muted)]">{label}</dt>
                  <dd className="text-sm font-medium text-[var(--foreground)]">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {categoryCourses.length > 0 && (
            <div className="surface-card rounded-xl p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                Cursos en esta categoría
              </h2>
              <div className="flex flex-col gap-2">
                {categoryCourses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/administracion/cursos/${course.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition hover:bg-[var(--surface-strong)]"
                  >
                    <span className="truncate text-sm font-medium text-[var(--foreground)]">
                      {course.fullname}
                    </span>
                    <span className={course.visible ? "chip chip-success" : "chip chip-warning"}>
                      {course.visible ? "Visible" : "Oculto"}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="surface-card rounded-xl border border-[var(--danger)]/20 p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--danger)]">
              Zona de peligro
            </h2>
            <p className="mb-4 text-sm text-[var(--muted)]">
              Eliminar la categoría es irreversible. Los cursos dentro quedarán sin categoría o serán movidos a la raíz.
            </p>
            <Link
              href={`/administracion/categorias/${category.id}/eliminar`}
              className="inline-flex items-center justify-center rounded-full border border-[var(--line)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--line-strong)] hover:bg-[var(--surface-strong)]"
            >
              Eliminar categoría
            </Link>
          </div>
        </div>

        {/* Right: edit form */}
        <div className="surface-card rounded-xl p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            Editar categoría
          </h2>
          <EditCategoryForm category={category} allCategories={allCategories} />
        </div>
      </div>
    </div>
  );
}
