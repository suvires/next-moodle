const DEFAULT_MOODLE_SERVICE = "moodle_mobile_app";

type RawMoodleError = {
  error?: string;
  errorcode?: string;
  exception?: string;
  debuginfo?: string;
  message?: string;
};

export type MoodleUser = {
  id: number;
  username: string;
  fullName: string;
  userPictureUrl?: string;
};

export type MoodleCourse = {
  id: number;
  fullname: string;
  shortname: string;
  summary?: string;
};

export type MoodleModuleContent = {
  type?: string;
  filename?: string;
  fileurl?: string;
  mimetype?: string;
};

type RawMoodleModuleDate = {
  label?: string;
  timestamp?: number;
  dataid?: string;
};

type RawMoodleModuleCompletionRule = {
  rulename?: string;
  rulevalue?: {
    status?: number;
  };
};

type RawMoodleModuleCompletionData = {
  state?: number;
  timecompleted?: number;
  overrideby?: number | null;
  valueused?: boolean;
  isautomatic?: boolean;
  details?: RawMoodleModuleCompletionRule[];
};

type RawMoodleCourseModule = {
  id: number;
  name: string;
  modname: string;
  instance?: number;
  url?: string;
  description?: string;
  uservisible?: boolean;
  visibleoncoursepage?: boolean;
  availabilityinfo?: string;
  completion?: number;
  completiondata?: RawMoodleModuleCompletionData;
  dates?: RawMoodleModuleDate[];
  contents?: MoodleModuleContent[];
};

type RawMoodleCourseSection = {
  id: number;
  name?: string;
  summary?: string;
  modules?: RawMoodleCourseModule[];
};

export type MoodleCourseModule = {
  id: number;
  name: string;
  modname: string;
  instance?: number;
  url?: string;
  description?: string;
  userVisible: boolean;
  visibleOnCoursePage: boolean;
  availabilityInfo?: string;
  completionTracking: "none" | "manual" | "automatic";
  completionState: "incomplete" | "complete" | "complete-pass" | "complete-fail";
  completionTime?: number;
  canManuallyToggleCompletion: boolean;
  dates: Array<{
    label: string;
    timestamp: number;
    dataId?: string;
  }>;
  contents: MoodleModuleContent[];
};

export type MoodleCourseSection = {
  id: number;
  name: string;
  summary?: string;
  modules: MoodleCourseModule[];
};

type RawMoodleForum = {
  id: number;
  course: number;
  cmid: number;
  type: string;
  name: string;
  intro?: string;
  cancreatediscussions?: boolean;
};

type RawMoodleUrl = {
  id: number;
  coursemodule: number;
  externalurl?: string;
};

export type MoodleForum = {
  id: number;
  courseId: number;
  courseModuleId: number;
  type: string;
  name: string;
  intro?: string;
  canCreateDiscussions: boolean;
};

type RawMoodleForumAccess = {
  canstartdiscussion?: boolean;
  canreplypost?: boolean;
  canaddnews?: boolean;
  canreplynews?: boolean;
};

export type MoodleForumAccess = {
  canStartDiscussion: boolean;
  canReplyPost: boolean;
  canAddNews: boolean;
  canReplyNews: boolean;
};

type RawMoodleForumDiscussion = {
  discussion: number;
  name?: string;
  subject?: string;
  message?: string;
  userid?: number;
  usermodified?: number;
  userfullname?: string;
  usermodifiedfullname?: string;
  userpictureurl?: string;
  usermodifiedpictureurl?: string;
  numreplies?: number;
  pinned?: boolean;
  locked?: boolean;
  canreply?: boolean;
  timecreated?: number;
  created?: number;
  timemodified?: number;
};

export type MoodleForumDiscussion = {
  id: number;
  title: string;
  message?: string;
  authorName?: string;
  authorId?: number;
  startedByName?: string;
  lastAuthorName?: string;
  lastAuthorId?: number;
  authorPictureUrl?: string;
  lastAuthorPictureUrl?: string;
  repliesCount: number;
  pinned: boolean;
  locked: boolean;
  canReply: boolean;
  createdAt?: number;
  startedAt?: number;
  modifiedAt?: number;
};

type RawMoodleForumDiscussionPost = {
  id: number;
  subject: string;
  replysubject?: string;
  message?: string;
  author?: {
    id?: number;
    fullname?: string;
    urls?: {
      profileimage?: string;
    };
  };
  discussionid: number;
  hasparent?: boolean;
  parentid?: number;
  timecreated?: number;
  capabilities?: {
    reply?: boolean;
  };
};

export type MoodleForumDiscussionPost = {
  id: number;
  subject: string;
  replySubject?: string;
  message?: string;
  authorId?: number;
  authorName?: string;
  authorPictureUrl?: string;
  discussionId: number;
  parentId?: number;
  createdAt?: number;
  canReply: boolean;
};

type RawMoodleCanAddDiscussion = {
  status?: boolean;
};

type RawMoodleManualCompletionResult = {
  cmid?: number;
  status?: boolean;
  warnings?: Array<{
    message?: string;
  }>;
};

type RawMoodleViewResult = {
  status?: boolean;
  warnings?: Array<{
    message?: string;
  }>;
};

type RawMoodleScormAccessInformation = {
  warnings?: Array<{
    item?: string;
    itemid?: number;
    warningcode?: string;
    message?: string;
  }>;
  canaddnewattempt?: boolean;
  candeletetracks?: boolean;
  canskipview?: boolean;
  cansavetracks?: boolean;
  preventskip?: boolean;
  updatefreq?: number;
  warningscount?: number;
  [key: string]: unknown;
};

type RawMoodleScormScoesResponse = {
  warnings?: Array<{
    item?: string;
    itemid?: number;
    warningcode?: string;
    message?: string;
  }>;
  scoes?: Array<{
    id?: number;
    scorm?: number;
    manifest?: string;
    organization?: string;
    parent?: string;
    identifier?: string;
    launch?: string;
    scormtype?: string;
    title?: string;
    sortorder?: number;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
};

type RawMoodleScormAttemptCountResponse = {
  warnings?: Array<{
    item?: string;
    itemid?: number;
    warningcode?: string;
    message?: string;
  }>;
  attempts?: number;
  [key: string]: unknown;
};

type RawMoodleScormUserDataResponse = {
  warnings?: Array<{
    item?: string;
    itemid?: number;
    warningcode?: string;
    message?: string;
  }>;
  data?: Array<{
    scoid?: number;
    attempt?: number;
    userdata?: Array<{
      element?: string;
      value?: string;
      [key: string]: unknown;
    }>;
    defaultdata?: Array<{
      element?: string;
      value?: string;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
};

type RawMoodleScormScoTracksResponse = {
  warnings?: Array<{
    item?: string;
    itemid?: number;
    warningcode?: string;
    message?: string;
  }>;
  tracks?: Array<{
    element?: string;
    value?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
};

type RawMoodleScormLaunchScoResponse = {
  warnings?: Array<{
    item?: string;
    itemid?: number;
    warningcode?: string;
    message?: string;
  }>;
  status?: boolean;
  [key: string]: unknown;
};

type RawMoodleInsertScormTracksResponse = {
  warnings?: Array<{
    item?: string;
    itemid?: number;
    warningcode?: string;
    message?: string;
  }>;
  [key: string]: unknown;
};

type RawMoodleScormSummary = {
  id?: number;
  course?: number;
  coursemodule?: number;
  name?: string;
  intro?: string;
  introformat?: number;
  packageurl?: string;
  reference?: string;
  revision?: number;
  version?: string;
  maxattempt?: number;
  grademethod?: number;
  whatgrade?: number;
  maxgrade?: number;
  popup?: number;
  width?: number;
  height?: number;
  launch?: number;
  skipview?: number;
  hidebrowse?: number;
  hidetoc?: number;
  nav?: number;
  navpositionleft?: number;
  auto?: number;
  popupstatus?: number;
  [key: string]: unknown;
};

type RawMoodleScormsByCoursesResponse = {
  scorms?: RawMoodleScormSummary[];
  warnings?: Array<{
    item?: string;
    itemid?: number;
    warningcode?: string;
    message?: string;
  }>;
};

type RawMoodleUserProfile = {
  id: number;
  fullname?: string;
  profileimageurl?: string;
  profileimageurlsmall?: string;
  userpictureurl?: string;
  userpictureurlsmall?: string;
  profileimageurlhttps?: string;
};

export class MoodleApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "MoodleApiError";
    this.code = code;
  }
}

type MoodleConfig = {
  siteUrl: string;
  restUrl: string;
  tokenUrl: string;
  service: string;
};

type TokenResponse = RawMoodleError & {
  token?: string;
};

type RawMoodleSiteFunction = {
  name?: string;
  version?: string;
};

type RawMoodleAdvancedFeature = {
  name?: string;
  value?: number;
};

type SiteInfoResponse = RawMoodleError & {
  siteid?: number;
  sitename?: string;
  siteurl?: string;
  userid?: number;
  username?: string;
  fullname?: string;
  userpictureurl?: string;
  userissiteadmin?: boolean;
  usercanmanageownfiles?: boolean;
  uploadfiles?: boolean;
  downloadfiles?: boolean;
  functions?: RawMoodleSiteFunction[];
  advancedfeatures?: RawMoodleAdvancedFeature[];
  release?: string;
  version?: string;
};

type RawMoodleCourseOption = {
  name?: string;
  available?: boolean;
};

type RawMoodleCourseOptionsResponse = {
  courses?: Array<{
    id: number;
    options?: RawMoodleCourseOption[];
  }>;
};

type RawMoodleEnrolledUserRole = {
  roleid?: number;
  name?: string;
  shortname?: string;
  sortorder?: number;
};

type RawMoodleEnrolledUser = {
  id: number;
  fullname?: string;
  email?: string;
  lastaccess?: number;
  profileimageurl?: string;
  profileimageurlsmall?: string;
  userpictureurl?: string;
  userpictureurlsmall?: string;
  roles?: RawMoodleEnrolledUserRole[];
};

type RawMoodleCourseUserProfile = {
  id?: number;
  roles?: RawMoodleEnrolledUserRole[];
};

export type MoodleSiteInfo = {
  siteId?: number;
  siteName?: string;
  siteUrl?: string;
  userId: number;
  username: string;
  fullName: string;
  userPictureUrl?: string;
  userIsSiteAdmin: boolean;
  userCanManageOwnFiles: boolean;
  canUploadFiles: boolean;
  canDownloadFiles: boolean;
  functions: string[];
  advancedFeatures: string[];
  release?: string;
  version?: string;
};

export type MoodleCourseOptionMap = Record<string, boolean>;

export type MoodleCourseRoleAssignment = {
  roleId?: number;
  name: string;
  shortName?: string;
  sortOrder?: number;
};

export type MoodleCourseParticipant = {
  id: number;
  fullName: string;
  email?: string;
  pictureUrl?: string;
  lastAccess?: number;
  roles: MoodleCourseRoleAssignment[];
  roleBucket: MoodleCourseRoleBucket;
};

export type MoodleCourseRoleBucket =
  | "student"
  | "teacher"
  | "editing_teacher"
  | "course_manager";

export type MoodleAccessRole =
  | "authenticated_no_courses"
  | "student"
  | "teacher"
  | "editing_teacher"
  | "course_manager"
  | "platform_manager"
  | "administrator";

export type MoodleCourseAccessProfile = {
  courseId: number;
  fullname: string;
  shortname?: string;
  summary?: string;
  roleBucket: MoodleCourseRoleBucket;
  roles: MoodleCourseRoleAssignment[];
  canTeach: boolean;
  canEdit: boolean;
  canManageCourse: boolean;
  canManageParticipants: boolean;
  canViewGrades: boolean;
  canViewReports: boolean;
  adminOptions: MoodleCourseOptionMap;
  navigationOptions: MoodleCourseOptionMap;
};

export type MoodleAccessProfile = {
  isAuthenticated: true;
  hasCourses: boolean;
  enrolledCourseCount: number;
  primaryRole: MoodleAccessRole;
  isAdministrator: boolean;
  canManagePlatform: boolean;
  canTeachAnyCourse: boolean;
  canEditAnyCourse: boolean;
  canManageAnyCourse: boolean;
  siteInfo: MoodleSiteInfo;
  courseCapabilities: MoodleCourseAccessProfile[];
};

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function resolveMoodleConfig(): MoodleConfig {
  const rawUrl = process.env.MOODLE_API_URL;

  if (!rawUrl) {
    throw new MoodleApiError(
      "Falta la variable de entorno MOODLE_API_URL.",
      "missing_config"
    );
  }

  const normalizedUrl = stripTrailingSlash(rawUrl.trim());
  let siteUrl = normalizedUrl;

  if (normalizedUrl.endsWith("/webservice/rest/server.php")) {
    siteUrl = normalizedUrl.replace(/\/webservice\/rest\/server\.php$/, "");
  } else if (normalizedUrl.endsWith("/login/token.php")) {
    siteUrl = normalizedUrl.replace(/\/login\/token\.php$/, "");
  }

  return {
    siteUrl,
    restUrl: `${siteUrl}/webservice/rest/server.php`,
    tokenUrl: `${siteUrl}/login/token.php`,
    service: process.env.MOODLE_SERVICE?.trim() || DEFAULT_MOODLE_SERVICE,
  };
}

function getServerMoodleToken() {
  const token = process.env.MOODLE_API_TOKEN?.trim();

  if (!token) {
    throw new MoodleApiError(
      "Falta la variable de entorno MOODLE_API_TOKEN.",
      "missing_server_token"
    );
  }

  return token;
}

export function getAdminMoodleToken(): string {
  return getServerMoodleToken();
}

function toMoodleError(payload: RawMoodleError, fallbackMessage: string) {
  return new MoodleApiError(
    payload.error || payload.message || fallbackMessage,
    payload.errorcode || payload.exception
  );
}

function isRawMoodleError(payload: unknown): payload is RawMoodleError {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  return (
    "error" in payload ||
    "errorcode" in payload ||
    "exception" in payload ||
    "message" in payload
  );
}

function pickUserPictureUrl(user: {
  profileimageurl?: string;
  profileimageurlsmall?: string;
  userpictureurl?: string;
  userpictureurlsmall?: string;
  profileimageurlhttps?: string;
}) {
  return (
    user.profileimageurl ||
    user.profileimageurlsmall ||
    user.userpictureurl ||
    user.userpictureurlsmall ||
    user.profileimageurlhttps
  );
}

async function parseJsonResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  const rawText = await response.text();

  let payload: unknown;

  try {
    payload = JSON.parse(rawText);
  } catch {
    throw new MoodleApiError(fallbackMessage, "invalid_json");
  }

  if (!response.ok) {
    if (isRawMoodleError(payload)) {
      throw toMoodleError(payload, fallbackMessage);
    }

    throw new MoodleApiError(fallbackMessage, "http_error");
  }

  return payload as T;
}

async function moodleRequest<T>(
  token: string,
  wsfunction: string,
  params: Record<string, string>
) {
  const config = resolveMoodleConfig();
  const body = new URLSearchParams({
    wstoken: token,
    wsfunction,
    moodlewsrestformat: "json",
    ...params,
  });

  const response = await fetch(config.restUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  const payload = await parseJsonResponse<T | RawMoodleError>(
    response,
    "La respuesta de Moodle no es valida."
  );

  if (isRawMoodleError(payload)) {
    throw toMoodleError(payload, "Moodle devolvio un error.");
  }

  return payload as T;
}

function normalizeCourseOptionMap(options?: RawMoodleCourseOption[]) {
  return (options || []).reduce<MoodleCourseOptionMap>((acc, option) => {
    if (option.name) {
      acc[option.name] = Boolean(option.available);
    }

    return acc;
  }, {});
}

function normalizeRoleIdentifier(value?: string) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function deriveCourseRoleBucket(
  roles: MoodleCourseRoleAssignment[]
): MoodleCourseRoleBucket {
  const normalizedIdentifiers = roles.flatMap((role) => [
    normalizeRoleIdentifier(role.shortName),
    normalizeRoleIdentifier(role.name),
  ]);

  if (
    normalizedIdentifiers.some((role) =>
      [
        "manager",
        "coursemanager",
        "gestor",
        "gestordecurso",
        "courseadministrator",
      ].includes(role)
    )
  ) {
    return "course_manager";
  }

  if (
    normalizedIdentifiers.some((role) =>
      [
        "editingteacher",
        "teacherediting",
        "profesorconedicion",
        "docenteconedicion",
        "editingprofessor",
      ].includes(role)
    )
  ) {
    return "editing_teacher";
  }

  if (
    normalizedIdentifiers.some((role) =>
      [
        "teacher",
        "noneditingteacher",
        "profesor",
        "docente",
        "tutor",
      ].includes(role)
    )
  ) {
    return "teacher";
  }

  return "student";
}

function buildCourseIdsParams(courseIds: number[]) {
  return [...new Set(courseIds.filter((courseId) => courseId > 0))].reduce<
    Record<string, string>
  >((acc, courseId, index) => {
    acc[`courseids[${index}]`] = String(courseId);
    return acc;
  }, {});
}

function deriveCourseAccessProfile(
  course: MoodleCourse,
  roles: MoodleCourseRoleAssignment[],
  adminOptions: MoodleCourseOptionMap,
  navigationOptions: MoodleCourseOptionMap
): MoodleCourseAccessProfile {
  const roleBucket = deriveCourseRoleBucket(roles);
  const canManageParticipants =
    Boolean(navigationOptions.participants) || Boolean(adminOptions.roles);
  const canViewGrades =
    Boolean(navigationOptions.grades) || Boolean(adminOptions.gradebook);
  const canViewReports = Boolean(adminOptions.reports);
  const canTeach = roleBucket !== "student";
  const canEdit =
    roleBucket === "editing_teacher" || roleBucket === "course_manager";
  const canManageCourse = roleBucket === "course_manager";

  return {
    courseId: course.id,
    fullname: course.fullname,
    shortname: course.shortname || undefined,
    summary: course.summary || undefined,
    roleBucket,
    roles,
    canTeach,
    canEdit,
    canManageCourse,
    canManageParticipants,
    canViewGrades,
    canViewReports,
    adminOptions,
    navigationOptions,
  };
}

export function hasPublicCourseCatalogAccess() {
  return Boolean(process.env.MOODLE_API_TOKEN?.trim());
}

export async function authenticateWithMoodle(
  username: string,
  password: string
): Promise<{ token: string; user: MoodleUser }> {
  const config = resolveMoodleConfig();
  const tokenParams = new URLSearchParams({
    username,
    password,
    service: config.service,
  });

  const tokenResponse = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: tokenParams,
    cache: "no-store",
  });

  const tokenPayload = await parseJsonResponse<TokenResponse>(
    tokenResponse,
    "No se pudo iniciar sesion en Moodle."
  );

  if (!tokenPayload.token) {
    throw toMoodleError(
      tokenPayload,
      "Moodle no devolvio un token de acceso valido."
    );
  }

  const siteInfo = await moodleRequest<SiteInfoResponse>(
    tokenPayload.token,
    "core_webservice_get_site_info",
    {}
  );

  if (!siteInfo.userid || !siteInfo.username || !siteInfo.fullname) {
    throw new MoodleApiError(
      "No se pudo obtener la informacion del usuario autenticado.",
      "invalid_site_info"
    );
  }

  const fallbackProfile = siteInfo.userpictureurl
    ? undefined
    : (await getUsersById(tokenPayload.token, [siteInfo.userid])).get(
        siteInfo.userid
      );

  return {
    token: tokenPayload.token,
    user: {
      id: siteInfo.userid,
      username: siteInfo.username,
      fullName: siteInfo.fullname,
      userPictureUrl: siteInfo.userpictureurl || fallbackProfile?.pictureUrl,
    },
  };
}

