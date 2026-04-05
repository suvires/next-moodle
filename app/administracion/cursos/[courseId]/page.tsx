import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  adminGetCourses,
  resolveUserAccessProfile,
} from "@/lib/moodle";
import { requireSession } from "@/lib/session";
import { EditCourseForm } from "./edit-course-form";

export default async function CursoDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await requireSession();
  const profile = await resolveUserAccessProfile(session.token, session.userId);
  if (!profile.isAdministrator && !profile.canManagePlatform) {
    redirect("/mis-cursos");
  }

  const { courseId } = await params;
  const adminToken = session.token;

  let course: Awaited<ReturnType<typeof adminGetCourses>>[number] | undefined;
  try {
    const courses = await adminGetCourses(adminToken, [Number(courseId)]);
    course = courses[0];
  } catch {
    notFound();
  }

  if (!course) notFound();

  return (
    <div className="animate-rise-in flex flex-col gap-6">
      {/* Header */}
      <div>
        <Link
          href="/administracion/cursos"
          className="mb-3 inline-flex items-center gap-1 text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]"
        >
          ← Cursos
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {course.fullname}
          </h1>
          <span
            className={course.visible ? "chip chip-success" : "chip chip-warning"}
          >
            {course.visible ? "Visible" : "Oculto"}
          </span>
          <span className="chip chip-muted">{course.shortname}</span>
          {course.format && (
            <span className="chip chip-muted">{course.format}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: course details */}
        <div className="flex flex-col gap-4">
          <div className="surface-card rounded-xl p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
              Información del curso
            </h2>
            <dl className="flex flex-col gap-3">
              {[
                { label: "Nombre completo", value: course.fullname },
                { label: "Nombre corto", value: course.shortname },
                {
                  label: "Resumen",
                  value: course.summary || "—",
                },
                {
                  label: "Categoría",
                  value: course.categoryName
                    ? `${course.categoryName} (ID ${course.categoryId})`
                    : course.categoryId != null
                    ? `ID ${course.categoryId}`
                    : "—",
                },
                { label: "Formato", value: course.format ?? "—" },
                {
                  label: "Matriculados",
                  value:
                    course.enrolledUserCount !== undefined
                      ? course.enrolledUserCount.toLocaleString("es-ES")
                      : "—",
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

          {/* Danger zone */}
          <div className="surface-card rounded-xl border border-[var(--danger)]/20 p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--danger)]">
              Zona de peligro
            </h2>
            <p className="mb-4 text-sm text-[var(--muted)]">
              Eliminar el curso es una acción permanente e irreversible.
            </p>
            <Link
              href={`/administracion/cursos/${course.id}/eliminar`}
              className="inline-flex items-center justify-center rounded-full border border-[var(--line)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--line-strong)] hover:bg-[var(--surface-strong)]"
            >
              Eliminar curso
            </Link>
          </div>
        </div>

        {/* Right: edit form */}
        <div className="surface-card rounded-xl p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            Editar curso
          </h2>
          <EditCourseForm course={course} />
        </div>
      </div>
    </div>
  );
}
