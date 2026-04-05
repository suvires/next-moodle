import Link from "next/link";
import { redirect } from "next/navigation";
import {
  adminGetCategories,
  adminGetCourses,
  adminSearchUsers,
  resolveUserAccessProfile,
} from "@/lib/moodle";
import {
  requireSession,
  clearSessionIfAuthenticationError,
} from "@/lib/session";

const secciones = [
  {
    href: "/administracion/usuarios",
    title: "Usuarios",
    description: "Gestiona cuentas, contraseñas y estado de usuarios",
  },
  {
    href: "/administracion/cursos",
    title: "Cursos",
    description: "Crea, edita y elimina cursos de la plataforma",
  },
  {
    href: "/administracion/matriculaciones",
    title: "Matriculaciones",
    description: "Controla el acceso de usuarios a cursos concretos",
  },
  {
    href: "/administracion/cohortes",
    title: "Cohortes",
    description: "Agrupa usuarios para gestión y matriculación masiva",
  },
];

export default async function AdminDashboardPage() {
  const session = await requireSession();

  let profile;
  try {
    profile = await resolveUserAccessProfile(session.token, session.userId);
  } catch (error) {
    const cleared = await clearSessionIfAuthenticationError(error);
    if (cleared) {
      redirect("/");
    }
    redirect("/mis-cursos");
  }

  if (!profile.canManagePlatform) {
    redirect("/mis-cursos");
  }

  const adminToken = session.token;

  const [coursesResult, usersResult, categoriesResult] = await Promise.allSettled([
    adminGetCourses(adminToken),
    adminSearchUsers(adminToken, [{ key: "confirmed", value: "1" }]),
    adminGetCategories(adminToken),
  ]);

  const courses = coursesResult.status === "fulfilled" ? coursesResult.value : null;
  const users = usersResult.status === "fulfilled" ? usersResult.value : null;
  const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : null;

  const totalCourses = courses ? courses.length : null;
  const visibleCourses = courses ? courses.filter((c) => c.visible).length : null;
  const hiddenCourses = courses ? courses.filter((c) => !c.visible).length : null;
  const totalUsers = users ? users.length : null;
  const totalCategories = categories ? categories.length : null;

  const hasPartialFailure =
    coursesResult.status === "rejected" ||
    usersResult.status === "rejected" ||
    categoriesResult.status === "rejected";

  const roleLabel = "Gestor de plataforma";

  const stats = [
    { label: "Total cursos", value: totalCourses },
    { label: "Cursos visibles", value: visibleCourses },
    { label: "Cursos ocultos", value: hiddenCourses },
    { label: "Usuarios", value: totalUsers },
    { label: "Categorías", value: totalCategories },
  ];

  return (
    <div className="animate-rise-in flex flex-col gap-8">
      {hasPartialFailure && (
        <div className="banner-warning">
          <p className="font-semibold">Algunos datos no pudieron cargarse.</p>
          <p className="mt-1 opacity-80">
            Las estadísticas parcialmente disponibles se muestran con &ldquo;--&rdquo;.
            Comprueba la conectividad con Moodle o los permisos del token de administración.
          </p>
        </div>
      )}

      {/* Page header */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="chip chip-warning">{roleLabel}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] md:text-3xl">
          Panel de administración
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Vista general de la plataforma Moodle.
        </p>
      </div>

      {/* Stat grid */}
      <section>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="surface-card rounded-xl p-5"
            >
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {stat.value !== null ? stat.value.toLocaleString("es-ES") : "--"}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section cards */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-[var(--foreground)]">
          Secciones
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {secciones.map((seccion) => (
            <div
              key={seccion.href}
              className="surface-card rounded-xl p-5"
            >
              <p className="font-semibold text-[var(--foreground)]">
                {seccion.title}
              </p>
              <p className="mt-1.5 text-sm leading-6 text-[var(--muted)]">
                {seccion.description}
              </p>
              <Link
                href={seccion.href}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--warning)] transition hover:opacity-75"
              >
                Ir a {seccion.title} →
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