export async function getSiteInfo(token: string): Promise<MoodleSiteInfo> {
  const siteInfo = await moodleRequest<SiteInfoResponse>(
    token,
    "core_webservice_get_site_info",
    {}
  );

  if (!siteInfo.userid || !siteInfo.username || !siteInfo.fullname) {
    throw new MoodleApiError(
      "No se pudo obtener la informacion del usuario autenticado.",
      "invalid_site_info"
    );
  }

  return {
    siteId: siteInfo.siteid,
    siteName: siteInfo.sitename?.trim() || undefined,
    siteUrl: siteInfo.siteurl?.trim() || undefined,
    userId: siteInfo.userid,
    username: siteInfo.username,
    fullName: siteInfo.fullname,
    userPictureUrl: siteInfo.userpictureurl || undefined,
    userIsSiteAdmin: Boolean(siteInfo.userissiteadmin),
    userCanManageOwnFiles: Boolean(siteInfo.usercanmanageownfiles),
    canUploadFiles: Boolean(siteInfo.uploadfiles),
    canDownloadFiles: Boolean(siteInfo.downloadfiles),
    functions: (siteInfo.functions || [])
      .map((fn) => fn.name?.trim() || "")
      .filter(Boolean),
    advancedFeatures: (siteInfo.advancedfeatures || [])
      .filter((feature) => Number(feature.value) > 0)
      .map((feature) => feature.name?.trim() || "")
      .filter(Boolean),
    release: siteInfo.release?.trim() || undefined,
    version: siteInfo.version?.trim() || undefined,
  };
}

export async function getUserAdministrationOptions(
  token: string,
  courseIds: number[]
) {
  const params = buildCourseIdsParams(courseIds);

  if (Object.keys(params).length === 0) {
    return new Map<number, MoodleCourseOptionMap>();
  }

  const response = await moodleRequest<RawMoodleCourseOptionsResponse>(
    token,
    "core_course_get_user_administration_options",
    params
  );

  return new Map(
    (response.courses || []).map((course) => [
      course.id,
      normalizeCourseOptionMap(course.options),
    ])
  );
}

export async function getUserNavigationOptions(token: string, courseIds: number[]) {
  const params = buildCourseIdsParams(courseIds);

  if (Object.keys(params).length === 0) {
    return new Map<number, MoodleCourseOptionMap>();
  }

  const response = await moodleRequest<RawMoodleCourseOptionsResponse>(
    token,
    "core_course_get_user_navigation_options",
    params
  );

  return new Map(
    (response.courses || []).map((course) => [
      course.id,
      normalizeCourseOptionMap(course.options),
    ])
  );
}

export async function getCourseUserRoleAssignments(
  token: string,
  courseId: number,
  userId: number
) {
  const users = await moodleRequest<RawMoodleEnrolledUser[]>(
    token,
    "core_enrol_get_enrolled_users",
    {
      courseid: String(courseId),
    }
  );

  const currentUser = (users || []).find((user) => user.id === userId);

  return (currentUser?.roles || []).map((role) => ({
    roleId: role.roleid,
    name: role.name?.trim() || role.shortname?.trim() || "Sin rol",
    shortName: role.shortname?.trim() || undefined,
    sortOrder: role.sortorder,
  })) satisfies MoodleCourseRoleAssignment[];
}

export async function getCourseParticipants(token: string, courseId: number) {
  const users = await moodleRequest<RawMoodleEnrolledUser[]>(
    token,
    "core_enrol_get_enrolled_users",
    {
      courseid: String(courseId),
    }
  );

  return (users || [])
    .map((user) => {
      const roles = (user.roles || []).map((role) => ({
        roleId: role.roleid,
        name: role.name?.trim() || role.shortname?.trim() || "Sin rol",
        shortName: role.shortname?.trim() || undefined,
        sortOrder: role.sortorder,
      })) satisfies MoodleCourseRoleAssignment[];

      return {
        id: user.id,
        fullName: user.fullname?.trim() || `Usuario ${user.id}`,
        email: user.email?.trim() || undefined,
        pictureUrl: pickUserPictureUrl(user) || undefined,
        lastAccess: user.lastaccess || undefined,
        roles,
        roleBucket: deriveCourseRoleBucket(roles),
      } satisfies MoodleCourseParticipant;
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));
}

export async function getCourseUserRoleAssignmentsFromProfile(
  token: string,
  courseId: number,
  userId: number
) {
  const profiles = await moodleRequest<RawMoodleCourseUserProfile[]>(
    token,
    "core_user_get_course_user_profiles",
    {
      "userlist[0][userid]": String(userId),
      "userlist[0][courseid]": String(courseId),
    }
  );

  const currentUser = (profiles || []).find((user) => user.id === userId);

  return (currentUser?.roles || []).map((role) => ({
    roleId: role.roleid,
    name: role.name?.trim() || role.shortname?.trim() || "Sin rol",
    shortName: role.shortname?.trim() || undefined,
    sortOrder: role.sortorder,
  })) satisfies MoodleCourseRoleAssignment[];
}

async function resolveCourseUserRoleAssignments(
  token: string,
  courseId: number,
  userId: number
) {
  const attempts = [
    () => getCourseUserRoleAssignments(token, courseId, userId),
    () => getCourseUserRoleAssignmentsFromProfile(token, courseId, userId),
  ];

  for (const attempt of attempts) {
    try {
      const roles = await attempt();

      if (roles.length > 0) {
        return roles;
      }
    } catch (error) {
      if (!isAccessException(error)) {
        throw error;
      }
    }
  }

  const serverToken = process.env.MOODLE_API_TOKEN?.trim();

  if (!serverToken || serverToken === token) {
    return [] as MoodleCourseRoleAssignment[];
  }

  for (const attempt of [
    () => getCourseUserRoleAssignments(serverToken, courseId, userId),
    () => getCourseUserRoleAssignmentsFromProfile(serverToken, courseId, userId),
  ]) {
    try {
      const roles = await attempt();

      if (roles.length > 0) {
        return roles;
      }
    } catch {
      continue;
    }
  }

  return [] as MoodleCourseRoleAssignment[];
}

async function getCourseRoleAssignmentsMap(
  token: string,
  courseIds: number[],
  userId: number
) {
  const entries = await Promise.all(
    [...new Set(courseIds.filter((courseId) => courseId > 0))].map(async (courseId) => {
      try {
        const roles = await resolveCourseUserRoleAssignments(
          token,
          courseId,
          userId
        );
        return [courseId, roles] as const;
      } catch {
        return [courseId, [] as MoodleCourseRoleAssignment[]] as const;
      }
    })
  );

  return new Map(entries);
}

export async function resolveUserAccessProfile(
  token: string,
  userId: number
): Promise<MoodleAccessProfile> {
  const [siteInfo, courses] = await Promise.all([
    getSiteInfo(token),
    getUserCourses(token, userId),
  ]);
  const courseIds = courses.map((course) => course.id);
  const optionCourseIds = siteInfo.siteId
    ? [...courseIds, siteInfo.siteId]
    : courseIds;
  const [administrationOptions, navigationOptions, courseRoleAssignments] =
    await Promise.all([
    getUserAdministrationOptions(token, optionCourseIds),
    getUserNavigationOptions(token, optionCourseIds),
    getCourseRoleAssignmentsMap(token, courseIds, userId),
  ]);

  const courseCapabilities = courses.map((course) =>
    deriveCourseAccessProfile(
      course,
      courseRoleAssignments.get(course.id) || [],
      administrationOptions.get(course.id) || {},
      navigationOptions.get(course.id) || {}
    )
  );
  const canTeachAnyCourse = courseCapabilities.some((course) => course.canTeach);
  const canEditAnyCourse = courseCapabilities.some((course) => course.canEdit);
  const canManageAnyCourse = courseCapabilities.some(
    (course) => course.canManageCourse
  );
  const siteAdministrationOptions = siteInfo.siteId
    ? administrationOptions.get(siteInfo.siteId) || {}
    : {};
  const canManagePlatform =
    !siteInfo.userIsSiteAdmin &&
    Boolean(
      siteAdministrationOptions.update ||
        siteAdministrationOptions.filters ||
        siteAdministrationOptions.reports ||
        siteAdministrationOptions.restore ||
        siteAdministrationOptions.backup ||
        siteAdministrationOptions.import ||
        siteAdministrationOptions.reset ||
        siteAdministrationOptions.roles
    );

  let primaryRole: MoodleAccessRole;

  if (siteInfo.userIsSiteAdmin) {
    primaryRole = "administrator";
  } else if (canManagePlatform) {
    primaryRole = "platform_manager";
  } else if (canManageAnyCourse) {
    primaryRole = "course_manager";
  } else if (canEditAnyCourse) {
    primaryRole = "editing_teacher";
  } else if (canTeachAnyCourse) {
    primaryRole = "teacher";
  } else if (courses.length === 0) {
    primaryRole = "authenticated_no_courses";
  } else {
    primaryRole = "student";
  }

  return {
    isAuthenticated: true,
    hasCourses: courses.length > 0,
    enrolledCourseCount: courses.length,
    primaryRole,
    isAdministrator: siteInfo.userIsSiteAdmin,
    canManagePlatform,
    canTeachAnyCourse,
    canEditAnyCourse,
    canManageAnyCourse,
    siteInfo,
    courseCapabilities,
  };
}

export async function getUserCourses(token: string, userId: number) {
  const courses = await moodleRequest<MoodleCourse[]>(
    token,
    "core_enrol_get_users_courses",
    {
      userid: String(userId),
    }
  );

  return courses.map((course) => ({
    id: course.id,
    fullname: course.fullname,
    shortname: course.shortname,
    summary: course.summary,
  }));
}

export async function searchCoursesWithServerToken(query: string) {
  return searchCourses(getServerMoodleToken(), query);
}

export async function getForumsByCourses(token: string, courseIds: number[]) {
  if (courseIds.length === 0) {
    return [] as MoodleForum[];
  }

  const params = courseIds.reduce<Record<string, string>>((acc, courseId, index) => {
    acc[`courseids[${index}]`] = String(courseId);
    return acc;
  }, {});

  const forums = await moodleRequest<RawMoodleForum[]>(
    token,
    "mod_forum_get_forums_by_courses",
    params
  );

  return forums.map((forum) => ({
    id: forum.id,
    courseId: forum.course,
    courseModuleId: forum.cmid,
    type: forum.type,
    name: forum.name,
    intro: forum.intro,
    canCreateDiscussions: Boolean(forum.cancreatediscussions),
  }));
}

export async function getUsersById(token: string, userIds: number[]) {
  const uniqueUserIds = [...new Set(userIds.filter((userId) => userId > 0))];

  if (uniqueUserIds.length === 0) {
    return new Map<number, { fullName?: string; pictureUrl?: string }>();
  }

  const params = uniqueUserIds.reduce<Record<string, string>>(
    (acc, userId, index) => {
      acc[`values[${index}]`] = String(userId);
      return acc;
    },
    { field: "id" }
  );

  const users = await moodleRequest<RawMoodleUserProfile[]>(
    token,
    "core_user_get_users_by_field",
    params
  );

  return new Map(
    users.map((user) => [
      user.id,
      {
        fullName: user.fullname,
        pictureUrl: pickUserPictureUrl(user),
      },
    ])
  );
}

async function getUrlsByCourses(token: string, courseIds: number[]) {
  if (courseIds.length === 0) {
    return new Map<number, string>();
  }

  const params = courseIds.reduce<Record<string, string>>((acc, courseId, index) => {
    acc[`courseids[${index}]`] = String(courseId);
    return acc;
  }, {});

  const response = await moodleRequest<{
    urls?: RawMoodleUrl[];
  }>(token, "mod_url_get_urls_by_courses", params);

  return new Map(
    (response.urls || [])
      .filter((item) => item.coursemodule > 0 && item.externalurl)
      .map((item) => [item.coursemodule, item.externalurl as string])
  );
}

export async function getForumAccessInformation(token: string, forumId: number) {
  const access = await moodleRequest<RawMoodleForumAccess>(
    token,
    "mod_forum_get_forum_access_information",
    {
      forumid: String(forumId),
    }
  );

  return {
    canStartDiscussion: Boolean(access.canstartdiscussion),
    canReplyPost: Boolean(access.canreplypost),
    canAddNews: Boolean(access.canaddnews),
    canReplyNews: Boolean(access.canreplynews),
  } satisfies MoodleForumAccess;
}

export async function canAddForumDiscussion(token: string, forumId: number) {
  const result = await moodleRequest<RawMoodleCanAddDiscussion>(
    token,
    "mod_forum_can_add_discussion",
    {
      forumid: String(forumId),
    }
  );

  return Boolean(result.status);
}

export async function getForumDiscussions(token: string, forumId: number) {
  const response = await moodleRequest<{
    discussions?: RawMoodleForumDiscussion[];
  }>(
    token,
    "mod_forum_get_forum_discussions",
    {
      forumid: String(forumId),
      sortorder: "1",
      page: "0",
      perpage: "0",
      groupid: "0",
    }
  );

  const discussions = response.discussions || [];
  const usersById = await getUsersById(
    token,
    discussions.flatMap((discussion) =>
      [discussion.userid, discussion.usermodified].filter(
        (value): value is number => typeof value === "number" && value > 0
      )
    )
  );

  return discussions.map((discussion) => ({
    id: discussion.discussion,
    title: discussion.name || discussion.subject || "Discusión",
    message: discussion.message,
    authorId: discussion.userid,
    authorName: discussion.userfullname,
    startedByName: discussion.userfullname,
    lastAuthorId: discussion.usermodified,
    lastAuthorName: discussion.usermodifiedfullname || discussion.userfullname,
    authorPictureUrl:
      discussion.userpictureurl ||
      (discussion.userid ? usersById.get(discussion.userid)?.pictureUrl : undefined),
    lastAuthorPictureUrl:
      discussion.usermodifiedpictureurl ||
      (discussion.usermodified
        ? usersById.get(discussion.usermodified)?.pictureUrl
        : undefined) ||
      discussion.userpictureurl ||
      (discussion.userid ? usersById.get(discussion.userid)?.pictureUrl : undefined),
    repliesCount: discussion.numreplies || 0,
    pinned: Boolean(discussion.pinned),
    locked: Boolean(discussion.locked),
    canReply: Boolean(discussion.canreply),
    createdAt: discussion.created || discussion.timecreated,
    startedAt: discussion.created || discussion.timecreated,
    modifiedAt: discussion.timemodified,
  }));
}

export async function getDiscussionPosts(token: string, discussionId: number) {
  const response = await moodleRequest<{
    posts?: RawMoodleForumDiscussionPost[];
  }>(
    token,
    "mod_forum_get_discussion_posts",
    {
      discussionid: String(discussionId),
      sortby: "created",
      sortdirection: "ASC",
      includeinlineattachments: "1",
    }
  );

  const posts = response.posts || [];
  const usersById = await getUsersById(
    token,
    posts
      .map((post) => post.author?.id)
      .filter((value): value is number => typeof value === "number" && value > 0)
  );

  return posts.map((post) => ({
    id: post.id,
    subject: post.subject,
    replySubject: post.replysubject,
    message: post.message,
    authorId: post.author?.id,
    authorName: post.author?.fullname,
    authorPictureUrl:
      post.author?.urls?.profileimage ||
      (post.author?.id ? usersById.get(post.author.id)?.pictureUrl : undefined),
    discussionId: post.discussionid,
    parentId: post.hasparent ? post.parentid : undefined,
    createdAt: post.timecreated,
    canReply: Boolean(post.capabilities?.reply),
  }));
}

