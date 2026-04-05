import Link from "next/link";
import { redirect } from "next/navigation";
import {
  adminGetCourses,
  resolveUserAccessProfile,
} from "@/lib/moodle";
import { requireSession } from "@/lib/session";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

export default async function CursosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireSession();
  const profile = await resolveUserAccessProfile(session.token, session.userId);
  if (!profile.isAdministrator && !profile.canManagePlatform) {
    redirect("/mis-cursos");
  }

  const { q } = await searchParams;
  const adminToken = session.token;

  let courses: Awaited<ReturnType<typeof adminGetCourses>> = [];
  let fetchError: string | null = null;

  try {
    courses = await adminGetCourses(adminToken);
  } catch (err) {
    fetchError =
      err instanceof Error ? err.message : "Error al cargar los cursos.";
  }

  const filtered = q
    ? courses.filter((c) => c.fullname.toLowerCase().includes(q.toLowerCase()))
    : courses;

  return (
    <div className="animate-rise-in flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Cursos
          </h1>
          {!fetchError && (
            <span className="chip chip-muted">
              {filtered.length.toLocaleString("es-ES")}
            </span>
          )}
        </div>
        <Link
          href="/administracion/cursos/nuevo"
          className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-soft)]"
        >
          + Crear curso
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
            href="/administracion/cursos"
            className="inline-flex items-center gap-1 text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]"
          >
            Limpiar
          </Link>
        )}
      </form>

      {/* Error banner */}
      {fetchError && (
        <div className="banner-warning">
          <p className="font-semibold">No se pudieron cargar los cursos.</p>
          <p className="mt-1 opacity-80">{fetchError}</p>
        </div>
      )}

      {/* Empty state */}
      {!fetchError && filtered.length === 0 && (
        <div className="surface-card rounded-xl p-10 text-center">
          <p className="text-[var(--muted)]">
            {q
              ? `No se encontraron cursos para «${q}».`
              : "No hay cursos en la plataforma."}
          </p>
        </div>
      )}

      {/* Course grid */}
      {!fetchError && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <Link
              key={course.id}
              href={`/administracion/cursos/${course.id}`}
              className="surface-card flex flex-col gap-3 rounded-xl p-5 transition hover:shadow-md"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip chip-muted">{course.shortname}</span>
                <span
                  className={
                    course.visible ? "chip chip-success" : "chip chip-warning"
                  }
                >
                  {course.visible ? "Visible" : "Oculto"}
                </span>
              </div>
              <h3 className="font-semibold leading-snug text-[var(--foreground)]">
                {course.fullname}
              </h3>
              {course.enrolledUserCount !== undefined && (
                <p className="text-xs text-[var(--muted)]">
                  {course.enrolledUserCount.toLocaleString("es-ES")} matriculados
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
