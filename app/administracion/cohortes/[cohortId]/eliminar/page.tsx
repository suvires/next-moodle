import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  adminGetCohorts,
  resolveUserAccessProfile,
} from "@/lib/moodle";
import { requireSession } from "@/lib/session";
import { DeleteCohortForm } from "./delete-cohort-form";

export default async function EliminarCohortePage({
  params,
}: {
  params: Promise<{ cohortId: string }>;
}) {
  const session = await requireSession();
  const profile = await resolveUserAccessProfile(session.token, session.userId);
  if (!profile.isAdministrator && !profile.canManagePlatform) {
    redirect("/mis-cursos");
  }

  const { cohortId } = await params;
  const adminToken = session.token;

  let cohort: Awaited<ReturnType<typeof adminGetCohorts>>[number] | undefined;
  try {
    const cohorts = await adminGetCohorts(adminToken, [Number(cohortId)]);
    cohort = cohorts[0];
  } catch {
    notFound();
  }

  if (!cohort) notFound();

  return (
    <div className="animate-rise-in flex flex-col gap-6">
      {/* Header */}
      <div>
        <Link
          href={`/administracion/cohortes/${cohort.id}`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]"
        >
          ← {cohort.name}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          Eliminar cohorte
        </h1>
      </div>

      {/* Warning banner */}
      <div className="banner-danger">
        <p className="font-semibold">
          Esta acción eliminará permanentemente la cohorte &ldquo;{cohort.name}&rdquo;.
          No se puede deshacer.
        </p>
        <p className="mt-1 opacity-80">
          Todos los miembros serán desvinculados y los datos de la cohorte
          serán eliminados de forma irreversible.
        </p>
      </div>

      {/* Cohort summary card */}
      <div className="surface-card max-w-md rounded-xl p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Cohorte a eliminar
        </h2>
        <dl className="flex flex-col gap-3">
          {[
            { label: "Nombre", value: cohort.name },
            {
              label: "Identificador",
              value: cohort.idNumber ?? "—",
            },
            {
              label: "Descripción",
              value: cohort.description ?? "—",
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <dt className="text-xs text-[var(--muted)]">{label}</dt>
              <dd className="text-sm font-medium text-[var(--foreground)]">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <DeleteCohortForm cohortId={cohort.id} />
        <Link
          href={`/administracion/cohortes/${cohort.id}`}
          className="inline-flex items-center justify-center rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--line-strong)] hover:bg-[var(--surface-strong)]"
        >
          Cancelar
        </Link>
      </div>
    </div>
  );
}