export async function addForumDiscussion(
  token: string,
  forumId: number,
  subject: string,
  message: string
) {
  return moodleRequest<{ discussionid?: number }>(
    token,
    "mod_forum_add_discussion",
    {
      forumid: String(forumId),
      subject,
      message,
    }
  );
}

export async function addForumReply(
  token: string,
  postId: number,
  subject: string,
  message: string
) {
  return moodleRequest<{ postid?: number }>(
    token,
    "mod_forum_add_discussion_post",
    {
      postid: String(postId),
      subject,
      message,
      messageformat: "1",
    }
  );
}

export async function setForumDiscussionLockState(
  token: string,
  forumId: number,
  discussionId: number,
  targetState: "locked" | "unlocked"
) {
  const result = await moodleRequest<{
    status?: boolean;
    warnings?: Array<{ message?: string }>;
  }>(token, "mod_forum_set_lock_state", {
    forumid: String(forumId),
    discussionid: String(discussionId),
    targetstate: targetState,
  });

  const warningMessage = getFirstWarningMessage(result.warnings);

  if (warningMessage) {
    throw new MoodleApiError(warningMessage, "forum_lock_state_warning");
  }

  return result.status ?? true;
}

export async function setForumDiscussionPinState(
  token: string,
  discussionId: number,
  targetState: boolean
) {
  const result = await moodleRequest<{
    status?: boolean;
    warnings?: Array<{ message?: string }>;
  }>(token, "mod_forum_set_pin_state", {
    discussionid: String(discussionId),
    targetstate: targetState ? "1" : "0",
  });

  const warningMessage = getFirstWarningMessage(result.warnings);

  if (warningMessage) {
    throw new MoodleApiError(warningMessage, "forum_pin_state_warning");
  }

  return result.status ?? true;
}

export async function deleteForumPost(token: string, postId: number) {
  const result = await moodleRequest<{
    status?: boolean;
    warnings?: Array<{ message?: string }>;
  }>(token, "mod_forum_delete_post", {
    postid: String(postId),
  });

  const warningMessage = getFirstWarningMessage(result.warnings);

  if (warningMessage) {
    throw new MoodleApiError(warningMessage, "forum_delete_post_warning");
  }

  return result.status ?? true;
}

function withToken(url: string, token: string) {
  const parsedUrl = new URL(url);

  if (!parsedUrl.searchParams.has("token") && !parsedUrl.searchParams.has("wstoken")) {
    parsedUrl.searchParams.set("token", token);
  }

  return parsedUrl.toString();
}

function resolveModuleUrl(
  module: RawMoodleCourseModule,
  token: string
) {
  if (module.url) {
    return module.url;
  }

  const fileUrl = module.contents?.find((content) => content.fileurl)?.fileurl;

  if (!fileUrl) {
    return undefined;
  }

  return withToken(fileUrl, token);
}

function mapCompletionTracking(completion?: number) {
  if (completion === 1) {
    return "manual" as const;
  }

  if (completion === 2) {
    return "automatic" as const;
  }

  return "none" as const;
}

function mapCompletionState(state?: number) {
  if (state === 1) {
    return "complete" as const;
  }

  if (state === 2) {
    return "complete-pass" as const;
  }

  if (state === 3) {
    return "complete-fail" as const;
  }

  return "incomplete" as const;
}

export async function getCourseContents(token: string, courseId: number) {
  const [sections, urlsByCourseModule] = await Promise.all([
    moodleRequest<RawMoodleCourseSection[]>(token, "core_course_get_contents", {
      courseid: String(courseId),
    }),
    getUrlsByCourses(token, [courseId]).catch(() => new Map<number, string>()),
  ]);

  return sections
    .map((section, index) => ({
      id: section.id,
      name: section.name?.trim() || `Sección ${index + 1}`,
      summary: section.summary,
      modules: (section.modules || []).map((module) => ({
        id: module.id,
        name: module.name,
        modname: module.modname,
        instance: module.instance,
        url:
          (module.modname === "url" ? urlsByCourseModule.get(module.id) : undefined) ||
          resolveModuleUrl(module, token),
        description: module.description,
        userVisible: module.uservisible !== false,
        visibleOnCoursePage: module.visibleoncoursepage !== false,
        availabilityInfo: module.availabilityinfo,
        completionTracking: mapCompletionTracking(module.completion),
        completionState: mapCompletionState(module.completiondata?.state),
        completionTime: module.completiondata?.timecompleted || undefined,
        canManuallyToggleCompletion:
          mapCompletionTracking(module.completion) === "manual",
        dates: (module.dates || [])
          .filter(
            (date): date is Required<Pick<RawMoodleModuleDate, "label" | "timestamp">> &
              RawMoodleModuleDate =>
              typeof date.label === "string" && typeof date.timestamp === "number"
          )
          .map((date) => ({
            label: date.label,
            timestamp: date.timestamp,
            dataId: date.dataid,
          })),
        contents: (module.contents || []).map((content) => ({
          type: content.type,
          filename: content.filename,
          fileurl: content.fileurl,
          mimetype: content.mimetype,
        })),
      })),
    }))
    .filter((section) => section.modules.length > 0 || section.summary);
}

export async function updateActivityCompletionStatusManually(
  token: string,
  courseModuleId: number,
  completed: boolean
) {
  const result = await moodleRequest<RawMoodleManualCompletionResult>(
    token,
    "core_completion_update_activity_completion_status_manually",
    {
      cmid: String(courseModuleId),
      completed: completed ? "1" : "0",
    }
  );

  const warningMessage = result.warnings?.find((warning) => warning.message)?.message;

  if (warningMessage) {
    throw new MoodleApiError(warningMessage, "completion_warning");
  }

  return Boolean(result.status);
}

function assertSuccessfulViewResult(
  result: RawMoodleViewResult,
  fallbackCode: string
) {
  const warningMessage = result.warnings?.find((warning) => warning.message)?.message;

  if (warningMessage) {
    throw new MoodleApiError(warningMessage, fallbackCode);
  }

  if (result.status === false) {
    throw new MoodleApiError(
      "Moodle no pudo registrar la visualización de la actividad.",
      fallbackCode
    );
  }
}

export async function viewResource(token: string, resourceId: number) {
  const result = await moodleRequest<RawMoodleViewResult>(
    token,
    "mod_resource_view_resource",
    {
      resourceid: String(resourceId),
    }
  );

  assertSuccessfulViewResult(result, "resource_view_failed");
}

export async function viewScorm(token: string, scormId: number) {
  const result = await moodleRequest<RawMoodleViewResult>(
    token,
    "mod_scorm_view_scorm",
    {
      scormid: String(scormId),
    }
  );

  assertSuccessfulViewResult(result, "scorm_view_failed");
}

export async function getScormAccessInformation(token: string, scormId: number) {
  return moodleRequest<RawMoodleScormAccessInformation>(
    token,
    "mod_scorm_get_scorm_access_information",
    {
      scormid: String(scormId),
    }
  );
}

export async function getScormScoes(token: string, scormId: number) {
  return moodleRequest<RawMoodleScormScoesResponse>(
    token,
    "mod_scorm_get_scorm_scoes",
    {
      scormid: String(scormId),
    }
  );
}

export async function getScormsByCourses(token: string, courseIds: number[]) {
  const params = courseIds.reduce<Record<string, string>>((acc, courseId, index) => {
    acc[`courseids[${index}]`] = String(courseId);
    return acc;
  }, {});

  return moodleRequest<RawMoodleScormsByCoursesResponse>(
    token,
    "mod_scorm_get_scorms_by_courses",
    params
  );
}

export async function getScormAttemptCount(
  token: string,
  scormId: number,
  userId: number,
  ignoreMissingCompletion = false
) {
  return moodleRequest<RawMoodleScormAttemptCountResponse>(
    token,
    "mod_scorm_get_scorm_attempt_count",
    {
      scormid: String(scormId),
      userid: String(userId),
      ignoremissingcompletion: ignoreMissingCompletion ? "1" : "0",
    }
  );
}

export async function getScormUserData(
  token: string,
  scormId: number,
  attempt: number
) {
  return moodleRequest<RawMoodleScormUserDataResponse>(
    token,
    "mod_scorm_get_scorm_user_data",
    {
      scormid: String(scormId),
      attempt: String(attempt),
    }
  );
}

export async function getScormScoTracks(
  token: string,
  scoId: number,
  userId: number,
  attempt: number
) {
  return moodleRequest<RawMoodleScormScoTracksResponse>(
    token,
    "mod_scorm_get_scorm_sco_tracks",
    {
      scoid: String(scoId),
      userid: String(userId),
      attempt: String(attempt),
    }
  );
}

export async function launchScormSco(
  token: string,
  scormId: number,
  scoId = 0
) {
  return moodleRequest<RawMoodleScormLaunchScoResponse>(
    token,
    "mod_scorm_launch_sco",
    {
      scormid: String(scormId),
      scoid: String(scoId),
    }
  );
}

export async function insertScormTracks(
  token: string,
  scoId: number,
  attempt: number,
  tracks: Array<{ element: string; value: string }>
) {
  const params = tracks.reduce<Record<string, string>>(
    (acc, track, index) => {
      acc[`tracks[${index}][element]`] = track.element;
      acc[`tracks[${index}][value]`] = track.value;
      return acc;
    },
    {
      scoid: String(scoId),
      attempt: String(attempt),
    }
  );

  return moodleRequest<RawMoodleInsertScormTracksResponse>(
    token,
    "mod_scorm_insert_scorm_tracks",
    params
  );
}

export async function viewUrl(token: string, urlId: number) {
  const result = await moodleRequest<RawMoodleViewResult>(
    token,
    "mod_url_view_url",
    {
      urlid: String(urlId),
    }
  );

  assertSuccessfulViewResult(result, "url_view_failed");
}

export async function viewForum(token: string, forumId: number) {
  const result = await moodleRequest<RawMoodleViewResult>(
    token,
    "mod_forum_view_forum",
    {
      forumid: String(forumId),
    }
  );

  assertSuccessfulViewResult(result, "forum_view_failed");
}

export async function viewForumDiscussion(token: string, discussionId: number) {
  const result = await moodleRequest<RawMoodleViewResult>(
    token,
    "mod_forum_view_forum_discussion",
    {
      discussionid: String(discussionId),
    }
  );

  assertSuccessfulViewResult(result, "forum_discussion_view_failed");
}

// ---------------------------------------------------------------------------
// Activity completion status
// ---------------------------------------------------------------------------

type RawMoodleActivityStatus = {
  cmid: number;
  modname: string;
  instance: number;
  state: number;
  timecompleted: number;
  tracking: number;
  overrideby: number | null;
  valueused: boolean;
};

export type MoodleActivityCompletionStatus = {
  courseModuleId: number;
  modname: string;
  instance: number;
  completionState: "incomplete" | "complete" | "complete-pass" | "complete-fail";
  completionTime?: number;
  tracking: "none" | "manual" | "automatic";
};

export async function getActivitiesCompletionStatus(
  token: string,
  courseId: number,
  userId: number
): Promise<MoodleActivityCompletionStatus[]> {
  const result = await moodleRequest<{
    statuses?: RawMoodleActivityStatus[];
  }>(token, "core_completion_get_activities_completion_status", {
    courseid: String(courseId),
    userid: String(userId),
  });

  return (result.statuses || []).map((s) => ({
    courseModuleId: s.cmid,
    modname: s.modname,
    instance: s.instance,
    completionState: mapCompletionState(s.state),
    completionTime: s.timecompleted || undefined,
    tracking: mapCompletionTracking(s.tracking),
  }));
}

export function computeCourseProgress(
  statuses: MoodleActivityCompletionStatus[]
) {
  const tracked = statuses.filter((s) => s.tracking !== "none");
  const completed = tracked.filter(
    (s) =>
      s.completionState === "complete" ||
      s.completionState === "complete-pass"
  );

  return {
    completed: completed.length,
    total: tracked.length,
    percentage: tracked.length > 0
      ? Math.round((completed.length / tracked.length) * 100)
      : 0,
  };
}

// ---------------------------------------------------------------------------
// Grades
// ---------------------------------------------------------------------------

type RawMoodleGradeItem = {
  id: number;
  itemname?: string;
  itemtype?: string;
  itemmodule?: string;
  iteminstance?: number;
  categoryid?: number;
  graderaw?: number | null;
  gradeformatted?: string;
  grademin?: number;
  grademax?: number;
  feedback?: string;
  percentageformatted?: string;
  weightformatted?: string;
  rank?: number;
};

export type MoodleGradeItem = {
  id: number;
  name: string;
  type: string;
  module?: string;
  gradeRaw?: number;
  gradeFormatted?: string;
  gradeMin: number;
  gradeMax: number;
  feedback?: string;
  percentageFormatted?: string;
  weightFormatted?: string;
};

type RawMoodleCourseGrade = {
  courseid: number;
  grade?: string;
  rawgrade?: string;
  rank?: number;
};

export type MoodleCourseGrade = {
  courseId: number;
  grade?: string;
  rawGrade?: string;
};

export async function getGradeItems(
  token: string,
  courseId: number,
  userId: number
): Promise<MoodleGradeItem[]> {
  const result = await moodleRequest<{
    usergrades?: Array<{
      gradeitems?: RawMoodleGradeItem[];
    }>;
  }>(token, "gradereport_user_get_grade_items", {
    courseid: String(courseId),
    userid: String(userId),
  });

  const items = result.usergrades?.[0]?.gradeitems || [];

  return items.map((item) => ({
    id: item.id,
    name: item.itemname || "(Sin nombre)",
    type: item.itemtype || "unknown",
    module: item.itemmodule || undefined,
    gradeRaw:
      item.graderaw !== null && item.graderaw !== undefined
        ? item.graderaw
        : undefined,
    gradeFormatted: item.gradeformatted || undefined,
    gradeMin: item.grademin ?? 0,
    gradeMax: item.grademax ?? 100,
    feedback: item.feedback || undefined,
    percentageFormatted: item.percentageformatted || undefined,
    weightFormatted: item.weightformatted || undefined,
  }));
}

export async function getCourseGrades(
  token: string,
  userId: number
): Promise<MoodleCourseGrade[]> {
  const result = await moodleRequest<{
    grades?: RawMoodleCourseGrade[];
  }>(token, "gradereport_overview_get_course_grades", {
    userid: String(userId),
  });

  return (result.grades || []).map((g) => ({
    courseId: g.courseid,
    grade: g.grade || undefined,
    rawGrade: g.rawgrade || undefined,
  }));
}

// ---------------------------------------------------------------------------
// Calendar / Events
// ---------------------------------------------------------------------------

type RawMoodleCalendarEvent = {
  id: number;
  name: string;
  description?: string;
  format?: number;
  modulename?: string;
  instance?: number;
  eventtype?: string;
  courseid?: number;
  timestart?: number;
  timeduration?: number;
  url?: string;
  course?: { id: number; fullname?: string };
};

export type MoodleCalendarEvent = {
  id: number;
  name: string;
  description?: string;
  moduleName?: string;
  eventType: string;
  courseId?: number;
  courseName?: string;
  timeStart?: number;
  duration?: number;
  url?: string;
};

function mapCalendarEvent(e: RawMoodleCalendarEvent): MoodleCalendarEvent {
  return {
    id: e.id,
    name: e.name,
    description: e.description || undefined,
    moduleName: e.modulename || undefined,
    eventType: e.eventtype || "unknown",
    courseId: e.courseid || e.course?.id || undefined,
    courseName: e.course?.fullname || undefined,
    timeStart: e.timestart || undefined,
    duration: e.timeduration || undefined,
    url: e.url || undefined,
  };
}

export async function getUpcomingEvents(
  token: string
): Promise<MoodleCalendarEvent[]> {
  const result = await moodleRequest<{
    events?: RawMoodleCalendarEvent[];
  }>(token, "core_calendar_get_calendar_upcoming_view", {});

  return (result.events || []).map(mapCalendarEvent);
}

export type MoodleCalendarDay = {
  day: number;
  timestamp: number;
  events: MoodleCalendarEvent[];
};

export type MoodleCalendarWeek = {
  days: MoodleCalendarDay[];
};

export async function getMonthlyView(
  token: string,
  year: number,
  month: number
): Promise<{ weeks: MoodleCalendarWeek[] }> {
  const result = await moodleRequest<{
    weeks?: Array<{
      days?: Array<{
        mday?: number;
        events?: RawMoodleCalendarEvent[];
        timestamp?: number;
      }>;
    }>;
  }>(token, "core_calendar_get_calendar_monthly_view", {
    year: String(year),
    month: String(month),
  });

  const weeks = (result.weeks || []).map((week) => ({
    days: (week.days || []).map((day) => ({
      day: day.mday ?? 0,
      timestamp: day.timestamp ?? 0,
      events: (day.events || []).map(mapCalendarEvent),
    })),
  }));

  return { weeks };
}

