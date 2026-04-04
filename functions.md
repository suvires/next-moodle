# Moodle Service Functions

This file tracks each Moodle service function used in the codebase.

When a new Moodle service function is used:
- mention it explicitly to the user
- add it to this file

## Current functions in use

| Function | Internal wrapper | Location |
| --- | --- | --- |
| `core_webservice_get_site_info` | `authenticateWithMoodle` | `lib/moodle.ts` |
| `core_enrol_get_users_courses` | `getUserCourses` | `lib/moodle.ts` |
| `mod_forum_get_forums_by_courses` | `getForumsByCourses` | `lib/moodle.ts` |
| `core_user_get_users_by_field` | `getUsersById` | `lib/moodle.ts` |
| `mod_url_get_urls_by_courses` | `getUrlsByCourses` | `lib/moodle.ts` |
| `mod_forum_get_forum_access_information` | `getForumAccessInformation` | `lib/moodle.ts` |
| `mod_forum_can_add_discussion` | `canAddForumDiscussion` | `lib/moodle.ts` |
| `mod_forum_get_forum_discussions` | `getForumDiscussions` | `lib/moodle.ts` |
| `mod_forum_get_discussion_posts` | `getDiscussionPosts` | `lib/moodle.ts` |
| `mod_forum_add_discussion` | `addForumDiscussion` | `lib/moodle.ts` |
| `mod_forum_add_discussion_post` | `addForumReply` | `lib/moodle.ts` |
| `core_course_get_contents` | `getCourseContents` | `lib/moodle.ts` |
| `tool_mobile_get_public_config` | `fetchBrandingViaRest` | `lib/moodle-brand.ts` |
