import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  adminSearchUsers,
  getUserCourses,
  resolveUserAccessProfile,
} from "@/lib/moodle";
import { requireSession } from "@/lib/session";
import { EditUserForm } from "./edit-user-form";
import { SuspendUserForm } from "./suspend-user-form";

function formatTimestamp(ts?: number): string {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatLastAccess(lastAccess?: number): string {
  if (!lastAccess) return "Nunca";
  const now = Math.floor(Date.now() / 1000);
  const diffDays = Math.floor((now - lastAccess) / 86400);
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Hace 1 día";
  return `Hace ${diffDays} días`;
}

export default async function UsuarioDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await requireSession();
  const profile = await resolveUserAccessProfile(session.token, session.userId);
  if (!profile.canManagePlatform) {
    redirect("/mis-cursos");
  }

  const { userId } = await params;
  const adminToken = session.token;

  let users: Awaited<ReturnType<typeof adminSearchUsers>> = [];
  try {
    users = await adminSearchUsers(adminToken, [{ key: "id", value: userId }]);
  } catch {
    notFound();
  }

  const user = users[0];
  if (!user) notFound();

  const userCourses = await getUserCourses(adminToken, user.id).catch(() => []);

  return (
    <div className="animate-rise-in flex flex-col gap-6">
      {/* Header */}
      <div>
        <Link
          href="/administracion/usuarios"
          className="mb-3 inline-flex items-center gap-1 text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]"
        >
          ← Usuarios
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {user.fullName}
          </h1>
          <span
            className={user.suspended ? "chip chip-warning" : "chip chip-success"}
          >
            {user.suspended ? "Suspendido" : "Activo"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: user details */}
        <div className="flex flex-col gap-4">
          <div className="surface-card rounded-xl p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
              Información de la cuenta
            </h2>
            <dl className="flex flex-col gap-3">
              {[
                { label: "Correo electrónico", value: user.email },
                { label: "Nombre de usuario", value: `@${user.username}` },
                { label: "Autenticación", value: user.auth ?? "—" },
                { label: "Departamento", value: user.department ?? "—" },
                { label: "Institución", value: user.institution ?? "—" },
                {
                  label: "Último acceso",
                  value: formatLastAccess(user.lastAccess),
                },
                {
                  label: "Cuenta creada",
                  value: formatTimestamp(user.timeCreated),
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

          {/* Suspend / Reactivate */}
          <div className="surface-card rounded-xl p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
              Estado de la cuenta
            </h2>
            <p className="mb-4 text-sm text-[var(--muted)]">
              {user.suspended
                ? "Este usuario está suspendido y no puede acceder a la plataforma."
                : "Este usuario tiene acceso activo a la plataforma."}
            </p>
            <SuspendUserForm userId={user.id} suspended={user.suspended} />
          </div>

          {/* Enrolled courses */}
          <div className="surface-card rounded-xl p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
              Cursos matriculados
              {userCourses.length > 0 && (
                <span className="ml-2 font-normal normal-case text-[var(--foreground)]">
                  ({userCourses.length})
                </span>
              )}
            </h2>
            {userCourses.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Este usuario no tiene cursos visibles.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {userCourses.map((course) => (
                  <li key={course.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/administracion/cursos/${course.id}`}
                        className="truncate text-sm font-medium text-[var(--foreground)] hover:underline"
                      >
                        {course.fullname}
                      </Link>
                      {course.categoryname ? (
                        <p className="truncate text-xs text-[var(--muted)]">
                          {course.categoryname}
                        </p>
                      ) : null}
                    </div>
                    <span className="chip chip-muted shrink-0">{course.shortname}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Danger zone */}
          <div className="surface-card rounded-xl border border-[var(--danger)]/20 p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--danger)]">
              Zona de peligro
            </h2>
            <p className="mb-4 text-sm text-[var(--muted)]">
              Eliminar la cuenta es una acción permanente e irreversible.
            </p>
            <Link
              href={`/administracion/usuarios/${user.id}/eliminar`}
              className="inline-flex items-center justify-center rounded-full border border-[var(--line)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--line-strong)] hover:bg-[var(--surface-strong)]"
            >
              Eliminar usuario
            </Link>
          </div>
        </div>

        {/* Right: edit form */}
        <div className="surface-card rounded-xl p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            Editar información
          </h2>
          <EditUserForm user={user} />
        </div>
      </div>
    </div>
  );
}
