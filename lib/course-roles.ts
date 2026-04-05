import type { MoodleCourseRoleBucket, MoodleCourseAccessProfile } from "@/lib/moodle";

export function getCourseRoleLabel(role: MoodleCourseRoleBucket): string {
  switch (role) {
    case "teacher":
      return "Profesor";
    case "editing_teacher":
      return "Profesor con edición";
    case "course_manager":
      return "Gestor de curso";
    case "student":
    default:
      return "Alumno";
  }
}

export function getCourseRoleTone(role: MoodleCourseRoleBucket): string {
  switch (role) {
    case "teacher":
      return "bg-[var(--accent)]/10 text-[var(--accent)]";
    case "editing_teacher":
      return "bg-sky-500/10 text-sky-700";
    case "course_manager":
      return "bg-amber-500/15 text-amber-800";
    case "student":
    default:
      return "bg-emerald-500/15 text-emerald-700";
  }
}

export function getCourseRoleDescription(courseAccess: MoodleCourseAccessProfile): string {
  switch (courseAccess.roleBucket) {
    case "teacher":
      return "Moodle te identifica como docente sin edición en este curso.";
    case "editing_teacher":
      return "Moodle te identifica como docente con edición en este curso.";
    case "course_manager":
      return "Moodle te identifica con capacidades de gestión dentro de este curso.";
    case "student":
    default:
      return "Tu acceso en este curso es de alumno.";
  }
}

export type CourseRoleAction = {
  title: string;
  body: string;
  href?: string;
  tone?: "neutral" | "accent" | "success" | "warning";
};

export type CourseRoleActionSection = {
  title: string;
  description: string;
  tone?: "neutral" | "accent" | "success" | "warning";
  actions: CourseRoleAction[];
};

export function isStudentCourseRole(
  courseAccess: MoodleCourseAccessProfile
): boolean {
  return courseAccess.roleBucket === "student";
}

export function shouldShowStudentParticipationActions(
  courseAccess: MoodleCourseAccessProfile
): boolean {
  return isStudentCourseRole(courseAccess);
}

export function getCourseOverviewActionSections(
  courseId: number,
  courseAccess: MoodleCourseAccessProfile
): CourseRoleActionSection[] {
  const studentSection: CourseRoleActionSection = {
    title: "Aprendizaje",
    description: "Accesos orientados a completar actividad, entregar trabajo y consultar resultados.",
    tone: "success",
    actions: [
      {
        title: "Tareas",
        body: "Consulta el tablero de tareas y entra a cada entrega.",
        href: `/mis-cursos/${courseId}/tareas`,
        tone: "success",
      },
      {
        title: "Calificaciones",
        body: "Revisa tus resultados y la retroalimentación disponible.",
        href: `/mis-cursos/${courseId}/calificaciones`,
      },
    ],
  };

  if (courseAccess.roleBucket === "student") {
    return [studentSection];
  }

  const teacherSection: CourseRoleActionSection = {
    title: "Seguimiento y revisión",
    description: "Prioriza tareas, calificaciones y actividad del curso desde una mirada docente.",
    tone: "accent",
    actions: [
      {
        title: "Reportes del curso",
        body: "Abre el resumen docente del curso con actividad, tareas, quiz y foros.",
        href: `/mis-cursos/${courseId}/reportes`,
        tone: "accent",
      },
      {
        title: "Tareas del curso",
        body: "Revisa las tareas publicadas y entra en cada una con contexto docente.",
        href: `/mis-cursos/${courseId}/tareas`,
        tone: "accent",
      },
      {
        title: "Calificaciones",
        body: "Consulta la información de evaluación que la app ya expone.",
        href: `/mis-cursos/${courseId}/calificaciones`,
      },
      {
        title: "Buscar contenido",
        body: "Localiza materiales, foros y actividad mientras supervisas el curso.",
        href: "/buscar",
      },
    ],
  };

  if (courseAccess.canManageParticipants) {
    teacherSection.actions.splice(2, 0, {
      title: "Participantes",
      body: "Consulta la vista básica de participantes del curso.",
      href: `/mis-cursos/${courseId}/participantes`,
    });
  }

  if (courseAccess.roleBucket === "teacher") {
    return [teacherSection];
  }

  const editingSection: CourseRoleActionSection = {
    title: "Edición ligera",
    description: "Navegación rápida hacia superficies ya soportadas para docencia con edición.",
    tone: "accent",
    actions: [
      {
        title: "Detalle del curso",
        body: "Mantén a mano la vista global del curso y sus módulos visibles.",
        href: `/mis-cursos/${courseId}`,
        tone: "accent",
      },
      {
        title: "Reportes",
        body: "Abre el tablero docente del curso con foco operativo.",
        href: `/mis-cursos/${courseId}/reportes`,
      },
      {
        title: "Revisar tareas",
        body: "Abre el listado de tareas para seguir actividad y contexto de entrega.",
        href: `/mis-cursos/${courseId}/tareas`,
      },
      {
        title: "Buscar contenido",
        body: "Usa búsqueda global para localizar recursos o debates del campus.",
        href: "/buscar",
      },
    ],
  };

  if (courseAccess.roleBucket === "editing_teacher") {
    return [teacherSection, editingSection];
  }

  return [
    teacherSection,
    editingSection,
    {
      title: "Administración del curso",
      description: "Accesos amplios para supervisión y control del curso dentro de lo ya soportado.",
      tone: "warning",
      actions: [
        {
          title: "Editar curso",
          body: "Modifica nombre, categoría, visibilidad y descripción del curso.",
          href: `/mis-cursos/${courseId}/editar`,
          tone: "warning",
        },
        {
          title: "Matriculaciones",
          body: "Inscribe o da de baja usuarios en este curso.",
          href: `/mis-cursos/${courseId}/matriculaciones`,
          tone: "warning",
        },
        {
          title: "Calificaciones",
          body: "Centraliza la revisión de evaluación desde la vista del curso.",
          href: `/mis-cursos/${courseId}/calificaciones`,
          tone: "warning",
        },
        {
          title: "Reportes",
          body: "Consulta el resumen global del curso para seguimiento y supervisión.",
          href: `/mis-cursos/${courseId}/reportes`,
          tone: "warning",
        },
      ],
    },
  ];
}