// ---------------------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------------------

type RawMoodleAssignment = {
  id: number;
  cmid: number;
  course: number;
  name: string;
  intro?: string;
  introformat?: number;
  duedate?: number;
  cutoffdate?: number;
  allowsubmissionsfromdate?: number;
  grade?: number;
  nosubmissions?: number;
  submissiondrafts?: number;
};

type RawMoodleAssignmentSubmissionFile = {
  filepath?: string;
  fileurl?: string;
};

type RawMoodleAssignmentSubmissionFileArea = {
  area?: string;
  files?: RawMoodleAssignmentSubmissionFile[];
};

type RawMoodleAssignmentSubmissionEditorField = {
  name?: string;
  description?: string;
  text?: string;
  format?: number;
};

type RawMoodleAssignmentSubmissionPlugin = {
  type?: string;
  name?: string;
  fileareas?: RawMoodleAssignmentSubmissionFileArea[];
  editorfields?: RawMoodleAssignmentSubmissionEditorField[];
};

type RawMoodleAssignmentSubmission = {
  id: number;
  userid: number;
  attemptnumber?: number;
  timecreated?: number;
  timemodified?: number;
  status?: string;
  groupid?: number;
  plugins?: RawMoodleAssignmentSubmissionPlugin[];
};

type RawMoodleAssignmentGrade = {
  id: number;
  userid: number;
  grader?: number;
  grade?: string;
  attemptnumber?: number;
  timecreated?: number;
  timemodified?: number;
};

export type MoodleAssignment = {
  id: number;
  courseModuleId: number;
  courseId: number;
  name: string;
  intro?: string;
  dueDate?: number;
  cutoffDate?: number;
  submissionsOpenDate?: number;
  maxGrade?: number;
  requiresSubmission: boolean;
};

type RawMoodleSubmissionStatus = {
  lastattempt?: {
    submission?: {
      id?: number;
      status?: string;
      timecreated?: number;
      timemodified?: number;
      attemptnumber?: number;
    };
    graded?: boolean;
    gradingstatus?: string;
  };
  feedback?: {
    grade?: { grade?: string };
    gradefordisplay?: string;
  };
};

export type MoodleSubmissionStatus = {
  submissionState: "none" | "draft" | "submitted";
  timeCreated?: number;
  timeModified?: number;
  attemptNumber: number;
  isGraded: boolean;
  gradingStatus?: string;
  gradeDisplay?: string;
};

export type MoodleAssignmentSubmissionRecord = {
  id: number;
  userId: number;
  userFullName?: string;
  userPictureUrl?: string;
  status: "draft" | "submitted" | "new";
  attemptNumber: number;
  timeCreated?: number;
  timeModified?: number;
  groupId?: number;
  onlineText?: string;
  fileCount: number;
};

export type MoodleAssignmentGradeRecord = {
  id: number;
  userId: number;
  graderId?: number;
  graderFullName?: string;
  attemptNumber: number;
  grade?: string;
  timeCreated?: number;
  timeModified?: number;
};

type RawMoodleAssignmentGradeSaveResponse = {
  status?: boolean;
  warnings?: Array<{
    item?: string;
    itemid?: number;
    warningcode?: string;
    message?: string;
  }>;
};

export async function getAssignments(
  token: string,
  courseIds: number[]
): Promise<Array<{ courseId: number; assignments: MoodleAssignment[] }>> {
  const params: Record<string, string> = {};
  courseIds.forEach((id, i) => {
    params[`courseids[${i}]`] = String(id);
  });

  const result = await moodleRequest<{
    courses?: Array<{
      id: number;
      assignments?: RawMoodleAssignment[];
    }>;
  }>(token, "mod_assign_get_assignments", params);

  return (result.courses || []).map((c) => ({
    courseId: c.id,
    assignments: (c.assignments || []).map((a) => ({
      id: a.id,
      courseModuleId: a.cmid,
      courseId: a.course,
      name: a.name,
      intro: a.intro || undefined,
      dueDate: a.duedate || undefined,
      cutoffDate: a.cutoffdate || undefined,
      submissionsOpenDate: a.allowsubmissionsfromdate || undefined,
      maxGrade: a.grade !== undefined ? a.grade : undefined,
      requiresSubmission: a.nosubmissions !== 1,
    })),
  }));
}

export async function getSubmissionStatus(
  token: string,
  assignId: number
): Promise<MoodleSubmissionStatus> {
  const result = await moodleRequest<RawMoodleSubmissionStatus>(
    token,
    "mod_assign_get_submission_status",
    { assignid: String(assignId) }
  );

  const submission = result.lastattempt?.submission;
  const rawStatus = submission?.status;

  let submissionState: MoodleSubmissionStatus["submissionState"] = "none";
  if (rawStatus === "submitted") {
    submissionState = "submitted";
  } else if (rawStatus === "draft") {
    submissionState = "draft";
  }

  return {
    submissionState,
    timeCreated: submission?.timecreated || undefined,
    timeModified: submission?.timemodified || undefined,
    attemptNumber: submission?.attemptnumber ?? 0,
    isGraded: result.lastattempt?.graded ?? false,
    gradingStatus: result.lastattempt?.gradingstatus || undefined,
    gradeDisplay: result.feedback?.gradefordisplay || undefined,
  };
}

export async function getAssignmentSubmissions(
  token: string,
  assignId: number
): Promise<MoodleAssignmentSubmissionRecord[]> {
  const result = await moodleRequest<{
    assignments?: Array<{
      assignmentid?: number;
      submissions?: RawMoodleAssignmentSubmission[];
    }>;
  }>(token, "mod_assign_get_submissions", {
    "assignmentids[0]": String(assignId),
  });

  const submissions =
    (result.assignments || []).find(
      (assignment) => assignment.assignmentid === assignId
    )?.submissions || [];

  const usersById = await getUsersById(
    token,
    submissions.map((submission) => submission.userid)
  ).catch(() => new Map<number, { fullName?: string; pictureUrl?: string }>());

  return submissions
    .map((submission) => {
      const user = usersById.get(submission.userid);
      const fileCount = (submission.plugins || []).reduce((total, plugin) => {
        return (
          total +
          (plugin.fileareas || []).reduce((pluginTotal, area) => {
            return pluginTotal + (area.files || []).length;
          }, 0)
        );
      }, 0);

      const onlineText = (submission.plugins || [])
        .flatMap((plugin) => plugin.editorfields || [])
        .map((field) => field.text?.trim() || "")
        .find(Boolean);

      let status: MoodleAssignmentSubmissionRecord["status"] = "new";
      if (submission.status === "submitted") {
        status = "submitted";
      } else if (submission.status === "draft") {
        status = "draft";
      }

      return {
        id: submission.id,
        userId: submission.userid,
        userFullName: user?.fullName,
        userPictureUrl: user?.pictureUrl,
        status,
        attemptNumber: submission.attemptnumber ?? 0,
        timeCreated: submission.timecreated || undefined,
        timeModified: submission.timemodified || undefined,
        groupId: submission.groupid || undefined,
        onlineText: onlineText || undefined,
        fileCount,
      } satisfies MoodleAssignmentSubmissionRecord;
    })
    .sort((a, b) => (b.timeModified || 0) - (a.timeModified || 0));
}

export async function getAssignmentGrades(
  token: string,
  assignId: number
): Promise<MoodleAssignmentGradeRecord[]> {
  const result = await moodleRequest<{
    assignments?: Array<{
      assignmentid?: number;
      grades?: RawMoodleAssignmentGrade[];
    }>;
    warnings?: Array<{
      item?: string;
      itemid?: number;
      warningcode?: string;
      message?: string;
    }>;
  }>(token, "mod_assign_get_grades", {
    "assignmentids[0]": String(assignId),
    since: "0",
  });

  const grades =
    (result.assignments || []).find(
      (assignment) => assignment.assignmentid === assignId
    )?.grades || [];

  const gradersById = await getUsersById(
    token,
    grades.map((grade) => grade.grader ?? 0)
  ).catch(() => new Map<number, { fullName?: string; pictureUrl?: string }>());

  return grades
    .map((grade) => {
      const grader = grade.grader ? gradersById.get(grade.grader) : undefined;

      return {
        id: grade.id,
        userId: grade.userid,
        graderId: grade.grader || undefined,
        graderFullName: grader?.fullName,
        attemptNumber: grade.attemptnumber ?? 0,
        grade: grade.grade?.trim() || undefined,
        timeCreated: grade.timecreated || undefined,
        timeModified: grade.timemodified || undefined,
      } satisfies MoodleAssignmentGradeRecord;
    })
    .sort((a, b) => (b.timeModified || 0) - (a.timeModified || 0));
}

export async function saveAssignmentGrade(
  token: string,
  params: {
    assignId: number;
    userId: number;
    grade: string;
    feedbackHtml?: string;
    attemptNumber?: number;
  }
) {
  const requestParams: Record<string, string> = {
    assignmentid: String(params.assignId),
    applytoall: "0",
    "grades[0][userid]": String(params.userId),
    "grades[0][grade]": params.grade,
    "grades[0][attemptnumber]": String(params.attemptNumber ?? -1),
    "grades[0][addattempt]": "0",
    "grades[0][workflowstate]": "",
    "grades[0][plugindata][files_filemanager]": "0",
  };

  if (params.feedbackHtml) {
    requestParams["grades[0][plugindata][assignfeedbackcomments_editor][text]"] =
      params.feedbackHtml;
    requestParams[
      "grades[0][plugindata][assignfeedbackcomments_editor][format]"
    ] = "1";
  }

  const result = await moodleRequest<RawMoodleAssignmentGradeSaveResponse>(
    token,
    "mod_assign_save_grades",
    requestParams
  );

  const warningMessage = getFirstWarningMessage(result.warnings);

  if (warningMessage) {
    throw new MoodleApiError(warningMessage, "assignment_grade_save_warning");
  }

  return result.status ?? true;
}

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

type RawMoodleConversationMember = {
  id: number;
  fullname?: string;
  profileimageurl?: string;
  profileimageurlsmall?: string;
};

type RawMoodleConversationMessage = {
  id: number;
  text?: string;
  useridfrom?: number;
  timecreated?: number;
};

type RawMoodleConversation = {
  id: number;
  name?: string;
  type?: number;
  membercount?: number;
  isread?: boolean;
  unreadcount?: number;
  members?: RawMoodleConversationMember[];
  messages?: RawMoodleConversationMessage[];
};

export type MoodleConversationMember = {
  id: number;
  fullName: string;
  pictureUrl?: string;
};

export type MoodleConversationMessage = {
  id: number;
  text: string;
  authorId: number;
  createdAt: number;
};

export type MoodleConversation = {
  id: number;
  name?: string;
  type: "individual" | "group" | "self";
  memberCount: number;
  isRead: boolean;
  unreadCount: number;
  members: MoodleConversationMember[];
  lastMessage?: MoodleConversationMessage;
};

function mapConversationType(type?: number) {
  switch (type) {
    case 1:
      return "individual" as const;
    case 2:
      return "group" as const;
    case 3:
      return "self" as const;
    default:
      return "individual" as const;
  }
}

export async function getConversations(
  token: string,
  userId: number
): Promise<MoodleConversation[]> {
  const result = await moodleRequest<{
    conversations?: RawMoodleConversation[];
  }>(token, "core_message_get_conversations", {
    userid: String(userId),
  });

  return (result.conversations || []).map((c) => {
    const lastRaw = c.messages?.[0];

    return {
      id: c.id,
      name: c.name || undefined,
      type: mapConversationType(c.type),
      memberCount: c.membercount ?? 0,
      isRead: c.isread ?? true,
      unreadCount: c.unreadcount ?? 0,
      members: (c.members || []).map((m) => ({
        id: m.id,
        fullName: m.fullname || "Usuario",
        pictureUrl:
          m.profileimageurl || m.profileimageurlsmall || undefined,
      })),
      lastMessage: lastRaw
        ? {
            id: lastRaw.id,
            text: lastRaw.text || "",
            authorId: lastRaw.useridfrom ?? 0,
            createdAt: lastRaw.timecreated ?? 0,
          }
        : undefined,
    };
  });
}

export async function getConversationMessages(
  token: string,
  conversationId: number,
  userId: number
): Promise<{
  members: Map<number, MoodleConversationMember>;
  messages: MoodleConversationMessage[];
}> {
  const result = await moodleRequest<{
    members?: RawMoodleConversationMember[];
    messages?: RawMoodleConversationMessage[];
  }>(token, "core_message_get_conversation_messages", {
    currentuserid: String(userId),
    convid: String(conversationId),
    newest: "0",
    limitnum: "100",
  });

  const members = new Map<number, MoodleConversationMember>();
  for (const m of result.members || []) {
    members.set(m.id, {
      id: m.id,
      fullName: m.fullname || "Usuario",
      pictureUrl:
        m.profileimageurl || m.profileimageurlsmall || undefined,
    });
  }

  const messages = (result.messages || []).map((msg) => ({
    id: msg.id,
    text: msg.text || "",
    authorId: msg.useridfrom ?? 0,
    createdAt: msg.timecreated ?? 0,
  }));

  return { members, messages };
}

export async function getUnreadConversationsCount(
  token: string,
  userId: number
): Promise<number> {
  const result = await moodleRequest<Record<string, unknown>>(
    token,
    "core_message_get_unread_conversations_count",
    { useridto: String(userId) }
  );

  // The response is a plain number in some Moodle versions, or an object
  if (typeof result === "number") {
    return result;
  }

  // Fallback: check common response shapes
  const count =
    (result as { conversations?: number }).conversations ??
    (result as { count?: number }).count;

  return typeof count === "number" ? count : 0;
}

export async function sendMessage(
  token: string,
  toUserId: number,
  text: string
): Promise<{ messageId?: number; error?: string }> {
  const result = await moodleRequest<
    Array<{
      msgid?: number;
      clientmsgid?: string;
      errormessage?: string;
    }>
  >(token, "core_message_send_instant_messages", {
    "messages[0][touserid]": String(toUserId),
    "messages[0][text]": text,
  });

  const first = result[0];

  if (first?.errormessage) {
    return { error: first.errormessage };
  }

  return { messageId: first?.msgid };
}

// ---------------------------------------------------------------------------
// Quizzes
// ---------------------------------------------------------------------------

type RawMoodleQuiz = {
  id: number;
  course: number;
  coursemodule: number;
  name: string;
  intro?: string;
  introformat?: number;
  timeopen?: number;
  timeclose?: number;
  timelimit?: number;
  grade?: number;
  sumgrades?: number;
  attempts?: number;
  grademethod?: number;
};

export type MoodleQuiz = {
  id: number;
  courseId: number;
  courseModuleId: number;
  name: string;
  intro?: string;
  openTime?: number;
  closeTime?: number;
  timeLimit?: number;
  maxGrade?: number;
  maxAttempts: number;
};

type RawMoodleQuizAttempt = {
  id: number;
  quiz: number;
  userid: number;
  attempt: number;
  state?: string;
  currentpage?: number;
  timestart?: number;
  timefinish?: number;
  timemodified?: number;
  sumgrades?: number;
};

type RawMoodleQuizAccessInformation = {
  canattempt?: boolean;
  canmanage?: boolean;
  canpreview?: boolean;
  canreviewmyattempts?: boolean;
  canviewreports?: boolean;
  endtime?: number;
  isfinished?: boolean;
  ispreflightcheckrequired?: boolean;
  accessrules?: string[];
  activerulenames?: string[];
  preventaccessreasons?: string[];
  preventnewattemptreasons?: string[];
  questiontypes?: string[];
  plainhtmlqtypes?: string[];
  warnings?: Array<{
    item?: string;
    itemid?: number;
    warningcode?: string;
    message?: string;
  }>;
};

type RawMoodleQuizRenderedQuestion = {
  slot?: number;
  type?: string;
  page?: number;
  html?: string;
  number?: string | number;
  state?: string;
  status?: string;
  flagged?: boolean;
  mark?: string;
  sequencecheck?: number;
};

type RawMoodleQuizAttemptDataResponse = {
  attempt?: RawMoodleQuizAttempt;
  messages?: string[];
  nextpage?: number;
  questions?: RawMoodleQuizRenderedQuestion[];
  warnings?: Array<{
    item?: string;
    itemid?: number;
    warningcode?: string;
    message?: string;
  }>;
};

type RawMoodleQuizAttemptReviewResponse = {
  attempt?: RawMoodleQuizAttempt;
  questions?: RawMoodleQuizRenderedQuestion[];
  additionaldata?: Array<{
    id?: string;
    title?: string;
    content?: string;
  }>;
  warnings?: Array<{
    item?: string;
    itemid?: number;
    warningcode?: string;
    message?: string;
  }>;
};

type RawMoodleQuizStartAttemptResponse = {
  attempt?: RawMoodleQuizAttempt;
  warnings?: Array<{
    item?: string;
    itemid?: number;
    warningcode?: string;
    message?: string;
  }>;
};

type RawMoodleQuizSaveAttemptResponse = {
  status?: boolean;
  warnings?: Array<{
    item?: string;
    itemid?: number;
    warningcode?: string;
    message?: string;
  }>;
};

type RawMoodleQuizProcessAttemptResponse = {
  state?: string;
  warnings?: Array<{
    item?: string;
    itemid?: number;
    warningcode?: string;
    message?: string;
  }>;
};

