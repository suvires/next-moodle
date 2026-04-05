import Link from "next/link";
import { CreateUserForm } from "./create-user-form";

export default function NuevoUsuarioPage() {
  return (
    <div className="animate-rise-in flex flex-col gap-6">
      <div>
        <Link
          href="/administracion/usuarios"
          className="mb-3 inline-flex items-center gap-1 text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]"
        >
          ← Usuarios
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          Crear usuario
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Añade una nueva cuenta de usuario a la plataforma Moodle.
        </p>
      </div>

      <div className="surface-card max-w-xl rounded-xl p-6">
        <CreateUserForm />
      </div>
    </div>
  );
}
