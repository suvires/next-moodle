"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import {
  getUnsupportedMoodleFeatureMessage,
  resolveMoodleFeatureSupport,
} from "@/lib/moodle-feature-support";
import {
  MoodleApiError,
  resolveUserAccessProfile,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
  adminCreateCourse,
  adminUpdateCourse,
  adminDeleteCourse,
  adminEnrolUser,
  adminUnenrolUser,
  adminCreateCohort,
  adminUpdateCohort,
  adminDeleteCohort,
  adminAddCohortMember,
  adminRemoveCohortMember,
  getSiteInfo,
  type CreateUserInput,
  type CreateCourseInput,
  type CreateCohortInput,
} from "@/lib/moodle";
import {
  clearSessionIfAuthenticationError,
  requireSession,
} from "@/lib/session";

export type AdminActionState = {
  error: string | null;
  success: boolean;
};

async function requireAdminSession() {
  const session = await requireSession();
  const profile = await resolveUserAccessProfile(session.token, session.userId);
  if (!profile.isAdministrator && !profile.canManagePlatform) {
    redirect("/mis-cursos");
  }
  return { session, adminToken: session.token };
}

function handleAdminError(error: unknown, context: Record<string, unknown>): AdminActionState {
  if (error instanceof MoodleApiError) {
    logger.warn("Admin action failed", { ...context, code: error.code, error });
    return { error: error.message || "Error al comunicarse con Moodle.", success: false };
  }
  logger.error("Admin action unexpected error", { ...context, error });
  return { error: "Ha ocurrido un error inesperado.", success: false };
}

// ─── User actions ──────────────────────────────────────────────────────────────

export async function createUserAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const { adminToken } = await requireAdminSession().catch(() => {
    redirect("/mis-cursos");
  }) as Awaited<ReturnType<typeof requireAdminSession>>;

  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const auth = String(formData.get("auth") || "manual").trim();
  const department = String(formData.get("department") || "").trim() || undefined;

  if (!username || !password || !firstName || !lastName || !email) {
    return { error: "Rellena todos los campos obligatorios.", success: false };
  }

  const input: CreateUserInput = { username, password, firstName, lastName, email, auth, department };

  try {
    await adminCreateUser(adminToken, input);
    revalidatePath("/administracion/usuarios");
    return { error: null, success: true };
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) redirect("/");
    return handleAdminError(error, { username });
  }
}

export async function updateUserAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const { adminToken } = await requireAdminSession().catch(() => {
    redirect("/mis-cursos");
  }) as Awaited<ReturnType<typeof requireAdminSession>>;

  const userId = Number(formData.get("userId"));
  if (!userId) return { error: "ID de usuario inválido.", success: false };

  const firstName = String(formData.get("firstName") || "").trim() || undefined;
  const lastName = String(formData.get("lastName") || "").trim() || undefined;
  const email = String(formData.get("email") || "").trim() || undefined;
  const department = String(formData.get("department") || "").trim() || undefined;
  const institution = String(formData.get("institution") || "").trim() || undefined;
  const description = String(formData.get("description") || "").trim() || undefined;

  try {
    await adminUpdateUser(adminToken, { id: userId, firstName, lastName, email, department, institution, description });
    revalidatePath("/administracion/usuarios");
    revalidatePath(`/administracion/usuarios/${userId}`);
    return { error: null, success: true };
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) redirect("/");
    return handleAdminError(error, { userId });
  }
}

export async function suspendUserAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const { adminToken } = await requireAdminSession().catch(() => {
    redirect("/mis-cursos");
  }) as Awaited<ReturnType<typeof requireAdminSession>>;

  const userId = Number(formData.get("userId"));
  const suspend = formData.get("suspend") === "1";
  if (!userId) return { error: "ID de usuario inválido.", success: false };

  try {
    await adminUpdateUser(adminToken, { id: userId, suspended: suspend });
    revalidatePath("/administracion/usuarios");
    revalidatePath(`/administracion/usuarios/${userId}`);
    return { error: null, success: true };
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) redirect("/");
    return handleAdminError(error, { userId, suspend });
  }
}

