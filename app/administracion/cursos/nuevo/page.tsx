import Link from "next/link";
import { redirect } from "next/navigation";
import { adminGetCategories, resolveUserAccessProfile } from "@/lib/moodle";
import { requireSession } from "@/lib/session";
import { CreateCourseForm } from "./create-course-form";

export default async function NuevoCursoPage() {
  const session = await requireSession();
  const profile = await resolveUserAccessProfile(session.token, session.userId);
  if (!profile.canManagePlatform) {
    redirect("/mis-cursos");
  }

  return (
    <div className="animate-rise-in flex flex-col gap-6">
      <div>
        <Link
          href="/administracion/cursos"
          className="mb-3 inline-flex items-center gap-1 text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]"
        >
          ← Cursos
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          Crear curso
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Rellena los campos para crear un nuevo curso en la plataforma.
        </p>
      </div>

      <div className="surface-card max-w-xl rounded-xl p-6">
        <CreateCourseForm categories={await adminGetCategories(session.token).catch(() => [])} />
      </div>
    </div>
  );
}
