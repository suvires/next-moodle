const FEATURE_FUNCTIONS = {
  notificationsMarkAllRead: ["core_message_mark_all_notifications_as_read"],
  contacts: ["core_message_get_user_contacts"],
  h5p: ["mod_h5pactivity_get_h5pactivities_by_courses", "mod_h5pactivity_get_attempts"],
  competencyStatus: ["tool_lp_data_for_user_competency_summary_in_course"],
  cohortMemberRemoval: ["core_cohort_delete_cohort_members"],
} as const;

export type MoodleFeatureSupportKey = keyof typeof FEATURE_FUNCTIONS;
export type MoodleFeatureSupportMap = Record<MoodleFeatureSupportKey, boolean>;

const UNAVAILABLE_MESSAGES: Record<MoodleFeatureSupportKey, string> = {
  notificationsMarkAllRead:
    "Tu sitio no expone la API para marcar todas las notificaciones como leídas desde la app.",
  contacts:
    "Tu sitio no expone la API de contactos en esta integración. La agenda de contactos no está disponible desde la app.",
  h5p:
    "Tu sitio no expone la API de H5P usada por esta app. La actividad se mantiene como referencia, pero sin detalle ni historial.",
  competencyStatus:
    "Tu sitio no expone la API de estado individual de competencias. Se mostrará el listado, pero no el progreso detallado por usuario.",
  cohortMemberRemoval:
    "Tu sitio no expone la API para quitar miembros de una cohorte desde la app.",
};

export function resolveMoodleFeatureSupport(
  availableFunctions: string[]
): MoodleFeatureSupportMap {
  const available = new Set(availableFunctions);

  return Object.fromEntries(
    Object.entries(FEATURE_FUNCTIONS).map(([feature, requiredFunctions]) => [
      feature,
      requiredFunctions.every((functionName) => available.has(functionName)),
    ])
  ) as MoodleFeatureSupportMap;
}

export function isMoodleFeatureSupported(
  feature: MoodleFeatureSupportKey,
  availableFunctions: string[]
) {
  return resolveMoodleFeatureSupport(availableFunctions)[feature];
}

export function getUnsupportedMoodleFeatureMessage(
  feature: MoodleFeatureSupportKey
) {
  return UNAVAILABLE_MESSAGES[feature];
}