export async function deleteUserAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const { adminToken } = await requireAdminSession().catch(() => {
    redirect("/mis-cursos");
  }) as Awaited<ReturnType<typeof requireAdminSession>>;

  const userId = Number(formData.get("userId"));
  if (!userId) return { error: "ID de usuario inválido.", success: false };

  try {
    await adminDeleteUser(adminToken, userId);
    revalidatePath("/administracion/usuarios");
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) redirect("/");
    return handleAdminError(error, { userId });
  }
  redirect("/administracion/usuarios");
}

// ─── Course actions ────────────────────────────────────────────────────────────

export async function createCourseAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const { adminToken } = await requireAdminSession().catch(() => {
    redirect("/mis-cursos");
  }) as Awaited<ReturnType<typeof requireAdminSession>>;

  const fullname = String(formData.get("fullname") || "").trim();
  const shortname = String(formData.get("shortname") || "").trim();
  const categoryId = Number(formData.get("categoryId") || 1);
  const summary = String(formData.get("summary") || "").trim() || undefined;
  const visible = formData.get("visible") !== "0";
  const format = String(formData.get("format") || "topics").trim();

  if (!fullname || !shortname) {
    return { error: "El nombre completo y el nombre corto son obligatorios.", success: false };
  }

  const input: CreateCourseInput = { fullname, shortname, categoryId, summary, visible, format };

  try {
    await adminCreateCourse(adminToken, input);
    revalidatePath("/administracion/cursos");
    return { error: null, success: true };
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) redirect("/");
    return handleAdminError(error, { fullname, shortname });
  }
}

export async function updateCourseAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const { adminToken } = await requireAdminSession().catch(() => {
    redirect("/mis-cursos");
  }) as Awaited<ReturnType<typeof requireAdminSession>>;

  const courseId = Number(formData.get("courseId"));
  if (!courseId) return { error: "ID de curso inválido.", success: false };

  const fullname = String(formData.get("fullname") || "").trim() || undefined;
  const shortname = String(formData.get("shortname") || "").trim() || undefined;
  const summary = String(formData.get("summary") || "").trim() || undefined;
  const visibleRaw = formData.get("visible");
  const visible = visibleRaw !== null ? visibleRaw !== "0" : undefined;

  try {
    await adminUpdateCourse(adminToken, { id: courseId, fullname, shortname, summary, visible });
    revalidatePath("/administracion/cursos");
    revalidatePath(`/administracion/cursos/${courseId}`);
    return { error: null, success: true };
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) redirect("/");
    return handleAdminError(error, { courseId });
  }
}

export async function deleteCourseAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const { adminToken } = await requireAdminSession().catch(() => {
    redirect("/mis-cursos");
  }) as Awaited<ReturnType<typeof requireAdminSession>>;

  const courseId = Number(formData.get("courseId"));
  if (!courseId) return { error: "ID de curso inválido.", success: false };

  try {
    await adminDeleteCourse(adminToken, courseId);
    revalidatePath("/administracion/cursos");
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) redirect("/");
    return handleAdminError(error, { courseId });
  }
  redirect("/administracion/cursos");
}

// ─── Enrollment actions ────────────────────────────────────────────────────────

export async function enrolUserAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const { adminToken } = await requireAdminSession().catch(() => {
    redirect("/mis-cursos");
  }) as Awaited<ReturnType<typeof requireAdminSession>>;

  const userId = Number(formData.get("userId"));
  const courseId = Number(formData.get("courseId"));
  const roleId = Number(formData.get("roleId") || 5);

  if (!userId || !courseId) {
    return { error: "ID de usuario y curso son obligatorios.", success: false };
  }

  try {
    await adminEnrolUser(adminToken, { userId, courseId, roleId });
    revalidatePath("/administracion/matriculaciones");
    return { error: null, success: true };
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) redirect("/");
    return handleAdminError(error, { userId, courseId });
  }
}

export async function unenrolUserAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const { adminToken } = await requireAdminSession().catch(() => {
    redirect("/mis-cursos");
  }) as Awaited<ReturnType<typeof requireAdminSession>>;

  const userId = Number(formData.get("userId"));
  const courseId = Number(formData.get("courseId"));

  if (!userId || !courseId) {
    return { error: "ID de usuario y curso son obligatorios.", success: false };
  }

  try {
    await adminUnenrolUser(adminToken, { userId, courseId });
    revalidatePath("/administracion/matriculaciones");
    return { error: null, success: true };
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) redirect("/");
    return handleAdminError(error, { userId, courseId });
  }
}

