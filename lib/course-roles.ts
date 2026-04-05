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
