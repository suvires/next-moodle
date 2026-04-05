import Link from "next/link";
import { redirect } from "next/navigation";
import { AppTopbar } from "@/app/components/app-topbar";
import { CourseRoleActionGrid } from "@/app/components/course-role-action-grid";
import { ProgressBar } from "@/app/components/progress-bar";
import { RichHtml } from "@/app/components/rich-html";
import { Card, CardContent } from "@/app/components/ui/card";
import { logger } from "@/lib/logger";
import {
  computeCourseProgress,
  getActivitiesCompletionStatus,
  getCourseGrades,
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
  type MoodleCourseAccessProfile,
  type MoodleCourseGrade,
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

function getCourseRoleChips(course: MoodleCourseAccessProfile) {
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

export default async function MyCoursesPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  let errorMessage: string | null = null;
  let expiredSession = false;
  let currentUserPictureUrl = session.userPictureUrl;
  const progressMap = new Map<number, { completed: number; total: number; percentage: number }>();
  const gradesMap = new Map<number, MoodleCourseGrade>();
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

    const [progressResults, courseGrades, events, unreadCount, userBadges, notifCount, recentCoursesResult, userPictureResult] = await Promise.all([
      Promise.allSettled(
        accessProfile.courseCapabilities.map((course) =>
          getActivitiesCompletionStatus(
            session.token,
            course.courseId,
            session.userId
          ).then((statuses) => ({
            courseId: course.courseId,
            progress: computeCourseProgress(statuses),
          }))
        )
      ),
      getCourseGrades(session.token, session.userId).catch(
        () => [] as MoodleCourseGrade[]
      ),
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

    for (const result of progressResults) {
      if (result.status === "fulfilled") {
        progressMap.set(result.value.courseId, result.value.progress);
      }
    }

    for (const grade of courseGrades) {
      gradesMap.set(grade.courseId, grade);
    }
  } catch (error) {
    expiredSession = isAuthenticationError(error);
    logger.error("Adaptive dashboard load failed", { userId: session.userId, error });
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
  const studentOnlyCourses = courseCapabilities.filter(
    (course) => course.roleBucket === "student"
  );
  const quickActions = getDashboardQuickActions({
    profileRole: accessProfile.primaryRole,
    canManageOwnFiles: accessProfile.siteInfo.userCanManageOwnFiles,
    primaryTeachingCourse: teachingCourses[0],
    primaryManagedCourse: managedCourses[0] || teachingCourses[0],
  });
  const navItems = [
    { href: "/catalogo", label: "Catálogo" },
    { href: "/buscar", label: "Buscar" },
    { href: "/calendario", label: "Calendario" },
    { href: "/ajustes", label: "Ajustes" },
    ...(accessProfile.siteInfo.userCanManageOwnFiles
      ? [{ href: "/archivos", label: "Archivos" }]
      : []),
    {
      href: "/mensajes",
      label: "Mensajes",
      badgeCount: unreadMessages,
    },
    {
      href: "/notificaciones",
      label: "Notificaciones",
      badgeCount: unreadNotifications,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <AppTopbar
        fullName={session.fullName}
        userPictureUrl={currentUserPictureUrl}
        breadcrumbs={[{ label: "Inicio" }]}
        navItems={navItems}
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
                                title: "Calificaciones",
                                body: "Mantén a mano la evaluación del curso.",
                                href: `/mis-cursos/${course.courseId}/calificaciones`,
                              },
                              {
                                title: "Catálogo",
                                body: "Comprueba cómo se presenta la oferta formativa fuera del curso.",
                                href: "/catalogo",
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

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-[var(--foreground)]">
              {accessProfile.hasCourses ? "Cursos visibles" : "Sin cursos visibles"}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {accessProfile.hasCourses
                ? "La portada ordena primero los cursos recientes y conserva el contexto del rol detectado."
                : "Si esperabas ver cursos aquí, revisa tu matriculación o los permisos que el token puede usar."}
            </p>
          </div>

          {courseCapabilities.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {courseCapabilities.map((course, index) => {
                const progress = progressMap.get(course.courseId);
                const grade = gradesMap.get(course.courseId);

                return (
                  <Link
                    key={course.courseId}
                    href={`/mis-cursos/${course.courseId}`}
                    className="course-card animate-rise-in group flex flex-col rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {course.shortname &&
                      course.shortname !== course.fullname ? (
                        <span className="chip chip-muted">{course.shortname}</span>
                      ) : null}
                      {course.roleBucket !== "student" ? (
                        <span
                          key={course.roleBucket}
                          className="rounded-full bg-[var(--surface-strong)] px-2.5 py-1 text-[0.7rem] font-medium text-[var(--muted)]"
                        >
                          {getCourseRoleLabel(course.roleBucket)}
                        </span>
                      ) : studentOnlyCourses.length !== courseCapabilities.length ? (
                        <span
                          key={`${course.courseId}-student`}
                          className="rounded-full bg-[var(--surface-strong)] px-2.5 py-1 text-[0.7rem] font-medium text-[var(--muted)]"
                        >
                          Alumno
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-3 font-bold leading-snug text-[var(--foreground)]">
                      {course.fullname}
                    </h3>

                    {progress && progress.total > 0 ? (
                      <div className="mt-4">
                        <div className="mb-1.5 flex items-center justify-between text-sm">
                          <span className="text-[var(--muted)]">Progreso</span>
                          <span className="font-semibold text-[var(--foreground)]">
                            {progress.percentage}%
                          </span>
                        </div>
                        <ProgressBar percentage={progress.percentage} />
                      </div>
                    ) : null}

                    {grade?.grade ? (
                      <p className="mt-3 text-sm text-[var(--muted)]">
                        Nota:{" "}
                        <span className="font-semibold text-[var(--accent)]">
                          {grade.grade}
                        </span>
                      </p>
                    ) : null}

                    {course.summary ? (
                      <RichHtml
                        html={course.summary}
                        className="mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--muted)]"
                      />
                    ) : (
                      <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                        Entra al curso para ver módulos, actividad reciente y
                        acciones disponibles.
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-10 text-center">
              <p className="text-base font-medium text-[var(--foreground)]">
                No hay cursos visibles para esta cuenta.
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Puedes explorar el catálogo público o revisar si la cuenta debe
                tener acceso a cursos, docencia o gestión.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link
                  href="/catalogo"
                  className="rounded-full bg-[var(--foreground)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                >
                  Ir al catálogo
                </Link>
                <Link
                  href="/perfil"
                  className="rounded-full border border-[var(--line-strong)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-strong)]"
                >
                  Ver perfil
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