export function getDashboardQuickActions(params: {
  profileRole: "student" | "teacher" | "editing_teacher" | "course_manager" | "platform_manager" | "administrator" | "authenticated_no_courses";
  canManageOwnFiles: boolean;
  primaryTeachingCourse?: MoodleCourseAccessProfile;
  primaryManagedCourse?: MoodleCourseAccessProfile;
}): CourseRoleAction[] {
  const {
    profileRole,
    canManageOwnFiles,
    primaryTeachingCourse,
    primaryManagedCourse,
  } = params;

  const baseActions: CourseRoleAction[] = [
    {
      href: "/buscar",
      title: "Buscar",
      body: "Localiza contenidos, foros y materiales en todo el campus.",
    },
    {
      href: "/calendario",
      title: "Calendario",
      body: "Revisa próximas fechas y actividad planificada.",
    },
    {
      href: "/perfil",
      title: "Perfil",
      body: "Consulta tus datos y el resumen general de tu cuenta.",
    },
    canManageOwnFiles
      ? {
          href: "/archivos",
          title: "Archivos privados",
          body: "Accede a tus documentos personales dentro de Moodle.",
        }
      : {
          href: "/ajustes",
          title: "Ajustes",
          body: "Gestiona preferencias personales y ajustes de tu cuenta.",
        },
  ];

  if (profileRole === "student" || profileRole === "authenticated_no_courses") {
    return baseActions.slice(0, 6);
  }

  const actions = [...baseActions];

  if (primaryTeachingCourse) {
    actions.unshift(
      {
        href: `/mis-cursos/${primaryTeachingCourse.courseId}/tareas`,
        title: "Seguimiento de tareas",
        body: "Prioriza el tablero de tareas del curso donde impartes docencia.",
        tone: "accent",
      },
      {
        href: `/mis-cursos/${primaryTeachingCourse.courseId}/calificaciones`,
        title: "Revisión académica",
        body: `Abre ${primaryTeachingCourse.fullname} con foco en seguimiento y evaluación.`,
        tone: "accent",
      }
    );

    if (primaryTeachingCourse.canManageParticipants) {
      actions.unshift({
        href: `/mis-cursos/${primaryTeachingCourse.courseId}/participantes`,
        title: "Participantes",
        body: "Abre la vista básica de participantes del curso docente principal.",
        tone: "accent",
      });
    }
  }

  if (
    (profileRole === "editing_teacher" || profileRole === "course_manager") &&
    primaryTeachingCourse
  ) {
    actions.unshift({
      href: `/mis-cursos/${primaryTeachingCourse.courseId}`,
      title: "Curso con edición",
      body: "Entra directamente al curso para usar las superficies ya soportadas con contexto de edición.",
      tone: "accent",
    });
  }

  if (profileRole === "course_manager" && primaryManagedCourse) {
    actions.unshift({
      href: `/mis-cursos/${primaryManagedCourse.courseId}`,
      title: "Curso gestionado",
      body: "Accede al curso con foco en supervisión y administración amplia.",
      tone: "warning",
    });
  }

  if (profileRole === "course_manager" || profileRole === "platform_manager" || profileRole === "administrator") {
    actions.push({
      href: "/catalogo",
      title: "Catálogo",
      body: "Comprueba la visibilidad pública de la oferta formativa.",
      tone: "warning",
    });
  }

  if (profileRole === "platform_manager" || profileRole === "administrator") {
    actions.push({
      href: "/administracion",
      title: "Administración",
      body: "Gestiona usuarios, cursos, matriculaciones y cohortes de la plataforma.",
      tone: "warning",
    });
  }

  return actions.slice(0, 6);
}

