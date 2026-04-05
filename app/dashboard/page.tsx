import Link from "next/link";
import { redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { CourseCard } from "@/app/components/course-card";
import { CourseRoleActionGrid } from "@/app/components/course-role-action-grid";
import { RichHtml } from "@/app/components/rich-html";
import { Card, CardContent } from "@/app/components/ui/card";
import { logger } from "@/lib/logger";
import {
  getRecentCourses,
  getUnreadConversationsCount,
  getUnreadNotificationCount,
  getUpcomingEvents,
  getUserBadges,
  getUsersById,
  isAuthenticationError,
  resolveUserAccessProfile,
  type MoodleAccessProfile,
  type MoodleBadge,
  type MoodleCalendarEvent,
  type MoodleCourseRoleBucket,
} from "@/lib/moodle";
import { getCourseRoleLabel, getDashboardQuickActions } from "@/lib/course-roles";
import { getSession } from "@/lib/session";

function getRoleLabel(role: MoodleAccessProfile["primaryRole"]) {
  switch (role) {
    case "student":
      return "Alumno";
    case "teacher":
      return "Profesor";
    case "editing_teacher":
      return "Profesor con edición";
    case "course_manager":
      return "Gestor de curso";
    case "platform_manager":
      return "Gestión de plataforma";
    case "administrator":
      return "Administrador";
    case "authenticated_no_courses":
    default:
      return "Usuario autenticado";
  }
}

function normalizeRoleChip(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function getRoleDescription(profile: MoodleAccessProfile) {
  switch (profile.primaryRole) {
    case "teacher":
      return "Tienes visibilidad docente en al menos un curso, pero sin señales claras de edición.";
    case "editing_teacher":
      return "Moodle te concede docencia con edición en alguno de tus cursos.";
    case "course_manager":
      return "Tienes permisos de gestión a nivel de curso además de acceso docente.";
    case "platform_manager":
      return "Tu cuenta tiene señales de gestión elevadas en la portada o el contexto global.";
    case "administrator":
      return "Esta sesión tiene privilegios de administración del sitio.";
    case "student":
      return "Tu portada prioriza seguimiento académico, progreso y próximas fechas.";
    case "authenticated_no_courses":
    default:
      return "La cuenta está autenticada, pero no tiene cursos visibles ahora mismo.";
  }
}

function getRoleAccent(profile: MoodleAccessProfile) {
  switch (profile.primaryRole) {
    case "teacher":
    case "editing_teacher":
      return "text-[var(--accent)] bg-[var(--accent)]/10";
    case "course_manager":
    case "platform_manager":
    case "administrator":
      return "text-[var(--warning)] bg-[var(--warning-soft)]";
    case "authenticated_no_courses":
      return "text-[var(--muted)] bg-[var(--surface-strong)]";
    case "student":
    default:
      return "text-[var(--success)] bg-[var(--success-soft)]";
  }
}

function getRoleHeadline(profile: MoodleAccessProfile) {
  switch (profile.primaryRole) {
    case "teacher":
      return "Portada docente";
    case "editing_teacher":
      return "Portada de edición";
    case "course_manager":
      return "Portada de gestión de curso";
    case "platform_manager":
      return "Portada de gestión de plataforma";
    case "administrator":
      return "Portada de administración";
    case "authenticated_no_courses":
      return "Portada personal";
    case "student":
    default:
      return "Portada académica";
  }
}

function getCourseRoleChips(course: { roleBucket: MoodleCourseRoleBucket; roles: { name?: string }[]; fullname: string }) {
  const chips = [getCourseRoleLabel(course.roleBucket)];
  const normalizedChips = new Set(chips.map(normalizeRoleChip));

  for (const role of course.roles) {
    if (!role.name) continue;
    const normalizedRoleName = normalizeRoleChip(role.name);
    if (
      normalizedChips.has(normalizedRoleName) ||
      (course.roleBucket === "teacher" &&
        ["teacher", "noneditingteacher", "profesor", "docente"].includes(
          normalizedRoleName
        )) ||
      (course.roleBucket === "editing_teacher" &&
        [
          "editingteacher",
          "teacherediting",
          "profesorconedicion",
          "docenteconedicion",
        ].includes(normalizedRoleName)) ||
      (course.roleBucket === "course_manager" &&
        ["manager", "coursemanager", "gestor", "gestordecurso"].includes(
          normalizedRoleName
        ))
    ) {
      continue;
    }

    chips.push(role.name);
    normalizedChips.add(normalizedRoleName);
  }

  return chips;
}

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  let errorMessage: string | null = null;
  let expiredSession = false;
  let currentUserPictureUrl = session.userPictureUrl;
  let upcomingEvents: MoodleCalendarEvent[] = [];
  let unreadMessages = 0;
  let unreadNotifications = 0;
  let badges: MoodleBadge[] = [];
  let recentCourses: Awaited<ReturnType<typeof getRecentCourses>> = [];
  let accessProfile: MoodleAccessProfile = {
    isAuthenticated: true,
    hasCourses: false,
    enrolledCourseCount: 0,
    primaryRole: "authenticated_no_courses",
    isAdministrator: false,
    canManagePlatform: false,
    canTeachAnyCourse: false,
    canEditAnyCourse: false,
    canManageAnyCourse: false,
    siteInfo: {
      userId: session.userId,
      username: session.username,
      fullName: session.fullName,
      userPictureUrl: session.userPictureUrl,
      userIsSiteAdmin: false,
      userCanManageOwnFiles: false,
      canUploadFiles: false,
      canDownloadFiles: false,
      functions: [],
      advancedFeatures: [],
    },
    courseCapabilities: [],
  };

  try {
    accessProfile = await resolveUserAccessProfile(session.token, session.userId);
    currentUserPictureUrl =
      accessProfile.siteInfo.userPictureUrl || currentUserPictureUrl;

    const [events, unreadCount, userBadges, notifCount, recentCoursesResult, userPictureResult] = await Promise.all([
      getUpcomingEvents(session.token).catch(() => [] as MoodleCalendarEvent[]),
      getUnreadConversationsCount(session.token, session.userId).catch(() => 0),
      getUserBadges(session.token, session.userId).catch(() => [] as MoodleBadge[]),
      getUnreadNotificationCount(session.token, session.userId).catch(() => 0),
      getRecentCourses(session.token, session.userId).catch(
        () => [] as Awaited<ReturnType<typeof getRecentCourses>>
      ),
      !currentUserPictureUrl
        ? getUsersById(session.token, [session.userId]).catch(() => new Map())
        : Promise.resolve(new Map()),
    ]);

    if (!currentUserPictureUrl) {
      currentUserPictureUrl =
        userPictureResult.get(session.userId)?.pictureUrl || undefined;
    }

    upcomingEvents = events.slice(0, 5);
    unreadMessages = unreadCount;
    unreadNotifications = notifCount;
    badges = userBadges;
    recentCourses = recentCoursesResult;
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Dashboard load failed", { userId: session.userId, error });
    errorMessage = "No se pudo resolver tu portada en este momento.";
  }

  const courseCapabilities = [...accessProfile.courseCapabilities];

  if (recentCourses.length > 0) {
    const recentIds = new Map(
      recentCourses.map((course, index) => [course.id, index] as const)
    );

    courseCapabilities.sort((a, b) => {
      const aRank = recentIds.has(a.courseId) ? recentIds.get(a.courseId)! : 999;
      const bRank = recentIds.has(b.courseId) ? recentIds.get(b.courseId)! : 999;
      return aRank - bRank;
    });
  }

  const teachingCourses = courseCapabilities.filter((course) => course.canTeach);
  const editingCourses = courseCapabilities.filter(
    (course) => course.roleBucket === "editing_teacher"
  );
  const managedCourses = courseCapabilities.filter(
    (course) => course.roleBucket === "course_manager"
  );
  const teacherOnlyCourses = teachingCourses.filter(
    (course) => course.roleBucket === "teacher"
  );
  const quickActions = getDashboardQuickActions({
    profileRole: accessProfile.primaryRole,
    canManageOwnFiles: accessProfile.siteInfo.userCanManageOwnFiles,
    primaryTeachingCourse: teachingCourses[0],
    primaryManagedCourse: managedCourses[0] || teachingCourses[0],
  });

  return (
    <div className="flex min-h-screen flex-col">
      <AppTopbar
        fullName={session.fullName}
        userPictureUrl={currentUserPictureUrl}
        breadcrumbs={[{ label: "Inicio" }]}
        unreadMessages={unreadMessages}
        unreadNotifications={unreadNotifications}
        canManageOwnFiles={accessProfile.siteInfo.userCanManageOwnFiles}
      />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-5 py-8 md:px-8 md:py-10">
        <section className="animate-rise-in rounded-[1.75rem] border border-[var(--line)] bg-[linear-gradient(135deg,_rgba(240,173,78,0.18),_transparent_48%),var(--surface)] px-6 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getRoleAccent(accessProfile)}`}>
                {getRoleLabel(accessProfile.primaryRole)}
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] md:text-4xl">
                {getRoleHeadline(accessProfile)}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                Hola, {session.fullName.split(" ")[0]}. {getRoleDescription(accessProfile)}
              </p>
            </div>

            <div className="grid min-w-0 gap-3 sm:grid-cols-3 lg:min-w-[360px] lg:grid-cols-1 xl:grid-cols-3">
              <Card className="border-[var(--line)] bg-[var(--surface-strong)]">
                <CardContent className="space-y-1 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                    Cursos
                  </p>
                  <p className="text-2xl font-semibold text-[var(--foreground)]">
                    {accessProfile.enrolledCourseCount}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-[var(--line)] bg-[var(--surface-strong)]">
                <CardContent className="space-y-1 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                    Docencia
                  </p>
                  <p className="text-2xl font-semibold text-[var(--foreground)]">
                    {teachingCourses.length}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-[var(--line)] bg-[var(--surface-strong)]">
                <CardContent className="space-y-1 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                    Gestión
                  </p>
                  <p className="text-2xl font-semibold text-[var(--foreground)]">
                    {managedCourses.length +
                      (accessProfile.canManagePlatform || accessProfile.isAdministrator
                        ? 1
                        : 0)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <div className="banner-danger">
            <p className="font-semibold">
              {expiredSession
                ? "La sesión ya no es válida."
                : "No se pudo cargar tu portada adaptativa."}
            </p>
            <p className="mt-1 opacity-80">{errorMessage}</p>
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quickActions
            .filter((card) => Boolean(card.href))
            .map((card) => (
            <Link
              key={card.href}
              href={card.href!}
              className="animate-rise-in rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-5 transition hover:border-[var(--line-strong)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.08)]"
            >
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {card.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {card.body}
              </p>
            </Link>
          ))}
        </section>

        {upcomingEvents.length > 0 ? (
          <section className="animate-rise-in">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                Próximas fechas
              </h2>
              <Link
                href="/calendario"
                className="text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]"
              >
                Ver todo
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[var(--foreground)]">
                      {event.name}
                    </p>
                    {event.courseName ? (
                      <p className="truncate text-sm text-[var(--muted)]">
                        {event.courseName}
                      </p>
                    ) : null}
                  </div>
                  {event.timeStart ? (
                    <p className="shrink-0 text-sm text-[var(--muted)]">
                      {new Intl.DateTimeFormat("es-ES", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      }).format(new Date(event.timeStart * 1000))}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {badges.length > 0 ? (
          <section className="animate-rise-in">
            <h2 className="mb-4 text-lg font-bold text-[var(--foreground)]">
              Insignias
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex shrink-0 items-center gap-2.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2"
                >
                  {badge.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={badge.imageUrl}
                      alt={badge.name}
                      className="h-7 w-7 rounded-full object-contain"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)]/10">
                      <span className="text-xs font-bold text-[var(--accent)]">
                        {badge.name[0]}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {badge.name}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {teacherOnlyCourses.length > 0 ? (
          <section className="animate-rise-in">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                Docencia
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Cursos donde Moodle te asigna un rol docente sin edición.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {teacherOnlyCourses.map((course) => (
                <div
                  key={`teacher-${course.courseId}`}
                  className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {getCourseRoleChips(course).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[var(--surface-strong)] px-3 py-1 text-xs font-medium text-[var(--muted)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold leading-snug text-[var(--foreground)]">
                    {course.fullname}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Curso priorizado para seguimiento y revisión docente.
                  </p>
                  <div className="mt-4">
                    <CourseRoleActionGrid
                      sections={[
                        {
                          title: "Seguimiento y revisión",
                          description:
                            "Acciones disponibles hoy para seguimiento docente dentro de la app.",
                          tone: "accent",
                          actions: [
                            {
                              title: "Abrir curso",
                              body: "Entra al detalle del curso con contexto docente.",
                              href: `/mis-cursos/${course.courseId}`,
                            },
                            {
                              title: "Tareas",
                              body: "Accede al tablero de tareas del curso.",
                              href: `/mis-cursos/${course.courseId}/tareas`,
                            },
                            {
                              title: "Calificaciones",
                              body: "Consulta la evaluación que la app ya expone.",
                              href: `/mis-cursos/${course.courseId}/calificaciones`,
                            },
                          ],
                        },
                      ]}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {editingCourses.length > 0 ? (
          <section className="animate-rise-in">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                Cursos con edición
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Cursos donde tu rol incluye edición dentro del propio curso.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {editingCourses.map((course) => (
                <div
                  key={`editing-${course.courseId}`}
                  className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {getCourseRoleChips(course).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[var(--surface-strong)] px-3 py-1 text-xs font-medium text-[var(--muted)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold leading-snug text-[var(--foreground)]">
                    {course.fullname}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Curso priorizado para seguimiento docente y edición ligera.
                  </p>
                  <div className="mt-4">
                    <CourseRoleActionGrid
                      sections={[
                        {
                          title: "Edición ligera",
                          description:
                            "Accesos rápidos que hoy sí están soportados para docencia con edición.",
                          tone: "accent",
                          actions: [
                            {
                              title: "Abrir curso",
                              body: "Vuelve al detalle del curso con contexto de edición.",
                              href: `/mis-cursos/${course.courseId}`,
                            },
                            {
                              title: "Tareas",
                              body: "Sigue entregas y contexto académico del curso.",
                              href: `/mis-cursos/${course.courseId}/tareas`,
                            },
                            {
                              title: "Buscar",
                              body: "Usa búsqueda global mientras trabajas este curso.",
                              href: "/buscar",
                            },
                          ],
                        },
                      ]}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {managedCourses.length > 0 ||
        accessProfile.canManagePlatform ||
        accessProfile.isAdministrator ? (
          <section className="animate-rise-in">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                Gestión
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Secciones priorizadas para cuentas con capacidad de gestión de curso o plataforma.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {managedCourses.map((course) => (
                  <div
                    key={`managed-${course.courseId}`}
                    className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {getCourseRoleChips(course).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[var(--surface-strong)] px-3 py-1 text-xs font-medium text-[var(--muted)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="mt-4 text-lg font-semibold leading-snug text-[var(--foreground)]">
                      {course.fullname}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      Rol detectado en el curso: {getCourseRoleLabel(course.roleBucket)}.
                    </p>
                    {course.summary ? (
                      <RichHtml
                        html={course.summary}
                        className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--muted)]"
                      />
                    ) : (
                      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                        Abre el curso para centralizar tareas, calificaciones y actividad.
                      </p>
                    )}
                    <div className="mt-4">
                      <CourseRoleActionGrid
                        sections={[
                          {
                            title: "Administración del curso",
                            description:
                              "Acciones amplias ya disponibles para supervisión y control del curso.",
                            tone: "warning",
                            actions: [
                              {
                                title: "Abrir curso",
                                body: "Centraliza la supervisión desde el detalle del curso.",
                                href: `/mis-cursos/${course.courseId}`,
                              },
                              {
                                title: "Editar curso",
                                body: "Modifica nombre, categoría, visibilidad y descripción.",
                                href: `/mis-cursos/${course.courseId}/editar`,
                              },
                              {
                                title: "Matriculaciones",
                                body: "Gestiona quién tiene acceso a este curso.",
                                href: `/mis-cursos/${course.courseId}/matriculaciones`,
                              },
                            ],
                          },
                        ]}
                      />
                    </div>
                  </div>
              ))}

              {accessProfile.canManagePlatform || accessProfile.isAdministrator ? (
                <div className="rounded-2xl border border-[var(--warning)]/25 bg-[var(--warning)]/8 px-5 py-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="chip chip-warning">
                      {accessProfile.isAdministrator ? "Administrador" : "Gestión de plataforma"}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold leading-snug text-[var(--foreground)]">
                    Administración de plataforma
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Gestiona usuarios, cursos, matriculaciones y cohortes desde el panel de administración.
                  </p>
                  <Link
                    href="/administracion"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--warning)]/15 px-4 py-2 text-sm font-semibold text-[var(--warning)] transition hover:bg-[var(--warning)]/25"
                  >
                    Ir a Administración →
                  </Link>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {courseCapabilities.length > 0 ? (
          <section className="animate-rise-in">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                Mis cursos
              </h2>
              <Link
                href="/mis-cursos"
                className="text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]"
              >
                Ver todos →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {courseCapabilities.slice(0, 3).map((course, index) => (
                <Link key={course.courseId} href={`/mis-cursos/${course.courseId}`}>
                  <CourseCard
                    course={{
                      id: course.courseId,
                      fullname: course.fullname,
                      categoryName: course.categoryName,
                      summary: course.summary,
                    }}
                    animationDelay={index * 60}
                  />
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
