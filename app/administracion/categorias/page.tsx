import Link from "next/link";
import { redirect } from "next/navigation";
import { adminGetCategories, resolveUserAccessProfile } from "@/lib/moodle";
import { requireSession } from "@/lib/session";

export default async function CategoriasPage() {
  const session = await requireSession();
  const profile = await resolveUserAccessProfile(session.token, session.userId);
  if (!profile.canManagePlatform) {
    redirect("/dashboard");
  }

  let categories: Awaited<ReturnType<typeof adminGetCategories>> = [];
  let fetchError: string | null = null;

  try {
    categories = await adminGetCategories(session.token);
    categories.sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0) || a.name.localeCompare(b.name, "es"));
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Error al cargar las categorías.";
  }

  return (
    <div className="animate-rise-in flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Categorías
          </h1>
          {!fetchError && (
            <span className="chip chip-muted">
              {categories.length.toLocaleString("es-ES")}
            </span>
          )}
        </div>
        <Link
          href="/administracion/categorias/nueva"
          className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-soft)]"
        >
          + Crear categoría
        </Link>
      </div>

      {fetchError && (
        <div className="banner-warning">
          <p className="font-semibold">No se pudieron cargar las categorías.</p>
          <p className="mt-1 opacity-80">{fetchError}</p>
        </div>
      )}

      {!fetchError && categories.length === 0 && (
        <div className="surface-card rounded-xl p-10 text-center">
          <p className="text-[var(--muted)]">No hay categorías en la plataforma.</p>
        </div>
      )}

      {!fetchError && categories.length > 0 && (
        <div className="flex flex-col gap-2">
          {categories.map((cat) => {
            const indent = (cat.depth ?? 0) > 0 ? (cat.depth ?? 0) - 1 : 0;
            return (
              <Link
                key={cat.id}
                href={`/administracion/categorias/${cat.id}`}
                className="surface-card flex items-center justify-between gap-4 rounded-xl px-5 py-4 transition hover:shadow-md"
                style={{ paddingLeft: `${1.25 + indent * 1.5}rem` }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  {indent > 0 && (
                    <span className="shrink-0 text-[var(--line-strong)]">{"└"}</span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[var(--foreground)]">
                      {cat.name}
                    </p>
                    {cat.idNumber && (
                      <p className="text-xs text-[var(--muted)]">{cat.idNumber}</p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {cat.courseCount !== undefined && (
                    <span className="text-sm text-[var(--muted)]">
                      {cat.courseCount} {cat.courseCount === 1 ? "curso" : "cursos"}
                    </span>
                  )}
                  <span className={cat.visible !== false ? "chip chip-success" : "chip chip-warning"}>
                    {cat.visible !== false ? "Visible" : "Oculta"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