// ─── Cohort actions ────────────────────────────────────────────────────────────

export async function createCohortAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const { adminToken } = await requireAdminSession().catch(() => {
    redirect("/mis-cursos");
  }) as Awaited<ReturnType<typeof requireAdminSession>>;

  const name = String(formData.get("name") || "").trim();
  const idNumber = String(formData.get("idNumber") || "").trim() || undefined;
  const description = String(formData.get("description") || "").trim() || undefined;
  const visible = formData.get("visible") !== "0";

  if (!name) {
    return { error: "El nombre de la cohorte es obligatorio.", success: false };
  }

  const input: CreateCohortInput = { name, idNumber, description, visible };

  try {
    await adminCreateCohort(adminToken, input);
    revalidatePath("/administracion/cohortes");
    return { error: null, success: true };
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) redirect("/");
    return handleAdminError(error, { name });
  }
}

export async function updateCohortAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const { adminToken } = await requireAdminSession().catch(() => {
    redirect("/mis-cursos");
  }) as Awaited<ReturnType<typeof requireAdminSession>>;

  const cohortId = Number(formData.get("cohortId"));
  if (!cohortId) return { error: "ID de cohorte inválido.", success: false };

  const name = String(formData.get("name") || "").trim() || undefined;
  const idNumber = String(formData.get("idNumber") || "").trim() || undefined;
  const description = String(formData.get("description") || "").trim() || undefined;
  const visibleRaw = formData.get("visible");
  const visible = visibleRaw !== null ? visibleRaw !== "0" : undefined;

  try {
    await adminUpdateCohort(adminToken, { id: cohortId, name, idNumber, description, visible });
    revalidatePath("/administracion/cohortes");
    revalidatePath(`/administracion/cohortes/${cohortId}`);
    return { error: null, success: true };
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) redirect("/");
    return handleAdminError(error, { cohortId });
  }
}

export async function deleteCohortAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const { adminToken } = await requireAdminSession().catch(() => {
    redirect("/mis-cursos");
  }) as Awaited<ReturnType<typeof requireAdminSession>>;

  const cohortId = Number(formData.get("cohortId"));
  if (!cohortId) return { error: "ID de cohorte inválido.", success: false };

  try {
    await adminDeleteCohort(adminToken, cohortId);
    revalidatePath("/administracion/cohortes");
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) redirect("/");
    return handleAdminError(error, { cohortId });
  }
  redirect("/administracion/cohortes");
}

export async function addCohortMemberAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const { adminToken } = await requireAdminSession().catch(() => {
    redirect("/mis-cursos");
  }) as Awaited<ReturnType<typeof requireAdminSession>>;

  const cohortId = Number(formData.get("cohortId"));
  const userId = Number(formData.get("userId"));

  if (!cohortId || !userId) {
    return { error: "ID de cohorte y usuario son obligatorios.", success: false };
  }

  try {
    await adminAddCohortMember(adminToken, cohortId, userId);
    revalidatePath(`/administracion/cohortes/${cohortId}`);
    return { error: null, success: true };
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) redirect("/");
    return handleAdminError(error, { cohortId, userId });
  }
}

export async function removeCohortMemberAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const { adminToken } = await requireAdminSession().catch(() => {
    redirect("/mis-cursos");
  }) as Awaited<ReturnType<typeof requireAdminSession>>;

  const siteInfo = await getSiteInfo(adminToken);

  if (!resolveMoodleFeatureSupport(siteInfo.functions).cohortMemberRemoval) {
    return {
      error: getUnsupportedMoodleFeatureMessage("cohortMemberRemoval"),
      success: false,
    };
  }

  const cohortId = Number(formData.get("cohortId"));
  const userId = Number(formData.get("userId"));

  if (!cohortId || !userId) {
    return { error: "ID de cohorte y usuario son obligatorios.", success: false };
  }

  try {
    await adminRemoveCohortMember(adminToken, cohortId, userId);
    revalidatePath(`/administracion/cohortes/${cohortId}`);
    return { error: null, success: true };
  } catch (error) {
    if (await clearSessionIfAuthenticationError(error)) redirect("/");
    return handleAdminError(error, { cohortId, userId });
  }
}
