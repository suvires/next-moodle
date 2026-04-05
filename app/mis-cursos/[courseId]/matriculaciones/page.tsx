import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import {
  adminGetCohorts,
  adminGetCourses,
  adminGetEnrolledUsers,
  getUnreadConversationsCount,
  getUnreadNotificationCount,
  resolveUserAccessProfile,
} from "@/lib/moodle";
import {
  getUnsupportedMoodleFeatureMessage,
  isMoodleFeatureSupported,
} from "@/lib/moodle-feature-support";
import { requireSession } from "@/lib/session";
import { EnrolCohortForm } from "@/app/administracion/matriculaciones/enrol-cohort-form";
import { EnrolForm } from "@/app/administracion/matriculaciones/enrol-form";
import { UnenrolForm } from "@/app/administracion/matriculaciones/unenrol-form";

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

export default async function MatriculacionesCursoPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await requireSession();
  const { courseId } = await params;
  const id = Number(courseId);
  if (!id) notFound();

  const accessProfile = await resolveUserAccessProfile(session.token, session.userId);
  const capability = accessProfile.courseCapabilities.find((c) => c.courseId === id);

  if (!capability?.canManageCourse) {
    redirect(`/mis-cursos/${id}`);
  }

  const [courses, enrolledUsers, cohorts, unreadMessages, unreadNotifications] = await Promise.all([
    adminGetCourses(session.token, [id]).catch(() => []),
    adminGetEnrolledUsers(session.token, id).catch(() => []),
    adminGetCohorts(session.token).catch(() => []),
    getUnreadConversationsCount(session.token, session.userId).catch(() => 0),
    getUnreadNotificationCount(session.token, session.userId).catch(() => 0),
  ]);

  const course = courses[0];
  if (!course) notFound();

  const manualEnrolSupported = isMoodleFeatureSupported(
    "manualEnrol",
    accessProfile.siteInfo.functions
  );

  return (
    <div className="flex min-h-screen flex-col">
      <AppTopbar
        fullName={session.fullName}
        userPictureUrl={session.userPictureUrl}
        breadcrumbs={[
          { label: "Mis cursos", href: "/mis-cursos" },
          { label: course.fullname, href: `/mis-cursos/${id}` },
          { label: "Matriculaciones" },
        ]}
        unreadMessages={unreadMessages}
        unreadNotifications={unreadNotifications}
        canManageOwnFiles={accessProfile.siteInfo.userCanManageOwnFiles}
      />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-5 py-8 md:px-8 md:py-10">
        <div>
          <Link
            href={`/mis-cursos/${id}`}
            className="mb-3 inline-flex items-center gap-1 text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]"
          >
            ← {course.fullname}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Matriculaciones
            </h1>
            <span className="chip chip-muted">{enrolledUsers.length} usuarios</span>
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Gestiona quién tiene acceso a este curso.
          </p>
        </div>

        {!manualEnrolSupported ? (
          <div className="banner-warning">
            <p className="font-semibold">Función no disponible</p>
            <p className="mt-1 opacity-80">
              {getUnsupportedMoodleFeatureMessage("manualEnrol")}
            </p>
          </div>
        ) : null}

        {/* Enrolled users */}
        <div className="surface-card overflow-hidden rounded-xl">
          {enrolledUsers.length === 0 ? (
            <p className="p-6 text-sm text-[var(--muted)]">
              Este curso no tiene usuarios matriculados.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {enrolledUsers.map((user) => (
                <li key={user.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-cool)] text-sm font-bold text-white">
                    {getInitials(user.fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[var(--foreground)]">{user.fullName}</p>
                    <p className="truncate text-xs text-[var(--muted)]">{user.email ?? "—"}</p>
                  </div>
                  <div className="hidden shrink-0 flex-wrap gap-1 sm:flex">
                    {user.roles.map((role, i) => (
                      <span key={i} className="chip chip-muted">{role.name}</span>
                    ))}
                  </div>
                  <p className="hidden shrink-0 text-xs text-[var(--muted)] md:block">
                    {formatLastAccess(user.lastAccess)}
                  </p>
                  <UnenrolForm userId={user.id} courseId={id} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add enrolment */}
        <div className="surface-card rounded-xl p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            Añadir matriculación
          </h2>
          <EnrolForm courseId={id} />
        </div>

        {/* Cohort bulk enrolment */}
        <div className="surface-card rounded-xl p-6">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            Matricular cohorte
          </h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Matricula todos los miembros de una cohorte en este curso de una sola vez.
          </p>
          <EnrolCohortForm courseId={id} cohorts={cohorts} />
        </div>
      </main>
    </div>
  );
}
