import { redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { AdminSidebar } from "@/app/administracion/components/admin-sidebar";
import { requireSession } from "@/lib/session";
import { resolveUserAccessProfile } from "@/lib/moodle";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  const profile = await resolveUserAccessProfile(session.token, session.userId);

  if (!profile.canManagePlatform) {
    redirect("/mis-cursos");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <AppTopbar
        fullName={session.fullName}
        userPictureUrl={session.userPictureUrl}
        breadcrumbs={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Administración" },
        ]}
      />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 md:flex-row md:gap-8 md:px-8">
        <AdminSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
