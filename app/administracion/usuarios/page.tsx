import Link from "next/link";
import { redirect } from "next/navigation";
import {
  adminSearchUsers,
  resolveUserAccessProfile,
} from "@/lib/moodle";
import { requireSession } from "@/lib/session";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

function formatLastAccess(lastAccess?: number): string {
  if (!lastAccess) return "Nunca";
  const now = Math.floor(Date.now() / 1000);
  const diffDays = Math.floor((now - lastAccess) / 86400);
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Hace 1 día";
  return `Hace ${diffDays} días`;
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return fullName.slice(0, 2).toUpperCase();
}

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await requireSession();
  const profile = await resolveUserAccessProfile(session.token, session.userId);
  if (!profile.canManagePlatform) {
    redirect("/mis-cursos");
  }

  const { q } = await searchParams;
  const adminToken = session.token;

  let users: Awaited<ReturnType<typeof adminSearchUsers>> = [];
  let fetchError: string | null = null;

  try {
    if (q) {
      users = await adminSearchUsers(adminToken, [
        { key: "fullname", value: `%${q}%` },
      ]);
    } else {
      users = await adminSearchUsers(adminToken, [
        { key: "confirmed", value: "1" },
      ]);
    }
  } catch (err) {
    fetchError =
      err instanceof Error ? err.message : "Error al cargar los usuarios.";
  }

  return (
    <div className="animate-rise-in flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Usuarios
          </h1>
          {!fetchError && (
            <span className="chip chip-muted">{users.length.toLocaleString("es-ES")}</span>
          )}
        </div>
        <Link
          href="/administracion/usuarios/nuevo"
          className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-soft)]"
        >
          + Crear usuario
        </Link>
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-2">
        <Input
          name="q"
          placeholder="Buscar por nombre..."
          defaultValue={q ?? ""}
          className="max-w-sm"
        />
        <Button variant="outline" type="submit">
          Buscar
        </Button>
        {q && (
          <Link
            href="/administracion/usuarios"
            className="inline-flex items-center gap-1 text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]"
          >
            Limpiar
          </Link>
        )}
      </form>

      {/* Error banner */}
      {fetchError && (
        <div className="banner-warning">
          <p className="font-semibold">No se pudieron cargar los usuarios.</p>
          <p className="mt-1 opacity-80">{fetchError}</p>
        </div>
      )}

      {/* User list */}
      {!fetchError && users.length === 0 && (
        <div className="surface-card rounded-xl p-10 text-center">
          <p className="text-[var(--muted)]">
            {q
              ? `No se encontraron usuarios para «${q}».`
              : "No hay usuarios registrados."}
          </p>
        </div>
      )}

      {!fetchError && users.length > 0 && (
        <div className="surface-card overflow-hidden rounded-xl">
          <ul className="divide-y divide-[var(--line)]">
            {users.map((user) => (
              <li key={user.id}>
                <Link
                  href={`/administracion/usuarios/${user.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition hover:bg-[var(--surface-strong)]"
                >
                  {/* Avatar */}
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-cool)] text-sm font-bold text-white"
                  >
                    {getInitials(user.fullName)}
                  </div>

                  {/* Name + username */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[var(--foreground)]">
                      {user.fullName}
                    </p>
                    <p className="truncate text-xs text-[var(--muted)]">
                      @{user.username} · {user.email}
                    </p>
                  </div>

                  {/* Last access */}
                  <p className="hidden flex-shrink-0 text-xs text-[var(--muted)] sm:block">
                    {formatLastAccess(user.lastAccess)}
                  </p>

                  {/* Status chip */}
                  <span
                    className={
                      user.suspended ? "chip chip-warning" : "chip chip-success"
                    }
                  >
                    {user.suspended ? "Suspendido" : "Activo"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
