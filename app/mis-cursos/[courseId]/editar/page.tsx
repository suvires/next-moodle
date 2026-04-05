import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import {
  adminGetCategories,
  adminGetCourses,
  getUnreadConversationsCount,
  getUnreadNotificationCount,
  resolveUserAccessProfile,
} from "@/lib/moodle";
import {
  getUnsupportedMoodleFeatureMessage,
  isMoodleFeatureSupported,
} from "@/lib/moodle-feature-support";
import { requireSession } from "@/lib/session";
import { EditCourseForm } from "@/app/administracion/cursos/[courseId]/edit-course-form";

export default async function EditarCursoPage({
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

  const [courses, categories, unreadMessages, unreadNotifications] = await Promise.all([
    adminGetCourses(session.token, [id]).catch(() => []),
    adminGetCategories(session.token).catch(() => []),
    getUnreadConversationsCount(session.token, session.userId).catch(() => 0),
    getUnreadNotificationCount(session.token, session.userId).catch(() => 0),
  ]);

  const course = courses[0];
  if (!course) notFound();

  const courseUpdateSupported = isMoodleFeatureSupported(
    "courseUpdate",
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
          { label: "Editar" },
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
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Editar curso
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Modifica la configuración de este curso.
          </p>
        </div>

        {!courseUpdateSupported ? (
          <div className="banner-warning">
            <p className="font-semibold">Función no disponible</p>
            <p className="mt-1 opacity-80">
              {getUnsupportedMoodleFeatureMessage("courseUpdate")}
            </p>
          </div>
        ) : null}

        <div className="surface-card max-w-xl rounded-xl p-6">
          <EditCourseForm course={course} categories={categories} />
        </div>
      </main>
    </div>
  );
}