export function getActivityRoleActions(params: {
  courseId: number;
  courseAccess: MoodleCourseAccessProfile;
  activityType:
    | "assignment_list"
    | "assignment_detail"
    | "grades"
    | "quiz"
    | "forum"
    | "forum_discussion"
    | "choice";
}): CourseRoleAction[] {
  const { courseId, courseAccess, activityType } = params;

  if (courseAccess.roleBucket === "student") {
    switch (activityType) {
      case "assignment_list":
        return [
          {
            href: `/mis-cursos/${courseId}/tareas`,
            title: "Entregas",
            body: "Consulta tareas y entra en cada envío pendiente.",
            tone: "success",
          },
          {
            href: `/mis-cursos/${courseId}/calificaciones`,
            title: "Resultados",
            body: "Revisa la evaluación disponible del curso.",
          },
        ];
      case "assignment_detail":
        return [
          {
            href: `/mis-cursos/${courseId}/tareas`,
            title: "Volver a tareas",
            body: "Regresa al listado para revisar otras entregas.",
            tone: "success",
          },
          {
            href: `/mis-cursos/${courseId}/calificaciones`,
            title: "Ver calificaciones",
            body: "Consulta tus resultados y retroalimentación.",
          },
        ];
      case "grades":
        return [
          {
            href: `/mis-cursos/${courseId}`,
            title: "Volver al curso",
            body: "Retoma el curso con tu contexto académico.",
            tone: "success",
          },
          {
            href: `/mis-cursos/${courseId}/tareas`,
            title: "Ir a tareas",
            body: "Salta al tablero de tareas desde calificaciones.",
          },
        ];
      case "quiz":
        return [
          {
            href: `/mis-cursos/${courseId}/quiz`,
            title: "Cuestionarios",
            body: "Sigue tus intentos desde esta vista del curso.",
            tone: "success",
          },
          {
            href: `/mis-cursos/${courseId}/calificaciones`,
            title: "Calificaciones",
            body: "Consulta la evaluación general del curso.",
          },
        ];
      case "forum":
      case "forum_discussion":
        return [
          {
            href: `/mis-cursos/${courseId}`,
            title: "Volver al curso",
            body: "Retoma el curso y sus actividades visibles.",
            tone: "success",
          },
          {
            href: "/buscar",
            title: "Buscar",
            body: "Localiza otros materiales relacionados en el campus.",
          },
        ];
      case "choice":
        return [
          {
            href: `/mis-cursos/${courseId}`,
            title: "Volver al curso",
            body: "Regresa al curso tras revisar o emitir tu voto.",
            tone: "success",
          },
        ];
      default:
        return [];
    }
  }

  const teacherBase: CourseRoleAction[] = [
    {
      href: `/mis-cursos/${courseId}/reportes`,
      title: "Reportes del curso",
      body: "Consulta el resumen operativo de actividad, tareas, quiz y foros.",
      tone: "accent",
    },
    {
      href: `/mis-cursos/${courseId}/tareas`,
      title: "Seguimiento de tareas",
      body: "Abre el tablero de tareas con contexto de revisión docente.",
      tone: "accent",
    },
    {
      href: `/mis-cursos/${courseId}/calificaciones`,
      title: "Revisión académica",
      body: "Consulta la información de evaluación disponible en la app.",
    },
    {
      href: "/buscar",
      title: "Buscar contenido",
      body: "Localiza materiales y actividad relacionada en el campus.",
    },
  ];

  if (courseAccess.canManageParticipants) {
    teacherBase.splice(1, 0, {
      href: `/mis-cursos/${courseId}/participantes`,
      title: "Participantes",
      body: "Consulta la vista básica de participantes del curso.",
    });
  }

  if (activityType === "grades") {
    return teacherBase;
  }

  if (courseAccess.roleBucket === "teacher") {
    return teacherBase.slice(0, 3);
  }

  if (courseAccess.roleBucket === "editing_teacher") {
    return [
      ...teacherBase,
      {
        href: `/mis-cursos/${courseId}`,
        title: "Detalle del curso",
        body: "Vuelve a la vista general con contexto de edición ligera.",
      },
    ].slice(0, 3);
  }

  return [
    {
      href: `/mis-cursos/${courseId}`,
      title: "Administración del curso",
      body: "Centraliza la supervisión desde el detalle del curso.",
      tone: "warning",
    },
    {
      href: `/mis-cursos/${courseId}/calificaciones`,
      title: "Calificaciones",
      body: "Mantén a mano la vista de evaluación del curso.",
      tone: "warning",
    },
    {
      href: "/catalogo",
      title: "Catálogo",
      body: "Comprueba la presentación externa de la oferta formativa.",
    },
  ];
}