export type MoodleQuizAccessInformation = {
  canAttempt: boolean;
  canManage: boolean;
  canPreview: boolean;
  canReviewMyAttempts: boolean;
  canViewReports: boolean;
  endTime?: number;
  isFinished: boolean;
  isPreflightCheckRequired: boolean;
  accessRules: string[];
  activeRuleNames: string[];
  preventAccessReasons: string[];
  preventNewAttemptReasons: string[];
  questionTypes: string[];
  plainHtmlQuestionTypes: string[];
};

export type MoodleQuizRenderedQuestion = {
  slot: number;
  type?: string;
  page?: number;
  html?: string;
  number?: string;
  state?: string;
  status?: string;
  flagged: boolean;
  mark?: string;
  sequenceCheck?: number;
};

export type MoodleQuizAttemptData = {
  attempt: MoodleQuizAttempt;
  messages: string[];
  nextPage: number;
  questions: MoodleQuizRenderedQuestion[];
};

export type MoodleQuizAttemptReview = {
  attempt: MoodleQuizAttempt;
  questions: MoodleQuizRenderedQuestion[];
  additionalData: Array<{
    id: string;
    title: string;
    content: string;
  }>;
};

export type MoodleQuizAttempt = {
  id: number;
  quizId: number;
  attemptNumber: number;
  state:
    | "notstarted"
    | "inprogress"
    | "overdue"
    | "submitted"
    | "finished"
    | "abandoned";
  currentPage?: number;
  timeStart?: number;
  timeFinish?: number;
  grade?: number;
};

function mapQuizAttemptState(state?: string) {
  switch (state?.toLowerCase()) {
    case "notstarted":
      return "notstarted" as const;
    case "submitted":
      return "submitted" as const;
    case "finished":
      return "finished" as const;
    case "overdue":
      return "overdue" as const;
    case "abandoned":
      return "abandoned" as const;
    default:
      return "inprogress" as const;
  }
}

function mapQuizAttempt(raw: RawMoodleQuizAttempt): MoodleQuizAttempt {
  return {
    id: raw.id,
    quizId: raw.quiz,
    attemptNumber: raw.attempt,
    state: mapQuizAttemptState(raw.state),
    currentPage:
      typeof raw.currentpage === "number" ? raw.currentpage : undefined,
    timeStart: raw.timestart || undefined,
    timeFinish: raw.timefinish || undefined,
    grade: raw.sumgrades ?? undefined,
  };
}

function appendNameValueParams(
  params: Record<string, string>,
  key: string,
  data: Array<{ name: string; value: string }>
) {
  data.forEach((entry, index) => {
    params[`${key}[${index}][name]`] = entry.name;
    params[`${key}[${index}][value]`] = entry.value;
  });
}

function getFirstWarningMessage(
  warnings?: Array<{ message?: string }>
) {
  return warnings?.find((warning) => warning.message)?.message;
}

export async function getQuizzesByCourses(
  token: string,
  courseIds: number[]
): Promise<MoodleQuiz[]> {
  const params: Record<string, string> = {};
  courseIds.forEach((id, i) => {
    params[`courseids[${i}]`] = String(id);
  });

  const result = await moodleRequest<{
    quizzes?: RawMoodleQuiz[];
  }>(token, "mod_quiz_get_quizzes_by_courses", params);

  return (result.quizzes || []).map((q) => ({
    id: q.id,
    courseId: q.course,
    courseModuleId: q.coursemodule,
    name: q.name,
    intro: q.intro || undefined,
    openTime: q.timeopen || undefined,
    closeTime: q.timeclose || undefined,
    timeLimit: q.timelimit || undefined,
    maxGrade: q.grade ?? undefined,
    maxAttempts: q.attempts ?? 0,
  }));
}

export async function getQuizUserAttempts(
  token: string,
  quizId: number,
  userId: number
): Promise<MoodleQuizAttempt[]> {
  const result = await moodleRequest<{
    attempts?: RawMoodleQuizAttempt[];
  }>(token, "mod_quiz_get_user_quiz_attempts", {
    quizid: String(quizId),
    userid: String(userId),
    status: "all",
    includepreviews: "0",
  });

  return (result.attempts || []).map(mapQuizAttempt);
}

export async function viewQuiz(token: string, quizId: number) {
  const result = await moodleRequest<RawMoodleViewResult>(
    token,
    "mod_quiz_view_quiz",
    {
      quizid: String(quizId),
    }
  );

  assertSuccessfulViewResult(result, "quiz_view_failed");
}

export async function getQuizAccessInformation(
  token: string,
  quizId: number
): Promise<MoodleQuizAccessInformation> {
  const result = await moodleRequest<RawMoodleQuizAccessInformation>(
    token,
    "mod_quiz_get_quiz_access_information",
    {
      quizid: String(quizId),
    }
  );

  const warningMessage = getFirstWarningMessage(result.warnings);

  if (warningMessage) {
    throw new MoodleApiError(warningMessage, "quiz_access_warning");
  }

  return {
    canAttempt: result.canattempt ?? false,
    canManage: result.canmanage ?? false,
    canPreview: result.canpreview ?? false,
    canReviewMyAttempts: result.canreviewmyattempts ?? false,
    canViewReports: result.canviewreports ?? false,
    endTime: result.endtime || undefined,
    isFinished: result.isfinished ?? false,
    isPreflightCheckRequired: result.ispreflightcheckrequired ?? false,
    accessRules: result.accessrules || [],
    activeRuleNames: result.activerulenames || [],
    preventAccessReasons: result.preventaccessreasons || [],
    preventNewAttemptReasons: result.preventnewattemptreasons || [],
    questionTypes: result.questiontypes || [],
    plainHtmlQuestionTypes: result.plainhtmlqtypes || [],
  };
}

export async function startQuizAttempt(
  token: string,
  quizId: number,
  preflightData: Array<{ name: string; value: string }> = [],
  forceNew = false
): Promise<MoodleQuizAttempt> {
  const params: Record<string, string> = {
    quizid: String(quizId),
    forcenew: forceNew ? "1" : "0",
  };
  appendNameValueParams(params, "preflightdata", preflightData);

  const result = await moodleRequest<RawMoodleQuizStartAttemptResponse>(
    token,
    "mod_quiz_start_attempt",
    params
  );

  const warningMessage = getFirstWarningMessage(result.warnings);

  if (warningMessage) {
    throw new MoodleApiError(warningMessage, "quiz_start_warning");
  }

  if (!result.attempt) {
    throw new MoodleApiError(
      "Moodle no devolvio el intento iniciado.",
      "quiz_start_missing_attempt"
    );
  }

  return mapQuizAttempt(result.attempt);
}

function mapQuizRenderedQuestion(
  question: RawMoodleQuizRenderedQuestion
): MoodleQuizRenderedQuestion {
  return {
    slot: question.slot ?? 0,
    type: question.type || undefined,
    page: typeof question.page === "number" ? question.page : undefined,
    html: question.html || undefined,
    number:
      question.number !== undefined && question.number !== null
        ? String(question.number)
        : undefined,
    state: question.state || undefined,
    status: question.status || undefined,
    flagged: question.flagged ?? false,
    mark: question.mark || undefined,
    sequenceCheck:
      typeof question.sequencecheck === "number"
        ? question.sequencecheck
        : undefined,
  };
}

export async function viewQuizAttempt(
  token: string,
  attemptId: number,
  page: number,
  preflightData: Array<{ name: string; value: string }> = []
) {
  const params: Record<string, string> = {
    attemptid: String(attemptId),
    page: String(page),
  };
  appendNameValueParams(params, "preflightdata", preflightData);

  const result = await moodleRequest<RawMoodleViewResult>(
    token,
    "mod_quiz_view_attempt",
    params
  );

  assertSuccessfulViewResult(result, "quiz_attempt_view_failed");
}

export async function getQuizAttemptData(
  token: string,
  attemptId: number,
  page: number,
  preflightData: Array<{ name: string; value: string }> = []
): Promise<MoodleQuizAttemptData> {
  const params: Record<string, string> = {
    attemptid: String(attemptId),
    page: String(page),
  };
  appendNameValueParams(params, "preflightdata", preflightData);

  const result = await moodleRequest<RawMoodleQuizAttemptDataResponse>(
    token,
    "mod_quiz_get_attempt_data",
    params
  );

  const warningMessage = getFirstWarningMessage(result.warnings);

  if (warningMessage) {
    throw new MoodleApiError(warningMessage, "quiz_attempt_warning");
  }

  if (!result.attempt) {
    throw new MoodleApiError(
      "Moodle no devolvio datos del intento.",
      "quiz_attempt_missing_data"
    );
  }

  return {
    attempt: mapQuizAttempt(result.attempt),
    messages: result.messages || [],
    nextPage: result.nextpage ?? -1,
    questions: (result.questions || []).map(mapQuizRenderedQuestion),
  };
}

export async function saveQuizAttempt(
  token: string,
  attemptId: number,
  data: Array<{ name: string; value: string }>,
  preflightData: Array<{ name: string; value: string }> = []
) {
  const params: Record<string, string> = {
    attemptid: String(attemptId),
  };
  appendNameValueParams(params, "data", data);
  appendNameValueParams(params, "preflightdata", preflightData);

  const result = await moodleRequest<RawMoodleQuizSaveAttemptResponse>(
    token,
    "mod_quiz_save_attempt",
    params
  );

  const warningMessage = getFirstWarningMessage(result.warnings);

  if (warningMessage) {
    throw new MoodleApiError(warningMessage, "quiz_save_warning");
  }

  return result.status ?? false;
}

export async function processQuizAttempt(
  token: string,
  attemptId: number,
  data: Array<{ name: string; value: string }>,
  finishAttempt = false,
  timeUp = false,
  preflightData: Array<{ name: string; value: string }> = []
) {
  const params: Record<string, string> = {
    attemptid: String(attemptId),
    finishattempt: finishAttempt ? "1" : "0",
    timeup: timeUp ? "1" : "0",
  };
  appendNameValueParams(params, "data", data);
  appendNameValueParams(params, "preflightdata", preflightData);

  const result = await moodleRequest<RawMoodleQuizProcessAttemptResponse>(
    token,
    "mod_quiz_process_attempt",
    params
  );

  const warningMessage = getFirstWarningMessage(result.warnings);

  if (warningMessage) {
    throw new MoodleApiError(warningMessage, "quiz_process_warning");
  }

  return mapQuizAttemptState(result.state);
}

export async function viewQuizAttemptSummary(
  token: string,
  attemptId: number,
  preflightData: Array<{ name: string; value: string }> = []
) {
  const params: Record<string, string> = {
    attemptid: String(attemptId),
  };
  appendNameValueParams(params, "preflightdata", preflightData);

  const result = await moodleRequest<RawMoodleViewResult>(
    token,
    "mod_quiz_view_attempt_summary",
    params
  );

  assertSuccessfulViewResult(result, "quiz_attempt_summary_view_failed");
}

export async function getQuizAttemptSummary(
  token: string,
  attemptId: number
): Promise<{
  questions: Array<{
    slot: number;
    type?: string;
    status?: string;
    flagged: boolean;
  }>;
}> {
  const result = await moodleRequest<{
    questions?: Array<{
      slot: number;
      type?: string;
      status?: string;
      flagged?: boolean;
    }>;
  }>(token, "mod_quiz_get_attempt_summary", {
    attemptid: String(attemptId),
  });

  return {
    questions: (result.questions || []).map((q) => ({
      slot: q.slot,
      type: q.type || undefined,
      status: q.status || undefined,
      flagged: q.flagged ?? false,
    })),
  };
}

export async function viewQuizAttemptReview(
  token: string,
  attemptId: number
) {
  const result = await moodleRequest<RawMoodleViewResult>(
    token,
    "mod_quiz_view_attempt_review",
    {
      attemptid: String(attemptId),
    }
  );

  assertSuccessfulViewResult(result, "quiz_attempt_review_view_failed");
}

export async function getQuizAttemptReview(
  token: string,
  attemptId: number,
  page = -1
): Promise<MoodleQuizAttemptReview> {
  const result = await moodleRequest<RawMoodleQuizAttemptReviewResponse>(
    token,
    "mod_quiz_get_attempt_review",
    {
      attemptid: String(attemptId),
      page: String(page),
    }
  );

  const warningMessage = getFirstWarningMessage(result.warnings);

  if (warningMessage) {
    throw new MoodleApiError(warningMessage, "quiz_review_warning");
  }

  if (!result.attempt) {
    throw new MoodleApiError(
      "Moodle no devolvio la revision del intento.",
      "quiz_review_missing_attempt"
    );
  }

  return {
    attempt: mapQuizAttempt(result.attempt),
    questions: (result.questions || []).map(mapQuizRenderedQuestion),
    additionalData: (result.additionaldata || []).map((item) => ({
      id: item.id || "",
      title: item.title || "",
      content: item.content || "",
    })),
  };
}

// ---------------------------------------------------------------------------
// Folders & Pages
// ---------------------------------------------------------------------------

type RawMoodleFolder = {
  id: number;
  coursemodule: number;
  course: number;
  name: string;
  intro?: string;
  revision?: number;
};

export type MoodleFolder = {
  id: number;
  courseModuleId: number;
  courseId: number;
  name: string;
  intro?: string;
};

type RawMoodlePage = {
  id: number;
  coursemodule: number;
  course: number;
  name: string;
  intro?: string;
  content?: string;
  contentformat?: number;
  revision?: number;
};

export type MoodlePage = {
  id: number;
  courseModuleId: number;
  courseId: number;
  name: string;
  intro?: string;
  content?: string;
};

export async function getFoldersByCourses(
  token: string,
  courseIds: number[]
): Promise<MoodleFolder[]> {
  const params: Record<string, string> = {};
  courseIds.forEach((id, i) => {
    params[`courseids[${i}]`] = String(id);
  });

  const result = await moodleRequest<{
    folders?: RawMoodleFolder[];
  }>(token, "mod_folder_get_folders_by_courses", params);

  return (result.folders || []).map((f) => ({
    id: f.id,
    courseModuleId: f.coursemodule,
    courseId: f.course,
    name: f.name,
    intro: f.intro || undefined,
  }));
}

export async function getPagesByCourses(
  token: string,
  courseIds: number[]
): Promise<MoodlePage[]> {
  const params: Record<string, string> = {};
  courseIds.forEach((id, i) => {
    params[`courseids[${i}]`] = String(id);
  });

  const result = await moodleRequest<{
    pages?: RawMoodlePage[];
  }>(token, "mod_page_get_pages_by_courses", params);

  return (result.pages || []).map((p) => ({
    id: p.id,
    courseModuleId: p.coursemodule,
    courseId: p.course,
    name: p.name,
    intro: p.intro || undefined,
    content: p.content || undefined,
  }));
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

type RawMoodleBadge = {
  id: number;
  name: string;
  description?: string;
  badgeurl?: string;
  issuername?: string;
  issuerurl?: string;
  dateissued?: number;
  dateexpire?: number;
  courseid?: number | null;
  uniquehash?: string;
};

export type MoodleBadge = {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  issuerName?: string;
  dateIssued?: number;
  dateExpire?: number;
  courseId?: number;
};

export async function getUserBadges(
  token: string,
  userId: number
): Promise<MoodleBadge[]> {
  const result = await moodleRequest<{
    badges?: RawMoodleBadge[];
  }>(token, "core_badges_get_user_badges", {
    userid: String(userId),
  });

  return (result.badges || []).map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description || undefined,
    imageUrl: b.badgeurl || undefined,
    issuerName: b.issuername || undefined,
    dateIssued: b.dateissued || undefined,
    dateExpire: b.dateexpire || undefined,
    courseId: b.courseid ?? undefined,
  }));
}

// ---------------------------------------------------------------------------
// Books
// ---------------------------------------------------------------------------

type RawMoodleBook = {
  id: number;
  coursemodule: number;
  course: number;
  name: string;
  intro?: string;
};

type RawMoodleBookChapter = {
  id: number;
  bookid: number;
  title: string;
  content?: string;
  contentformat?: number;
  hidden?: number;
  subchapter?: number;
};

export type MoodleBook = {
  id: number;
  courseModuleId: number;
  courseId: number;
  name: string;
  intro?: string;
};

export type MoodleBookChapter = {
  id: number;
  bookId: number;
  title: string;
  content?: string;
  hidden: boolean;
  isSubchapter: boolean;
};

export async function getBooksByCourses(
  token: string,
  courseIds: number[]
): Promise<MoodleBook[]> {
  const params: Record<string, string> = {};
  courseIds.forEach((id, i) => {
    params[`courseids[${i}]`] = String(id);
  });

  const result = await moodleRequest<{ books?: RawMoodleBook[] }>(
    token,
    "mod_book_get_books_by_courses",
    params
  );

  return (result.books || []).map((b) => ({
    id: b.id,
    courseModuleId: b.coursemodule,
    courseId: b.course,
    name: b.name,
    intro: b.intro || undefined,
  }));
}

// ---------------------------------------------------------------------------
// Glossaries
// ---------------------------------------------------------------------------

type RawMoodleGlossary = {
  id: number;
  coursemodule: number;
  course: number;
  name: string;
  intro?: string;
  entrycount?: number;
};

type RawMoodleGlossaryEntry = {
  id: number;
  glossaryid: number;
  concept: string;
  definition: string;
  definitionformat?: number;
  userid?: number;
  userfullname?: string;
  timecreated?: number;
  timemodified?: number;
};

