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

type SiteInfoResponse = RawMoodleError & {
  userid?: number;
  username?: string;
  fullname?: string;
  userpictureurl?: string;
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
