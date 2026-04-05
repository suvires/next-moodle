"use server";

import { getCourseModule } from "@/lib/moodle";
import { logger } from "@/lib/logger";
import { requireSession } from "@/lib/session";

function buildModuleUrl(modname: string, instance: number, courseId: number): string | null {
  switch (modname) {
    case "assign":      return `/mis-cursos/${courseId}/tareas/${instance}`;
    case "quiz":        return `/mis-cursos/${courseId}/quiz/${instance}`;
    case "lesson":      return `/mis-cursos/${courseId}/leccion/${instance}`;
    case "forum":       return `/foros/${instance}?courseId=${courseId}`;
    case "wiki":        return `/mis-cursos/${courseId}/wiki/${instance}`;
    case "glossary":    return `/mis-cursos/${courseId}/glosario/${instance}`;
    case "feedback":    return `/mis-cursos/${courseId}/encuesta/${instance}`;
    case "book":        return `/mis-cursos/${courseId}/libro/${instance}`;
    case "choice":      return `/mis-cursos/${courseId}/votacion/${instance}`;
    case "h5pactivity": return `/mis-cursos/${courseId}/h5p/${instance}`;
    case "data":        return `/mis-cursos/${courseId}/base-datos/${instance}`;
    case "workshop":    return `/mis-cursos/${courseId}/taller/${instance}`;
    case "lti":         return `/mis-cursos/${courseId}/externo/${instance}`;
    default:            return `/mis-cursos/${courseId}`;
  }
}

export async function resolveCalendarEventUrlAction(
  cmid: number,
  fallbackCourseId?: number
): Promise<string | null> {
  const session = await requireSession();
  try {
    const cm = await getCourseModule(session.token, cmid);
    if (!cm) {
      logger.warn("getCourseModule returned null", { cmid, fallbackCourseId });
      return fallbackCourseId ? `/mis-cursos/${fallbackCourseId}` : null;
    }
    return buildModuleUrl(cm.modname, cm.instance, cm.courseId);
  } catch (error) {
    logger.error("resolveCalendarEventUrlAction failed", { cmid, fallbackCourseId, error });
    return fallbackCourseId ? `/mis-cursos/${fallbackCourseId}` : null;
  }
}