export type MoodleGlossary = {
  id: number;
  courseModuleId: number;
  courseId: number;
  name: string;
  intro?: string;
  entryCount: number;
};

export type MoodleGlossaryEntry = {
  id: number;
  glossaryId: number;
  concept: string;
  definition: string;
  authorName?: string;
  timeCreated?: number;
};

export async function getGlossariesByCourses(
  token: string,
  courseIds: number[]
): Promise<MoodleGlossary[]> {
  const params: Record<string, string> = {};
  courseIds.forEach((id, i) => {
    params[`courseids[${i}]`] = String(id);
  });

  const result = await moodleRequest<{ glossaries?: RawMoodleGlossary[] }>(
    token,
    "mod_glossary_get_glossaries_by_courses",
    params
  );

  return (result.glossaries || []).map((g) => ({
    id: g.id,
    courseModuleId: g.coursemodule,
    courseId: g.course,
    name: g.name,
    intro: g.intro || undefined,
    entryCount: g.entrycount ?? 0,
  }));
}

export async function getGlossaryEntries(
  token: string,
  glossaryId: number
): Promise<MoodleGlossaryEntry[]> {
  const result = await moodleRequest<{ entries?: RawMoodleGlossaryEntry[] }>(
    token,
    "mod_glossary_get_entries_by_letter",
    { id: String(glossaryId), letter: "ALL", from: "0", limit: "500" }
  );

  return (result.entries || []).map((e) => ({
    id: e.id,
    glossaryId: e.glossaryid,
    concept: e.concept,
    definition: e.definition,
    authorName: e.userfullname || undefined,
    timeCreated: e.timecreated || undefined,
  }));
}

// ---------------------------------------------------------------------------
// Choices (polls)
// ---------------------------------------------------------------------------

type RawMoodleChoice = {
  id: number;
  coursemodule: number;
  course: number;
  name: string;
  intro?: string;
  allowupdate?: boolean;
  allowmultiple?: boolean;
  timeopen?: number;
  timeclose?: number;
};

type RawMoodleChoiceOption = {
  id: number;
  text: string;
  countanswers?: number;
  maxanswers?: number;
};

export type MoodleChoice = {
  id: number;
  courseModuleId: number;
  courseId: number;
  name: string;
  intro?: string;
  allowUpdate: boolean;
  allowMultiple: boolean;
  timeOpen?: number;
  timeClose?: number;
};

export type MoodleChoiceOption = {
  id: number;
  text: string;
  answerCount: number;
  maxAnswers: number;
};

export async function getChoicesByCourses(
  token: string,
  courseIds: number[]
): Promise<MoodleChoice[]> {
  const params: Record<string, string> = {};
  courseIds.forEach((id, i) => {
    params[`courseids[${i}]`] = String(id);
  });

  const result = await moodleRequest<{ choices?: RawMoodleChoice[] }>(
    token,
    "mod_choice_get_choices_by_courses",
    params
  );

  return (result.choices || []).map((c) => ({
    id: c.id,
    courseModuleId: c.coursemodule,
    courseId: c.course,
    name: c.name,
    intro: c.intro || undefined,
    allowUpdate: c.allowupdate ?? false,
    allowMultiple: c.allowmultiple ?? false,
    timeOpen: c.timeopen || undefined,
    timeClose: c.timeclose || undefined,
  }));
}

export async function getChoiceResults(
  token: string,
  choiceId: number
): Promise<{ options: MoodleChoiceOption[] }> {
  const result = await moodleRequest<{
    options?: RawMoodleChoiceOption[];
  }>(token, "mod_choice_get_choice_results", {
    choiceid: String(choiceId),
  });

  return {
    options: (result.options || []).map((o) => ({
      id: o.id,
      text: o.text,
      answerCount: o.countanswers ?? 0,
      maxAnswers: o.maxanswers ?? 0,
    })),
  };
}

export async function submitChoiceResponse(
  token: string,
  choiceId: number,
  responseIds: number[]
): Promise<boolean> {
  const params: Record<string, string> = {
    choiceid: String(choiceId),
  };
  responseIds.forEach((id, i) => {
    params[`responses[${i}]`] = String(id);
  });

  await moodleRequest<unknown>(
    token,
    "mod_choice_submit_choice_response",
    params
  );

  return true;
}

// ---------------------------------------------------------------------------
// H5P
// ---------------------------------------------------------------------------

type RawMoodleH5P = {
  id: number;
  course: number;
  coursemodule: number;
  name: string;
  intro?: string;
};

type RawMoodleH5PAttempt = {
  id: number;
  h5pactivityid: number;
  userid: number;
  timecreated?: number;
  timemodified?: number;
  attempt: number;
  rawscore?: number;
  maxscore?: number;
  scaled?: number;
  completion?: number;
  success?: number;
};

export type MoodleH5P = {
  id: number;
  courseId: number;
  courseModuleId: number;
  name: string;
  intro?: string;
};

export type MoodleH5PAttempt = {
  id: number;
  attemptNumber: number;
  rawScore?: number;
  maxScore?: number;
  scaled?: number;
  timeCreated?: number;
};

export async function getH5PActivitiesByCourses(
  token: string,
  courseIds: number[]
): Promise<MoodleH5P[]> {
  const params: Record<string, string> = {};
  courseIds.forEach((id, i) => {
    params[`courseids[${i}]`] = String(id);
  });

  const result = await moodleRequest<{
    h5pactivities?: RawMoodleH5P[];
  }>(token, "mod_h5pactivity_get_h5pactivities_by_courses", params);

  return (result.h5pactivities || []).map((h) => ({
    id: h.id,
    courseId: h.course,
    courseModuleId: h.coursemodule,
    name: h.name,
    intro: h.intro || undefined,
  }));
}

