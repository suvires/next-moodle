import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  adminGetCourses,
  resolveUserAccessProfile,
} from "@/lib/moodle";
import { requireSession } from "@/lib/session";
import { DeleteCourseForm } from "./delete-course-form";

export default async function EliminarCursoPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await requireSession();
  const profile = await resolveUserAccessProfile(session.token, session.userId);
  if (!profile.canManagePlatform) {
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
          href={`/administracion/cursos/${course.id}`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]"
        >
          ← {course.fullname}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          Eliminar curso
        </h1>
      </div>

      {/* Warning banner */}
      <div className="banner-danger">
        <p className="font-semibold">
          Esta acción eliminará permanentemente el curso &ldquo;{course.fullname}&rdquo;.
          No se puede deshacer.
        </p>
        <p className="mt-1 opacity-80">
          Todos los contenidos, matriculaciones y datos del curso serán
          eliminados de forma irreversible.
        </p>
      </div>

      {/* Course summary card */}
      <div className="surface-card max-w-md rounded-xl p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Curso a eliminar
        </h2>
        <dl className="flex flex-col gap-3">
          {[
            { label: "Nombre completo", value: course.fullname },
            { label: "Nombre corto", value: course.shortname },
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

      {/* Actions */}
      <div className="flex items-center gap-3">
        <DeleteCourseForm courseId={course.id} />
        <Link
          href={`/administracion/cursos/${course.id}`}
          className="inline-flex items-center justify-center rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--line-strong)] hover:bg-[var(--surface-strong)]"
        >
          Cancelar
        </Link>
      </div>
    </div>
  );
}
