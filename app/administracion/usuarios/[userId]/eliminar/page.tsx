import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  adminSearchUsers,
  resolveUserAccessProfile,
} from "@/lib/moodle";
import { requireSession } from "@/lib/session";
import { DeleteUserForm } from "./delete-user-form";

export default async function EliminarUsuarioPage({
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

  return (
    <div className="animate-rise-in flex flex-col gap-6">
      {/* Header */}
      <div>
        <Link
          href={`/administracion/usuarios/${user.id}`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]"
        >
          ← {user.fullName}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          Eliminar usuario
        </h1>
      </div>

      {/* Warning banner */}
      <div className="banner-danger">
        <p className="font-semibold">
          Esta acción eliminará permanentemente la cuenta de {user.fullName}.
          No se puede deshacer.
        </p>
        <p className="mt-1 opacity-80">
          Todos los datos asociados a este usuario serán eliminados de forma
          irreversible.
        </p>
      </div>

      {/* User summary card */}
      <div className="surface-card max-w-md rounded-xl p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Cuenta a eliminar
        </h2>
        <dl className="flex flex-col gap-3">
          {[
            { label: "Nombre completo", value: user.fullName },
            { label: "Correo electrónico", value: user.email },
            { label: "Nombre de usuario", value: `@${user.username}` },
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
        <DeleteUserForm userId={user.id} />
        <Link
          href={`/administracion/usuarios/${user.id}`}
          className="inline-flex items-center justify-center rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--line-strong)] hover:bg-[var(--surface-strong)]"
        >
          Cancelar
        </Link>
      </div>
    </div>
  );
}