export async function getH5PAttempts(
  token: string,
  h5pId: number
): Promise<MoodleH5PAttempt[]> {
  const result = await moodleRequest<{
    attempts?: RawMoodleH5PAttempt[];
    usersattempts?: Array<{
      attempts?: RawMoodleH5PAttempt[];
    }>;
  }>(token, "mod_h5pactivity_get_attempts", {
    h5pactivityid: String(h5pId),
  });

  const attempts = result.attempts || result.usersattempts?.[0]?.attempts || [];

  return attempts.map((a) => ({
    id: a.id,
    attemptNumber: a.attempt,
    rawScore: a.rawscore ?? undefined,
    maxScore: a.maxscore ?? undefined,
    scaled: a.scaled ?? undefined,
    timeCreated: a.timecreated || undefined,
  }));
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

type RawMoodleFeedback = {
  id: number;
  coursemodule: number;
  course: number;
  name: string;
  intro?: string;
  timeopen?: number;
  timeclose?: number;
  isopen?: boolean;
  isalreadysubmitted?: boolean;
};

type RawMoodleFeedbackItem = {
  id: number;
  name: string;
  label?: string;
  typ: string;
  presentation?: string;
  position?: number;
};

export type MoodleFeedback = {
  id: number;
  courseModuleId: number;
  courseId: number;
  name: string;
  intro?: string;
  timeOpen?: number;
  timeClose?: number;
  isOpen: boolean;
  isAlreadySubmitted: boolean;
};

export type MoodleFeedbackItem = {
  id: number;
  name: string;
  label?: string;
  type: string;
  position: number;
};

export async function getFeedbacksByCourses(
  token: string,
  courseIds: number[]
): Promise<MoodleFeedback[]> {
  const params: Record<string, string> = {};
  courseIds.forEach((id, i) => {
    params[`courseids[${i}]`] = String(id);
  });

  const result = await moodleRequest<{ feedbacks?: RawMoodleFeedback[] }>(
    token,
    "mod_feedback_get_feedbacks_by_courses",
    params
  );

  return (result.feedbacks || []).map((f) => ({
    id: f.id,
    courseModuleId: f.coursemodule,
    courseId: f.course,
    name: f.name,
    intro: f.intro || undefined,
    timeOpen: f.timeopen || undefined,
    timeClose: f.timeclose || undefined,
    isOpen: f.isopen ?? false,
    isAlreadySubmitted: f.isalreadysubmitted ?? false,
  }));
}

export async function getFeedbackItems(
  token: string,
  feedbackId: number
): Promise<MoodleFeedbackItem[]> {
  const result = await moodleRequest<{ items?: RawMoodleFeedbackItem[] }>(
    token,
    "mod_feedback_get_items",
    { feedbackid: String(feedbackId) }
  );

  return (result.items || []).map((item) => ({
    id: item.id,
    name: item.name,
    label: item.label || undefined,
    type: item.typ,
    position: item.position ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// Lessons
// ---------------------------------------------------------------------------

type RawMoodleLesson = {
  id: number;
  coursemodule: number;
  course: number;
  name: string;
  intro?: string;
  timelimit?: number;
  retake?: number;
  grade?: number;
};

export type MoodleLesson = {
  id: number;
  courseModuleId: number;
  courseId: number;
  name: string;
  intro?: string;
  timeLimit?: number;
  allowRetake: boolean;
  maxGrade?: number;
};

export async function getLessonsByCourses(
  token: string,
  courseIds: number[]
): Promise<MoodleLesson[]> {
  const params: Record<string, string> = {};
  courseIds.forEach((id, i) => {
    params[`courseids[${i}]`] = String(id);
  });

  const result = await moodleRequest<{ lessons?: RawMoodleLesson[] }>(
    token,
    "mod_lesson_get_lessons_by_courses",
    params
  );

  return (result.lessons || []).map((l) => ({
    id: l.id,
    courseModuleId: l.coursemodule,
    courseId: l.course,
    name: l.name,
    intro: l.intro || undefined,
    timeLimit: l.timelimit || undefined,
    allowRetake: (l.retake ?? 0) > 0,
    maxGrade: l.grade ?? undefined,
  }));
}

// ---------------------------------------------------------------------------
// Database (mod_data)
// ---------------------------------------------------------------------------

type RawMoodleDatabase = {
  id: number;
  coursemodule: number;
  course: number;
  name: string;
  intro?: string;
};

type RawMoodleDatabaseEntry = {
  id: number;
  userid: number;
  fullname?: string;
  timecreated?: number;
  timemodified?: number;
  contents?: Array<{
    fieldid: number;
    content?: string;
    content1?: string;
  }>;
};

export type MoodleDatabase = {
  id: number;
  courseModuleId: number;
  courseId: number;
  name: string;
  intro?: string;
};

export type MoodleDatabaseEntry = {
  id: number;
  userId: number;
  authorName?: string;
  timeCreated?: number;
  contents: Array<{ fieldId: number; content?: string }>;
};

export async function getDatabasesByCourses(
  token: string,
  courseIds: number[]
): Promise<MoodleDatabase[]> {
  const params: Record<string, string> = {};
  courseIds.forEach((id, i) => {
    params[`courseids[${i}]`] = String(id);
  });

  const result = await moodleRequest<{ databases?: RawMoodleDatabase[] }>(
    token,
    "mod_data_get_databases_by_courses",
    params
  );

  return (result.databases || []).map((d) => ({
    id: d.id,
    courseModuleId: d.coursemodule,
    courseId: d.course,
    name: d.name,
    intro: d.intro || undefined,
  }));
}

export async function getDatabaseEntries(
  token: string,
  databaseId: number
): Promise<MoodleDatabaseEntry[]> {
  const result = await moodleRequest<{
    entries?: RawMoodleDatabaseEntry[];
  }>(token, "mod_data_get_entries", {
    databaseid: String(databaseId),
  });

  return (result.entries || []).map((e) => ({
    id: e.id,
    userId: e.userid,
    authorName: e.fullname || undefined,
    timeCreated: e.timecreated || undefined,
    contents: (e.contents || []).map((c) => ({
      fieldId: c.fieldid,
      content: c.content || c.content1 || undefined,
    })),
  }));
}

// ---------------------------------------------------------------------------
// Workshops
// ---------------------------------------------------------------------------

type RawMoodleWorkshop = {
  id: number;
  coursemodule: number;
  course: number;
  name: string;
  intro?: string;
  phase?: number;
  grade?: number;
};

type RawMoodleWorkshopSubmission = {
  id: number;
  authorid: number;
  title: string;
  content?: string;
  timecreated?: number;
  timemodified?: number;
  grade?: number;
  gradeover?: number;
  published?: boolean;
};

export type MoodleWorkshop = {
  id: number;
  courseModuleId: number;
  courseId: number;
  name: string;
  intro?: string;
  phase: number;
  maxGrade?: number;
};

export type MoodleWorkshopSubmission = {
  id: number;
  authorId: number;
  title: string;
  content?: string;
  timeCreated?: number;
  grade?: number;
  published: boolean;
};

export async function getWorkshopsByCourses(
  token: string,
  courseIds: number[]
): Promise<MoodleWorkshop[]> {
  const params: Record<string, string> = {};
  courseIds.forEach((id, i) => {
    params[`courseids[${i}]`] = String(id);
  });

  const result = await moodleRequest<{ workshops?: RawMoodleWorkshop[] }>(
    token,
    "mod_workshop_get_workshops_by_courses",
    params
  );

  return (result.workshops || []).map((w) => ({
    id: w.id,
    courseModuleId: w.coursemodule,
    courseId: w.course,
    name: w.name,
    intro: w.intro || undefined,
    phase: w.phase ?? 0,
    maxGrade: w.grade ?? undefined,
  }));
}

export async function getWorkshopSubmissions(
  token: string,
  workshopId: number
): Promise<MoodleWorkshopSubmission[]> {
  const result = await moodleRequest<{
    submissions?: RawMoodleWorkshopSubmission[];
  }>(token, "mod_workshop_get_submissions", {
    workshopid: String(workshopId),
  });

  return (result.submissions || []).map((s) => ({
    id: s.id,
    authorId: s.authorid,
    title: s.title,
    content: s.content || undefined,
    timeCreated: s.timecreated || undefined,
    grade: s.grade ?? undefined,
    published: s.published ?? false,
  }));
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// LTI (external tools)
// ---------------------------------------------------------------------------

type RawMoodleLti = {
  id: number;
  coursemodule: number;
  course: number;
  name: string;
  intro?: string;
  launchcontainer?: number;
};

export type MoodleLti = {
  id: number;
  courseModuleId: number;
  courseId: number;
  name: string;
  intro?: string;
};

export async function getLtisByCourses(
  token: string,
  courseIds: number[]
): Promise<MoodleLti[]> {
  const params: Record<string, string> = {};
  courseIds.forEach((id, i) => {
    params[`courseids[${i}]`] = String(id);
  });

  const result = await moodleRequest<{ ltis?: RawMoodleLti[] }>(
    token,
    "mod_lti_get_ltis_by_courses",
    params
  );

  return (result.ltis || []).map((l) => ({
    id: l.id,
    courseModuleId: l.coursemodule,
    courseId: l.course,
    name: l.name,
    intro: l.intro || undefined,
  }));
}

export async function getLtiLaunchData(
  token: string,
  ltiId: number
): Promise<{ endpoint?: string; parameters: Array<{ name: string; value: string }> }> {
  const result = await moodleRequest<{
    endpoint?: string;
    parameters?: Array<{ name?: string; value?: string }>;
  }>(token, "mod_lti_get_tool_launch_data", {
    toolid: String(ltiId),
  });

  return {
    endpoint: result.endpoint || undefined,
    parameters: (result.parameters || [])
      .filter((p) => p.name)
      .map((p) => ({ name: p.name!, value: p.value || "" })),
  };
}

// ---------------------------------------------------------------------------
// Wikis
// ---------------------------------------------------------------------------

type RawMoodleWiki = {
  id: number;
  coursemodule: number;
  course: number;
  name: string;
  intro?: string;
};

type RawMoodleWikiPage = {
  id: number;
  subwikiid: number;
  title: string;
  timecreated?: number;
  timemodified?: number;
  userid?: number;
};

export type MoodleWiki = {
  id: number;
  courseModuleId: number;
  courseId: number;
  name: string;
  intro?: string;
};

export type MoodleWikiPage = {
  id: number;
  title: string;
  timeModified?: number;
};

export async function getWikisByCourses(
  token: string,
  courseIds: number[]
): Promise<MoodleWiki[]> {
  const params: Record<string, string> = {};
  courseIds.forEach((id, i) => {
    params[`courseids[${i}]`] = String(id);
  });

  const result = await moodleRequest<{ wikis?: RawMoodleWiki[] }>(
    token,
    "mod_wiki_get_wikis_by_courses",
    params
  );

  return (result.wikis || []).map((w) => ({
    id: w.id,
    courseModuleId: w.coursemodule,
    courseId: w.course,
    name: w.name,
    intro: w.intro || undefined,
  }));
}

export async function getWikiSubwikiPages(
  token: string,
  wikiId: number
): Promise<MoodleWikiPage[]> {
  const result = await moodleRequest<{
    pages?: RawMoodleWikiPage[];
  }>(token, "mod_wiki_get_subwiki_pages", {
    wikiid: String(wikiId),
  });

  return (result.pages || []).map((p) => ({
    id: p.id,
    title: p.title,
    timeModified: p.timemodified || undefined,
  }));
}

export async function getWikiPageContents(
  token: string,
  pageId: number
): Promise<{ title: string; content: string }> {
  const result = await moodleRequest<{
    page?: { title?: string; cachedcontent?: string };
  }>(token, "mod_wiki_get_page_contents", {
    pageid: String(pageId),
  });

  return {
    title: result.page?.title || "",
    content: result.page?.cachedcontent || "",
  };
}

// ---------------------------------------------------------------------------
// Competencies
// ---------------------------------------------------------------------------

type RawMoodleCourseCompetency = {
  competency?: {
    id: number;
    shortname?: string;
    description?: string;
    idnumber?: string;
  };
  coursemodulecount?: number;
};

export type MoodleCourseCompetency = {
  id: number;
  shortName: string;
  description?: string;
};

export type MoodleUserCompetencyStatus = {
  competencyId: number;
  grade?: number;
  proficient: boolean;
};

export async function getCoursCompetencies(
  token: string,
  courseId: number
): Promise<MoodleCourseCompetency[]> {
  const result = await moodleRequest<RawMoodleCourseCompetency[]>(
    token,
    "core_competency_list_course_competencies",
    { id: String(courseId) }
  );

  const items = Array.isArray(result) ? result : [];

  return items
    .filter((item) => item.competency)
    .map((item) => ({
      id: item.competency!.id,
      shortName: item.competency!.shortname || String(item.competency!.id),
      description: item.competency!.description || undefined,
    }));
}

export async function getUserCompetencyInCourse(
  token: string,
  courseId: number,
  userId: number,
  competencyId: number
): Promise<MoodleUserCompetencyStatus> {
  const result = await moodleRequest<{
    usercompetency?: {
      competencyid?: number;
      grade?: number;
      proficiency?: boolean;
    };
    usercompetencycourse?: {
      grade?: number;
      proficiency?: boolean;
    };
    proficiency?: boolean;
  }>(
    token,
    "tool_lp_data_for_user_competency_summary_in_course",
    {
      courseid: String(courseId),
      userid: String(userId),
      competencyid: String(competencyId),
    }
  );

  return {
    competencyId,
    grade:
      result.usercompetency?.grade ??
      result.usercompetencycourse?.grade ??
      undefined,
    proficient:
      result.usercompetency?.proficiency ??
      result.usercompetencycourse?.proficiency ??
      result.proficiency ??
      false,
  };
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

type RawMoodleNote = {
  id: number;
  courseid: number;
  userid: number;
  publishstate?: string;
  content?: string;
  format?: number;
  created?: number;
  lastmodified?: number;
};

export type MoodleNote = {
  id: number;
  courseId: number;
  content: string;
  publishState: string;
  created?: number;
};

export async function getCourseNotes(
  token: string,
  courseId: number,
  userId: number
): Promise<MoodleNote[]> {
  const result = await moodleRequest<{
    sitenotes?: RawMoodleNote[];
    coursenotes?: RawMoodleNote[];
    personalnotes?: RawMoodleNote[];
  }>(token, "core_notes_get_course_notes", {
    courseid: String(courseId),
    userid: String(userId),
  });

  const all = [
    ...(result.coursenotes || []),
    ...(result.personalnotes || []),
    ...(result.sitenotes || []),
  ];

  return all.map((n) => ({
    id: n.id,
    courseId: n.courseid,
    content: n.content || "",
    publishState: n.publishstate || "personal",
    created: n.created || undefined,
  }));
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

export type MoodleGroup = {
  id: number;
  name: string;
  description?: string;
};

export async function getCourseUserGroups(
  token: string,
  courseId: number,
  userId: number
): Promise<MoodleGroup[]> {
  const result = await moodleRequest<{
    groups?: Array<{
      id: number;
      name: string;
      description?: string;
    }>;
  }>(token, "core_group_get_course_user_groups", {
    courseid: String(courseId),
    userid: String(userId),
  });

  return (result.groups || []).map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description || undefined,
  }));
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

type RawMoodleBlogEntry = {
  id: number;
  subject: string;
  summary?: string;
  summaryformat?: number;
  userid?: number;
  userfullname?: string;
  created?: number;
  lastmodified?: number;
  publishstate?: string;
};

export type MoodleBlogEntry = {
  id: number;
  subject: string;
  summary?: string;
  authorName?: string;
  created?: number;
};

export async function getBlogEntries(
  token: string
): Promise<MoodleBlogEntry[]> {
  const result = await moodleRequest<{
    entries?: RawMoodleBlogEntry[];
  }>(token, "core_blog_get_entries", {});

  return (result.entries || []).map((e) => ({
    id: e.id,
    subject: e.subject,
    summary: e.summary || undefined,
    authorName: e.userfullname || undefined,
    created: e.created || undefined,
  }));
}

// ---------------------------------------------------------------------------
// Global Search
// ---------------------------------------------------------------------------

type RawMoodleSearchResult = {
  itemid: number;
  componentname?: string;
  areaname?: string;
  title?: string;
  content?: string;
  contexturl?: string;
  courseid?: number;
  coursefullname?: string;
};

export type MoodleSearchResult = {
  itemId: number;
  component?: string;
  area?: string;
  title: string;
  content?: string;
  contextUrl?: string;
  courseId?: number;
  courseName?: string;
};

export async function searchGlobal(
  token: string,
  query: string
): Promise<MoodleSearchResult[]> {
  const result = await moodleRequest<{
    results?: RawMoodleSearchResult[];
  }>(token, "core_search_get_results", {
    query,
  });

  return (result.results || []).map((r) => ({
    itemId: r.itemid,
    component: r.componentname || undefined,
    area: r.areaname || undefined,
    title: r.title || "(Sin título)",
    content: r.content || undefined,
    contextUrl: r.contexturl || undefined,
    courseId: r.courseid || undefined,
    courseName: r.coursefullname || undefined,
  }));
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

type RawMoodleNotification = {
  id: number;
  subject?: string;
  shortenedsubject?: string;
  fullmessage?: string;
  fullmessagehtml?: string;
  smallmessage?: string;
  contexturl?: string;
  timecreated?: number;
  timeread?: number | null;
  useridfrom?: number;
  userfromfullname?: string;
  component?: string;
};

export type MoodleNotification = {
  id: number;
  subject: string;
  message?: string;
  messageHtml?: string;
  contextUrl?: string;
  timeCreated?: number;
  isRead: boolean;
  fromUserName?: string;
  component?: string;
};

export async function getNotifications(
  token: string,
  userId: number
): Promise<MoodleNotification[]> {
  const result = await moodleRequest<{
    notifications?: RawMoodleNotification[];
  }>(token, "message_popup_get_popup_notifications", {
    useridto: String(userId),
    newestfirst: "1",
    limit: "50",
    offset: "0",
  });

  return (result.notifications || []).map((n) => ({
    id: n.id,
    subject: n.subject || n.shortenedsubject || "(Sin asunto)",
    message: n.smallmessage || n.fullmessage || undefined,
    messageHtml: n.fullmessagehtml || undefined,
    contextUrl: n.contexturl || undefined,
    timeCreated: n.timecreated || undefined,
    isRead: n.timeread !== null && n.timeread !== undefined,
    fromUserName: n.userfromfullname || undefined,
    component: n.component || undefined,
  }));
}

export async function getUnreadNotificationCount(
  token: string,
  userId: number
): Promise<number> {
  const result = await moodleRequest<Record<string, unknown>>(
    token,
    "message_popup_get_unread_popup_notification_count",
    { useridto: String(userId) }
  );

  if (typeof result === "number") return result;
  const count = (result as { count?: number }).count;
  return typeof count === "number" ? count : 0;
}

// ---------------------------------------------------------------------------
// Course Catalog & Search
// ---------------------------------------------------------------------------

type RawMoodleCatalogCourse = {
  id: number;
  fullname: string;
  shortname?: string;
  summary?: string;
  categoryname?: string;
  enrolleduserscount?: number;
};

export type MoodleCatalogCourse = {
  id: number;
  fullname: string;
  shortname?: string;
  summary?: string;
  categoryName?: string;
  enrolledUsersCount: number;
};

export async function searchCourses(
  token: string,
  query: string
): Promise<MoodleCatalogCourse[]> {
  const result = await moodleRequest<{
    courses?: RawMoodleCatalogCourse[];
  }>(token, "core_course_search_courses", {
    criterianame: "search",
    criteriavalue: query,
    page: "0",
    perpage: "50",
  });

  return (result.courses || []).map((c) => ({
    id: c.id,
    fullname: c.fullname,
    shortname: c.shortname || undefined,
    summary: c.summary || undefined,
    categoryName: c.categoryname || undefined,
    enrolledUsersCount: c.enrolleduserscount ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// Self-enrollment
// ---------------------------------------------------------------------------

export async function selfEnrolUser(
  token: string,
  courseId: number
): Promise<{ status: boolean; warnings: string[] }> {
  const result = await moodleRequest<{
    status?: boolean;
    warnings?: Array<{ message?: string }>;
  }>(token, "enrol_self_enrol_user", {
    courseid: String(courseId),
  });

  return {
    status: result.status ?? false,
    warnings: (result.warnings || [])
      .map((w) => w.message || "")
      .filter(Boolean),
  };
}

// ---------------------------------------------------------------------------
// Recent Courses
// ---------------------------------------------------------------------------

export async function getRecentCourses(
  token: string,
  userId: number
): Promise<Array<{ id: number; fullname: string; shortname?: string }>> {
  const result = await moodleRequest<
    Array<{ id: number; fullname: string; shortname?: string }>
  >(token, "core_course_get_recent_courses", {
    userid: String(userId),
    limit: "10",
  });

  const items = Array.isArray(result) ? result : [];

  return items.map((c) => ({
    id: c.id,
    fullname: c.fullname,
    shortname: c.shortname || undefined,
  }));
}

// ---------------------------------------------------------------------------
// Favorites
// ---------------------------------------------------------------------------

export async function setCourseFavourite(
  token: string,
  courseId: number,
  favourite: boolean
): Promise<boolean> {
  const result = await moodleRequest<{
    warnings?: Array<{ message?: string }>;
  }>(token, "core_course_set_favourite_courses", {
    "courses[0][id]": String(courseId),
    "courses[0][favourite]": favourite ? "1" : "0",
  });

  const warning = result.warnings?.find((w) => w.message)?.message;
  if (warning) {
    throw new MoodleApiError(warning, "favourite_warning");
  }

  return true;
}

// ---------------------------------------------------------------------------
// User Profile
// ---------------------------------------------------------------------------

type RawMoodleFullUserProfile = {
  id: number;
  username?: string;
  firstname?: string;
  lastname?: string;
  fullname?: string;
  email?: string;
  department?: string;
  institution?: string;
  description?: string;
  descriptionformat?: number;
  city?: string;
  country?: string;
  profileimageurl?: string;
  profileimageurlsmall?: string;
  firstaccess?: number;
  lastaccess?: number;
};

export type MoodleUserProfile = {
  id: number;
  username: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: string;
  institution?: string;
  description?: string;
  city?: string;
  country?: string;
  pictureUrl?: string;
  firstAccess?: number;
  lastAccess?: number;
};

export async function getUserProfile(
  token: string,
  userId: number
): Promise<MoodleUserProfile | null> {
  const result = await moodleRequest<RawMoodleFullUserProfile[]>(
    token,
    "core_user_get_users_by_field",
    { field: "id", "values[0]": String(userId) }
  );

  const user = Array.isArray(result) ? result[0] : null;
  if (!user) return null;

  return {
    id: user.id,
    username: user.username || "",
    fullName: user.fullname || `${user.firstname || ""} ${user.lastname || ""}`.trim(),
    firstName: user.firstname || undefined,
    lastName: user.lastname || undefined,
    email: user.email || undefined,
    department: user.department || undefined,
    institution: user.institution || undefined,
    description: user.description || undefined,
    city: user.city || undefined,
    country: user.country || undefined,
    pictureUrl: pickUserPictureUrl(user),
    firstAccess: user.firstaccess || undefined,
    lastAccess: user.lastaccess || undefined,
  };
}

// ---------------------------------------------------------------------------
// Private Files
// ---------------------------------------------------------------------------

type RawMoodleFile = {
  filename?: string;
  filepath?: string;
  filesize?: number;
  fileurl?: string;
  timecreated?: number;
  timemodified?: number;
  isdir?: boolean;
  mimetype?: string;
};

export type MoodlePrivateFile = {
  filename: string;
  filepath: string;
  filesize: number;
  fileUrl?: string;
  timeModified?: number;
  isDirectory: boolean;
  mimetype?: string;
};

export async function getPrivateFiles(
  token: string
): Promise<MoodlePrivateFile[]> {
  const result = await moodleRequest<{
    files?: RawMoodleFile[];
  }>(token, "core_files_get_files", {
    contextid: "-1",
    component: "user",
    filearea: "private",
    itemid: "0",
    filepath: "/",
    filename: "",
  });

  return (result.files || [])
    .filter((f) => f.filename && f.filename !== ".")
    .map((f) => ({
      filename: f.filename!,
      filepath: f.filepath || "/",
      filesize: f.filesize ?? 0,
      fileUrl: f.fileurl || undefined,
      timeModified: f.timemodified || undefined,
      isDirectory: f.isdir ?? false,
      mimetype: f.mimetype || undefined,
    }));
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

type RawMoodleTagEntry = {
  id: number;
  name?: string;
  rawname?: string;
  isstandard?: boolean;
  count?: number;
};

export type MoodleTag = {
  id: number;
  name: string;
  count: number;
};

export async function getTagIndex(
  token: string,
  tagAreaName: string = "core_course",
  tagAreaComponent: string = "core"
): Promise<MoodleTag[]> {
  const result = await moodleRequest<{
    tags?: RawMoodleTagEntry[];
  }>(token, "core_tag_get_tagindex", {
    tagindex: JSON.stringify({
      tag: "",
      tc: "0",
      ta: tagAreaName,
      excl: "0",
      from: "0",
      ctx: "0",
      rec: "1",
    }),
  });

  return (result.tags || []).map((t) => ({
    id: t.id,
    name: t.rawname || t.name || "",
    count: t.count ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// User Preferences
// ---------------------------------------------------------------------------

type RawMoodlePreference = {
  name: string;
  value?: string;
};

export type MoodleUserPreference = {
  name: string;
  value: string;
};

export async function getUserPreferences(
  token: string,
  userId: number
): Promise<MoodleUserPreference[]> {
  const result = await moodleRequest<{
    preferences?: RawMoodlePreference[];
  }>(token, "core_user_get_user_preferences", {
    userid: String(userId),
  });

  return (result.preferences || []).map((p) => ({
    name: p.name,
    value: p.value ?? "",
  }));
}

export async function setUserPreferences(
  token: string,
  userId: number,
  preferences: Array<{ name: string; value: string }>
): Promise<void> {
  const params: Record<string, string> = {};

  preferences.forEach((pref, i) => {
    params[`preferences[${i}][type]`] = pref.name;
    params[`preferences[${i}][value]`] = pref.value;
  });

  params.userid = String(userId);

  await moodleRequest<{ saved?: boolean }>(
    token,
    "core_user_set_user_preferences",
    params
  );
}

// ---------------------------------------------------------------------------
// User Profile Update
// ---------------------------------------------------------------------------

export async function updateUserPicture(
  token: string,
  userId: number,
  draftItemId: number
): Promise<{ profileImageUrl?: string }> {
  const result = await moodleRequest<{
    success?: boolean;
    profileimageurl?: string;
  }>(token, "core_user_update_picture", {
    userid: String(userId),
    draftitemid: String(draftItemId),
  });

  return {
    profileImageUrl: result.profileimageurl || undefined,
  };
}

// ---------------------------------------------------------------------------
// Assignment Submission
// ---------------------------------------------------------------------------

export async function saveAssignmentSubmission(
  token: string,
  assignId: number,
  onlineText: string
): Promise<boolean> {
  const result = await moodleRequest<{
    warnings?: Array<{ message?: string }>;
  }>(token, "mod_assign_save_submission", {
    assignmentid: String(assignId),
    "plugindata[onlinetext_editor][text]": onlineText,
    "plugindata[onlinetext_editor][format]": "1",
    "plugindata[onlinetext_editor][itemid]": "0",
  });

  const warning = result.warnings?.find((w) => w.message)?.message;
  if (warning) {
    throw new MoodleApiError(warning, "submission_warning");
  }

  return true;
}

// ---------------------------------------------------------------------------
// Course Updates
// ---------------------------------------------------------------------------

type RawMoodleCourseUpdate = {
  id: number;
  name?: string;
  timeupdated?: number;
  itemids?: number[];
};

export type MoodleCourseUpdate = {
  instanceId: number;
  name: string;
  timeUpdated: number;
  itemIds: number[];
};

export async function getCourseUpdatesSince(
  token: string,
  courseId: number,
  since: number
): Promise<MoodleCourseUpdate[]> {
  const result = await moodleRequest<{
    instances?: RawMoodleCourseUpdate[];
  }>(token, "core_course_get_updates_since", {
    courseid: String(courseId),
    since: String(since),
  });

  return (result.instances || []).map((u) => ({
    instanceId: u.id,
    name: u.name || "",
    timeUpdated: u.timeupdated ?? 0,
    itemIds: u.itemids || [],
  }));
}

// ---------------------------------------------------------------------------
// Notification Management
// ---------------------------------------------------------------------------

export async function markAllNotificationsAsRead(
  token: string,
  userId: number
): Promise<void> {
  await moodleRequest<unknown>(
    token,
    "core_message_mark_all_notifications_as_read",
    {
      useridto: String(userId),
      useridfrom: "0",
      timecreatedto: "0",
    }
  );
}

// ---------------------------------------------------------------------------
// Message Read Status
// ---------------------------------------------------------------------------

export async function markMessageRead(
  token: string,
  messageId: number
): Promise<void> {
  await moodleRequest<unknown>(token, "core_message_mark_message_read", {
    messageid: String(messageId),
    timeread: String(Math.floor(Date.now() / 1000)),
  });
}

// ---------------------------------------------------------------------------
// Surveys (COLLES/ATTLS)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------

type RawMoodleContact = {
  id: number;
  fullname?: string;
  profileimageurl?: string;
  profileimageurlsmall?: string;
};

export type MoodleContact = {
  id: number;
  fullName: string;
  pictureUrl?: string;
};

export async function getContacts(
  token: string,
  userId: number
): Promise<MoodleContact[]> {
  const result = await moodleRequest<{
    contacts?: RawMoodleContact[];
    online?: RawMoodleContact[];
    offline?: RawMoodleContact[];
  }>(token, "core_message_get_user_contacts", {
    userid: String(userId),
    limitfrom: "0",
    limitnum: "0",
  });

  const all =
    result.contacts ||
    [...(result.online || []), ...(result.offline || [])];

  return all.map((c) => ({
    id: c.id,
    fullName: c.fullname || "Usuario",
    pictureUrl: c.profileimageurl || c.profileimageurlsmall || undefined,
  }));
}

export async function addContact(
  token: string,
  userId: number,
  contactId: number
): Promise<void> {
  await moodleRequest<unknown>(
    token,
    "core_message_create_contact_request",
    {
      userid: String(userId),
      requesteduserid: String(contactId),
    }
  );
}

export function isAuthenticationError(error: unknown) {
  if (!(error instanceof MoodleApiError)) {
    return false;
  }

  const code = error.code?.toLowerCase();
  const message = error.message.toLowerCase();

  return (
    code === "invalidtoken" ||
    code === "servicerequireslogin" ||
    code === "requireloginerror" ||
    code === "usernotfullyloggedin" ||
    message.includes("invalidtoken") ||
    message.includes("servicerequireslogin") ||
    message.includes("requireloginerror") ||
    message.includes("not fully logged in")
  );
}

export function isAccessException(error: unknown) {
  if (!(error instanceof MoodleApiError)) {
    return false;
  }

  const code = error.code?.toLowerCase();
  const message = error.message.toLowerCase();

  return (
    code === "accessexception" ||
    message.includes("accessexception") ||
    message.includes("control de acceso")
  );
}

// ─── Admin: Types ──────────────────────────────────────────────────────────────

type RawAdminUser = {
  id: number;
  username?: string;
  firstname?: string;
  lastname?: string;
  fullname?: string;
  email?: string;
  department?: string;
  institution?: string;
  city?: string;
  country?: string;
  profileimageurl?: string;
  suspended?: boolean;
  confirmed?: boolean;
  auth?: string;
  timecreated?: number;
  lastaccess?: number;
  description?: string;
};

export type AdminUser = {
  id: number;
  username: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  institution?: string;
  city?: string;
  country?: string;
  pictureUrl?: string;
  suspended: boolean;
  confirmed: boolean;
  auth?: string;
  timeCreated?: number;
  lastAccess?: number;
  description?: string;
};

function normalizeAdminUser(u: RawAdminUser): AdminUser {
  return {
    id: u.id,
    username: u.username ?? "",
    fullName: u.fullname ?? `${u.firstname ?? ""} ${u.lastname ?? ""}`.trim(),
    firstName: u.firstname ?? "",
    lastName: u.lastname ?? "",
    email: u.email ?? "",
    department: u.department,
    institution: u.institution,
    city: u.city,
    country: u.country,
    pictureUrl: u.profileimageurl,
    suspended: u.suspended ?? false,
    confirmed: u.confirmed ?? true,
    auth: u.auth,
    timeCreated: u.timecreated,
    lastAccess: u.lastaccess,
    description: u.description,
  };
}

type RawAdminCourse = {
  id: number;
  shortname?: string;
  fullname?: string;
  displayname?: string;
  summary?: string;
  categoryid?: number;
  categoryname?: string;
  visible?: number;
  startdate?: number;
  enddate?: number;
  enrolledusercount?: number;
  timecreated?: number;
  format?: string;
};

export type AdminCourse = {
  id: number;
  shortname: string;
  fullname: string;
  displayname?: string;
  summary?: string;
  categoryId?: number;
  categoryName?: string;
  visible: boolean;
  startDate?: number;
  endDate?: number;
  enrolledUserCount?: number;
  timeCreated?: number;
  format?: string;
};

function normalizeAdminCourse(c: RawAdminCourse): AdminCourse {
  return {
    id: c.id,
    shortname: c.shortname ?? "",
    fullname: c.fullname ?? "",
    displayname: c.displayname,
    summary: c.summary,
    categoryId: c.categoryid,
    categoryName: c.categoryname,
    visible: (c.visible ?? 1) === 1,
    startDate: c.startdate,
    endDate: c.enddate,
    enrolledUserCount: c.enrolledusercount,
    timeCreated: c.timecreated,
    format: c.format,
  };
}

type RawMoodleCohort = {
  id: number;
  name?: string;
  idnumber?: string;
  description?: string;
  visible?: boolean;
  contextid?: number;
  timecreated?: number;
  timemodified?: number;
};

export type MoodleCohort = {
  id: number;
  name: string;
  idNumber?: string;
  description?: string;
  visible: boolean;
  contextId?: number;
  timeCreated?: number;
  timeModified?: number;
};

function normalizeCohort(c: RawMoodleCohort): MoodleCohort {
  return {
    id: c.id,
    name: c.name ?? "",
    idNumber: c.idnumber,
    description: c.description,
    visible: c.visible ?? true,
    contextId: c.contextid,
    timeCreated: c.timecreated,
    timeModified: c.timemodified,
  };
}

export type CreateUserInput = {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  auth?: string;
  department?: string;
  institution?: string;
  description?: string;
  city?: string;
  country?: string;
};

export type UpdateUserInput = {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: string;
  institution?: string;
  description?: string;
  city?: string;
  country?: string;
  suspended?: boolean;
};

export type CreateCourseInput = {
  fullname: string;
  shortname: string;
  categoryId: number;
  summary?: string;
  visible?: boolean;
  startDate?: number;
  endDate?: number;
  format?: string;
};

export type UpdateCourseInput = {
  id: number;
  fullname?: string;
  shortname?: string;
  summary?: string;
  visible?: boolean;
  startDate?: number;
  endDate?: number;
};

export type CreateCohortInput = {
  name: string;
  idNumber?: string;
  description?: string;
  visible?: boolean;
  contextLevel?: string;
  instanceId?: number;
};

export type UpdateCohortInput = {
  id: number;
  name?: string;
  idNumber?: string;
  description?: string;
  visible?: boolean;
};

// ─── Admin: User management ────────────────────────────────────────────────────

export async function adminSearchUsers(
  token: string,
  criteria: Array<{ key: string; value: string }>
): Promise<AdminUser[]> {
  const params: Record<string, string> = {};
  criteria.forEach((c, i) => {
    params[`criteria[${i}][key]`] = c.key;
    params[`criteria[${i}][value]`] = c.value;
  });
  const response = await moodleRequest<{ users: RawAdminUser[] }>(
    token,
    "core_user_get_users",
    params
  );
  return (response.users ?? []).map(normalizeAdminUser);
}

export async function adminCreateUser(
  token: string,
  input: CreateUserInput
): Promise<{ id: number; username: string }> {
  const params: Record<string, string> = {
    "users[0][username]": input.username,
    "users[0][password]": input.password,
    "users[0][firstname]": input.firstName,
    "users[0][lastname]": input.lastName,
    "users[0][email]": input.email,
    "users[0][auth]": input.auth ?? "manual",
  };
  if (input.department) params["users[0][department]"] = input.department;
  if (input.institution) params["users[0][institution]"] = input.institution;
  if (input.description) params["users[0][description]"] = input.description;
  if (input.city) params["users[0][city]"] = input.city;
  if (input.country) params["users[0][country]"] = input.country;
  const response = await moodleRequest<Array<{ id: number; username: string }>>(
    token,
    "core_user_create_users",
    params
  );
  return response[0];
}

export async function adminUpdateUser(
  token: string,
  input: UpdateUserInput
): Promise<void> {
  const params: Record<string, string> = {
    "users[0][id]": String(input.id),
  };
  if (input.firstName !== undefined) params["users[0][firstname]"] = input.firstName;
  if (input.lastName !== undefined) params["users[0][lastname]"] = input.lastName;
  if (input.email !== undefined) params["users[0][email]"] = input.email;
  if (input.department !== undefined) params["users[0][department]"] = input.department;
  if (input.institution !== undefined) params["users[0][institution]"] = input.institution;
  if (input.description !== undefined) params["users[0][description]"] = input.description;
  if (input.city !== undefined) params["users[0][city]"] = input.city;
  if (input.country !== undefined) params["users[0][country]"] = input.country;
  if (input.suspended !== undefined) params["users[0][suspended]"] = input.suspended ? "1" : "0";
  await moodleRequest<unknown>(token, "core_user_update_users", params);
}

export async function adminDeleteUser(
  token: string,
  userId: number
): Promise<void> {
  await moodleRequest<unknown>(token, "core_user_delete_users", {
    "userids[0]": String(userId),
  });
}

// ─── Admin: Course management ──────────────────────────────────────────────────

export async function adminGetCourses(
  token: string,
  courseIds?: number[]
): Promise<AdminCourse[]> {
  const params: Record<string, string> = {};
  if (courseIds && courseIds.length > 0) {
    courseIds.forEach((id, i) => {
      params[`options[ids][${i}]`] = String(id);
    });
  }
  const response = await moodleRequest<RawAdminCourse[]>(
    token,
    "core_course_get_courses",
    params
  );
  return (response ?? [])
    .filter((c) => c.id !== 1) // exclude site front page (id=1)
    .map(normalizeAdminCourse);
}

export async function adminCreateCourse(
  token: string,
  input: CreateCourseInput
): Promise<{ id: number; shortname: string }> {
  const params: Record<string, string> = {
    "courses[0][fullname]": input.fullname,
    "courses[0][shortname]": input.shortname,
    "courses[0][categoryid]": String(input.categoryId),
    "courses[0][visible]": input.visible === false ? "0" : "1",
    "courses[0][format]": input.format ?? "topics",
  };
  if (input.summary) params["courses[0][summary]"] = input.summary;
  if (input.startDate) params["courses[0][startdate]"] = String(input.startDate);
  if (input.endDate) params["courses[0][enddate]"] = String(input.endDate);
  const response = await moodleRequest<Array<{ id: number; shortname: string }>>(
    token,
    "core_course_create_courses",
    params
  );
  return response[0];
}

export async function adminUpdateCourse(
  token: string,
  input: UpdateCourseInput
): Promise<void> {
  const params: Record<string, string> = {
    "courses[0][id]": String(input.id),
  };
  if (input.fullname !== undefined) params["courses[0][fullname]"] = input.fullname;
  if (input.shortname !== undefined) params["courses[0][shortname]"] = input.shortname;
  if (input.summary !== undefined) params["courses[0][summary]"] = input.summary;
  if (input.visible !== undefined) params["courses[0][visible]"] = input.visible ? "1" : "0";
  if (input.startDate !== undefined) params["courses[0][startdate]"] = String(input.startDate);
  if (input.endDate !== undefined) params["courses[0][enddate]"] = String(input.endDate);
  await moodleRequest<unknown>(token, "core_course_update_courses", params);
}

export async function adminDeleteCourse(
  token: string,
  courseId: number
): Promise<void> {
  await moodleRequest<unknown>(token, "core_course_delete_courses", {
    "courseids[0]": String(courseId),
  });
}

// ─── Admin: Enrollment management ─────────────────────────────────────────────

export type EnrolledUserAdmin = {
  id: number;
  username?: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  pictureUrl?: string;
  roles: Array<{ roleId?: number; name: string; shortName?: string }>;
  lastAccess?: number;
};

export async function adminGetEnrolledUsers(
  token: string,
  courseId: number
): Promise<EnrolledUserAdmin[]> {
  type RawEnrolled = {
    id: number;
    username?: string;
    fullname?: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    profileimageurl?: string;
    roles?: Array<{ roleid?: number; name?: string; shortname?: string }>;
    lastaccess?: number;
  };
  const response = await moodleRequest<RawEnrolled[]>(
    token,
    "core_enrol_get_enrolled_users",
    { courseid: String(courseId) }
  );
  return (response ?? []).map((u) => ({
    id: u.id,
    username: u.username,
    fullName: u.fullname ?? `${u.firstname ?? ""} ${u.lastname ?? ""}`.trim(),
    firstName: u.firstname,
    lastName: u.lastname,
    email: u.email,
    pictureUrl: u.profileimageurl,
    roles: (u.roles ?? []).map((r) => ({
      roleId: r.roleid,
      name: r.name ?? "",
      shortName: r.shortname,
    })),
    lastAccess: u.lastaccess,
  }));
}

export async function adminEnrolUser(
  token: string,
  params: {
    userId: number;
    courseId: number;
    roleId?: number;
    timeStart?: number;
    timeEnd?: number;
  }
): Promise<void> {
  const p: Record<string, string> = {
    "enrolments[0][roleid]": String(params.roleId ?? 5),
    "enrolments[0][userid]": String(params.userId),
    "enrolments[0][courseid]": String(params.courseId),
  };
  if (params.timeStart) p["enrolments[0][timestart]"] = String(params.timeStart);
  if (params.timeEnd) p["enrolments[0][timeend]"] = String(params.timeEnd);
  await moodleRequest<unknown>(token, "enrol_manual_enrol_users", p);
}

export async function adminUnenrolUser(
  token: string,
  params: { userId: number; courseId: number }
): Promise<void> {
  await moodleRequest<unknown>(token, "enrol_manual_unenrol_users", {
    "enrolments[0][userid]": String(params.userId),
    "enrolments[0][courseid]": String(params.courseId),
  });
}

// ─── Admin: Cohort management ──────────────────────────────────────────────────

export async function adminGetCohorts(
  token: string,
  cohortIds?: number[]
): Promise<MoodleCohort[]> {
  const params: Record<string, string> = {};
  if (cohortIds && cohortIds.length > 0) {
    cohortIds.forEach((id, i) => {
      params[`cohortids[${i}]`] = String(id);
    });
  }
  const response = await moodleRequest<RawMoodleCohort[]>(
    token,
    "core_cohort_get_cohorts",
    params
  );
  return (response ?? []).map(normalizeCohort);
}

export async function adminCreateCohort(
  token: string,
  input: CreateCohortInput
): Promise<{ id: number; name: string }> {
  const params: Record<string, string> = {
    "cohorts[0][name]": input.name,
    "cohorts[0][contextlevel]": input.contextLevel ?? "system",
    "cohorts[0][instanceid]": String(input.instanceId ?? 0),
    "cohorts[0][visible]": input.visible === false ? "0" : "1",
  };
  if (input.idNumber) params["cohorts[0][idnumber]"] = input.idNumber;
  if (input.description) params["cohorts[0][description]"] = input.description;
  const response = await moodleRequest<Array<{ id: number; name: string }>>(
    token,
    "core_cohort_create_cohorts",
    params
  );
  return response[0];
}

export async function adminUpdateCohort(
  token: string,
  input: UpdateCohortInput
): Promise<void> {
  const params: Record<string, string> = {
    "cohorts[0][id]": String(input.id),
  };
  if (input.name !== undefined) params["cohorts[0][name]"] = input.name;
  if (input.idNumber !== undefined) params["cohorts[0][idnumber]"] = input.idNumber;
  if (input.description !== undefined) params["cohorts[0][description]"] = input.description;
  if (input.visible !== undefined) params["cohorts[0][visible]"] = input.visible ? "1" : "0";
  await moodleRequest<unknown>(token, "core_cohort_update_cohorts", params);
}

export async function adminDeleteCohort(
  token: string,
  cohortId: number
): Promise<void> {
  await moodleRequest<unknown>(token, "core_cohort_delete_cohorts", {
    "cohortids[0]": String(cohortId),
  });
}

export async function adminGetCohortMembers(
  token: string,
  cohortId: number
): Promise<number[]> {
  type RawCohortMembers = Array<{ cohortid: number; userids: number[] }>;
  const response = await moodleRequest<RawCohortMembers>(
    token,
    "core_cohort_get_cohort_members",
    { "cohortids[0]": String(cohortId) }
  );
  return response?.[0]?.userids ?? [];
}

export async function adminAddCohortMember(
  token: string,
  cohortId: number,
  userId: number
): Promise<void> {
  await moodleRequest<unknown>(token, "core_cohort_add_cohort_members", {
    "members[0][cohortid]": String(cohortId),
    "members[0][userid]": String(userId),
  });
}

export async function adminRemoveCohortMember(
  token: string,
  cohortId: number,
  userId: number
): Promise<void> {
  await moodleRequest<unknown>(token, "core_cohort_delete_cohort_members", {
    "members[0][cohortid]": String(cohortId),
    "members[0][userid]": String(userId),
  });
}

export async function requestPasswordReset(
  usernameOrEmail: string
): Promise<void> {
  const token = getServerMoodleToken();
  const param: Record<string, string> = usernameOrEmail.includes("@")
    ? { email: usernameOrEmail }
    : { username: usernameOrEmail };
  await moodleRequest<{ status: string; notice: string }>(
    token,
    "core_auth_request_password_reset",
    param
  );
}
