import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  adminGetCohorts,
  adminGetCohortMembers,
  getSiteInfo,
  getUsersById,
  resolveUserAccessProfile,
} from "@/lib/moodle";
import {
  getUnsupportedMoodleFeatureMessage,
  resolveMoodleFeatureSupport,
} from "@/lib/moodle-feature-support";
import { requireSession } from "@/lib/session";
import { EditCohortForm } from "./edit-cohort-form";
import { RemoveMemberForm } from "./remove-member-form";
import { AddMemberForm } from "./add-member-form";

export default async function CohortDetailPage({
  params,
}: {
  params: Promise<{ cohortId: string }>;
}) {
  const session = await requireSession();
  const siteInfo = await getSiteInfo(session.token).catch(() => null);
  const profile = await resolveUserAccessProfile(session.token, session.userId);
  if (!profile.canManagePlatform) {
    redirect("/mis-cursos");
  }

  const { cohortId } = await params;
  const cohortIdNum = Number(cohortId);
  const adminToken = session.token;
  const supportsRemoval = resolveMoodleFeatureSupport(
    siteInfo?.functions || []
  ).cohortMemberRemoval;

  const [cohortsResult, membersResult] = await Promise.allSettled([
    adminGetCohorts(adminToken, [cohortIdNum]),
    adminGetCohortMembers(adminToken, cohortIdNum),
  ]);

  if (cohortsResult.status === "rejected") notFound();
  const cohort = cohortsResult.value[0];
  if (!cohort) notFound();

  const userIds =
    membersResult.status === "fulfilled" ? membersResult.value : [];

  const usersById =
    userIds.length > 0 ? await getUsersById(adminToken, userIds) : new Map();

  return (
    <div className="animate-rise-in flex flex-col gap-6">
      {/* Header */}
      <div>
        <Link
          href="/administracion/cohortes"
          className="mb-3 inline-flex items-center gap-1 text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]"
        >
          ← Cohortes
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {cohort.name}
          </h1>
          <span
            className={cohort.visible ? "chip chip-success" : "chip chip-warning"}
          >
            {cohort.visible ? "Visible" : "Oculta"}
          </span>
          {cohort.idNumber && (
            <span className="chip chip-muted">{cohort.idNumber}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: members + add member + danger zone */}
        <div className="flex flex-col gap-4">
          {/* Members */}
          <div className="surface-card rounded-xl p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
              Miembros ({userIds.length.toLocaleString("es-ES")})
            </h2>

            {!supportsRemoval && (
              <div className="banner-warning mb-4">
                <p className="text-sm">
                  {getUnsupportedMoodleFeatureMessage("cohortMemberRemoval")}
                </p>
              </div>
            )}

            {membersResult.status === "rejected" && (
              <div className="banner-warning mb-4">
                <p className="text-sm">No se pudieron cargar los miembros.</p>
              </div>
            )}

            {userIds.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Esta cohorte no tiene miembros.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--line)]">
                {userIds.map((uid) => {
                  const user = usersById.get(uid);
                  return (
                    <li
                      key={uid}
                      className="flex items-center gap-3 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--foreground)]">
                          {user?.fullName ?? `Usuario #${uid}`}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          ID: {uid}
                        </p>
                      </div>
                      <RemoveMemberForm
                        cohortId={cohortIdNum}
                        userId={uid}
                        supported={supportsRemoval}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Add member */}
          <div className="surface-card rounded-xl p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
              Añadir miembro
            </h2>
            <AddMemberForm cohortId={cohortIdNum} />
          </div>

          {/* Danger zone */}
          <div className="surface-card rounded-xl border border-[var(--danger)]/20 p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--danger)]">
              Zona de peligro
            </h2>
            <p className="mb-4 text-sm text-[var(--muted)]">
              Eliminar la cohorte es una acción permanente e irreversible.
            </p>
            <Link
              href={`/administracion/cohortes/${cohort.id}/eliminar`}
              className="inline-flex items-center justify-center rounded-full border border-[var(--line)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--line-strong)] hover:bg-[var(--surface-strong)]"
            >
              Eliminar cohorte
            </Link>
          </div>
        </div>

        {/* Right: edit form */}
        <div className="surface-card rounded-xl p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            Editar cohorte
          </h2>
          <EditCohortForm cohort={cohort} />
        </div>
      </div>
    </div>
  );
}
