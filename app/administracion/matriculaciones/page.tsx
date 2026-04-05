import Link from "next/link";
import { redirect } from "next/navigation";
import {
  adminGetCohorts,
  adminGetCourses,
  adminGetEnrolledUsers,
  resolveUserAccessProfile,
} from "@/lib/moodle";
import { requireSession } from "@/lib/session";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { UnenrolForm } from "./unenrol-form";
import { EnrolForm } from "./enrol-form";
import { EnrolCohortForm } from "./enrol-cohort-form";

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

export default async function MatriculacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string; q?: string }>;
}) {
  const session = await requireSession();
  const profile = await resolveUserAccessProfile(session.token, session.userId);
  if (!profile.canManagePlatform) {
    redirect("/mis-cursos");
  }

  const { courseId, q } = await searchParams;
  const adminToken = session.token;

  // Phase 2: courseId is set — show enrolled users for that course
  if (courseId) {
    const courseIdNum = Number(courseId);

    const [coursesResult, enrolledResult, cohortsResult] = await Promise.allSettled([
      adminGetCourses(adminToken, [courseIdNum]),
      adminGetEnrolledUsers(adminToken, courseIdNum),
      adminGetCohorts(adminToken),
    ]);

    const course =
      coursesResult.status === "fulfilled" ? coursesResult.value[0] : null;
    const enrolledUsers =
      enrolledResult.status === "fulfilled" ? enrolledResult.value : [];
    const enrolledError =
      enrolledResult.status === "rejected"
        ? String(enrolledResult.reason)
        : null;
    const cohorts =
      cohortsResult.status === "fulfilled" ? cohortsResult.value : [];

    return (
      <div className="animate-rise-in flex flex-col gap-6">
        {/* Header */}
        <div>
          <Link
            href="/administracion/matriculaciones"
            className="mb-3 inline-flex items-center gap-1 text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]"
          >
            ← Cambiar curso
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              {course ? course.fullname : `Curso #${courseId}`}
            </h1>
            {course && (
              <span className="chip chip-muted">{course.shortname}</span>
            )}
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Matriculaciones del curso
          </p>
        </div>

        {/* Error banner */}
        {enrolledError && (
          <div className="banner-warning">
            <p className="font-semibold">
              No se pudieron cargar los usuarios matriculados.
            </p>
            <p className="mt-1 opacity-80">{enrolledError}</p>
          </div>
        )}

        {/* Enrolled users table */}
        {!enrolledError && (
          <div className="surface-card overflow-hidden rounded-xl">
            {enrolledUsers.length === 0 ? (
              <p className="p-6 text-sm text-[var(--muted)]">
                Este curso no tiene usuarios matriculados.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--line)]">
                {enrolledUsers.map((user) => (
                  <li
                    key={user.id}
                    className="flex items-center gap-4 px-5 py-4"
                  >
                    {/* Avatar */}
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-cool)] text-sm font-bold text-white"
                    >
                      {getInitials(user.fullName)}
                    </div>

                    {/* Name + email */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-[var(--foreground)]">
                        {user.fullName}
                      </p>
                      <p className="truncate text-xs text-[var(--muted)]">
                        {user.email ?? "—"}
                      </p>
                    </div>

                    {/* Roles */}
                    <div className="hidden flex-shrink-0 flex-wrap gap-1 sm:flex">
                      {user.roles.map((role, i) => (
                        <span key={i} className="chip chip-muted">
                          {role.name}
                        </span>
                      ))}
                    </div>

                    {/* Last access */}
                    <p className="hidden flex-shrink-0 text-xs text-[var(--muted)] md:block">
                      {formatLastAccess(user.lastAccess)}
                    </p>

                    {/* Unenrol action */}
                    <UnenrolForm userId={user.id} courseId={courseIdNum} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Add enrolment */}
        <div className="surface-card rounded-xl p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            Añadir matriculación
          </h2>
          <EnrolForm courseId={courseIdNum} />
        </div>

        {/* Cohort bulk enrolment */}
        <div className="surface-card rounded-xl p-6">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            Matricular cohorte
          </h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Matricula todos los miembros de una cohorte en este curso de una sola vez.
          </p>
          <EnrolCohortForm courseId={courseIdNum} cohorts={cohorts} />
        </div>
      </div>
    );
  }

  // Phase 1: no courseId — show course picker
  let courses: Awaited<ReturnType<typeof adminGetCourses>> = [];
  let fetchError: string | null = null;

  try {
    courses = await adminGetCourses(adminToken);
  } catch (err) {
    fetchError =
      err instanceof Error ? err.message : "Error al cargar los cursos.";
  }

  const filtered = q
    ? courses.filter((c) =>
        c.fullname.toLowerCase().includes(q.toLowerCase())
      )
    : courses.slice(0, 20);

  return (
    <div className="animate-rise-in flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          Matriculaciones
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Selecciona un curso para gestionar sus matriculaciones.
        </p>
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-2">
        <Input
          name="q"
          placeholder="Buscar curso por nombre..."
          defaultValue={q ?? ""}
          className="max-w-sm"
        />
        <Button variant="outline" type="submit">
          Buscar
        </Button>
        {q && (
          <Link
            href="/administracion/matriculaciones"
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

      {/* Course list */}
      {!fetchError && filtered.length > 0 && (
        <div className="surface-card overflow-hidden rounded-xl">
          {!q && courses.length > 20 && (
            <p className="border-b border-[var(--line)] px-5 py-3 text-xs text-[var(--muted)]">
              Mostrando los primeros 20 cursos. Usa el buscador para filtrar.
            </p>
          )}
          <ul className="divide-y divide-[var(--line)]">
            {filtered.map((course) => (
              <li key={course.id}>
                <Link
                  href={`/administracion/matriculaciones?courseId=${course.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition hover:bg-[var(--surface-strong)]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[var(--foreground)]">
                      {course.fullname}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {course.shortname}
                      {course.enrolledUserCount !== undefined &&
                        ` · ${course.enrolledUserCount.toLocaleString("es-ES")} matriculados`}
                    </p>
                  </div>
                  <span
                    className={
                      course.visible ? "chip chip-success" : "chip chip-warning"
                    }
                  >
                    {course.visible ? "Visible" : "Oculto"}
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
