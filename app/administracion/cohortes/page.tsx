import Link from "next/link";
import { redirect } from "next/navigation";
import {
  adminGetCohorts,
  resolveUserAccessProfile,
} from "@/lib/moodle";
import { requireSession } from "@/lib/session";
export default async function CohortesPage() {
  const session = await requireSession();
  const profile = await resolveUserAccessProfile(session.token, session.userId);
  if (!profile.canManagePlatform) {
    redirect("/mis-cursos");
  }

  const adminToken = session.token;

  let cohorts: Awaited<ReturnType<typeof adminGetCohorts>> = [];
  let fetchError: string | null = null;

  try {
    cohorts = await adminGetCohorts(adminToken);
  } catch (err) {
    fetchError =
      err instanceof Error ? err.message : "Error al cargar las cohortes.";
  }

  return (
    <div className="animate-rise-in flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Cohortes
          </h1>
          {!fetchError && (
            <span className="chip chip-muted">
              {cohorts.length.toLocaleString("es-ES")}
            </span>
          )}
        </div>
        <Link
          href="/administracion/cohortes/nueva"
          className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-soft)]"
        >
          + Crear cohorte
        </Link>
      </div>

      {/* Error banner */}
      {fetchError && (
        <div className="banner-warning">
          <p className="font-semibold">No se pudieron cargar las cohortes.</p>
          <p className="mt-1 opacity-80">{fetchError}</p>
        </div>
      )}

      {/* Empty state */}
      {!fetchError && cohorts.length === 0 && (
        <div className="surface-card rounded-xl p-10 text-center">
          <p className="text-[var(--muted)]">
            No hay cohortes en la plataforma.
          </p>
          <p className="mt-2">
            <Link
              href="/administracion/cohortes/nueva"
              className="text-sm font-medium text-[var(--accent)] hover:opacity-75"
            >
              Crear la primera cohorte →
            </Link>
          </p>
        </div>
      )}

      {/* Cohort list */}
      {!fetchError && cohorts.length > 0 && (
        <div className="surface-card overflow-hidden rounded-xl">
          <ul className="divide-y divide-[var(--line)]">
            {cohorts.map((cohort) => (
              <li key={cohort.id}>
                <Link
                  href={`/administracion/cohortes/${cohort.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition hover:bg-[var(--surface-strong)]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[var(--foreground)]">
                      {cohort.name}
                    </p>
                    {cohort.idNumber && (
                      <p className="text-xs text-[var(--muted)]">
                        ID: {cohort.idNumber}
                      </p>
                    )}
                  </div>
                  <span
                    className={
                      cohort.visible ? "chip chip-success" : "chip chip-warning"
                    }
                  >
                    {cohort.visible ? "Visible" : "Oculta"}
                  </span>
                  <span className="text-sm text-[var(--muted)]">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
