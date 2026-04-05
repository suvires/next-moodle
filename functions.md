# Moodle Service Functions

This file tracks each Moodle service function used in the codebase.

When a new Moodle service function is used:
- mention it explicitly to the user
- add it to this file

## Current functions in use

| Function | Internal wrapper | Location |
| --- | --- | --- |
| `core_webservice_get_site_info` | `authenticateWithMoodle` | `lib/moodle.ts` |
| `core_webservice_get_site_info` | `getSiteInfo` | `lib/moodle.ts` |
| `core_enrol_get_users_courses` | `getUserCourses` | `lib/moodle.ts` |
| `core_enrol_get_enrolled_users` | `getCourseUserRoleAssignments` | `lib/moodle.ts` |
| `core_user_get_course_user_profiles` | `getCourseUserRoleAssignmentsFromProfile` | `lib/moodle.ts` |
| `core_course_get_user_administration_options` | `getUserAdministrationOptions` | `lib/moodle.ts` |
| `core_course_get_user_navigation_options` | `getUserNavigationOptions` | `lib/moodle.ts` |
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
| `core_completion_get_activities_completion_status` | `getActivitiesCompletionStatus` | `lib/moodle.ts` |
| `gradereport_user_get_grade_items` | `getGradeItems` | `lib/moodle.ts` |
| `gradereport_overview_get_course_grades` | `getCourseGrades` | `lib/moodle.ts` |
| `core_calendar_get_calendar_upcoming_view` | `getUpcomingEvents` | `lib/moodle.ts` |
| `core_calendar_get_calendar_monthly_view` | `getMonthlyView` | `lib/moodle.ts` |
| `mod_assign_get_assignments` | `getAssignments` | `lib/moodle.ts` |
| `mod_assign_get_submission_status` | `getSubmissionStatus` | `lib/moodle.ts` |
| `core_message_get_conversations` | `getConversations` | `lib/moodle.ts` |
| `core_message_get_conversation_messages` | `getConversationMessages` | `lib/moodle.ts` |
| `core_message_send_instant_messages` | `sendMessage` | `lib/moodle.ts` |
| `core_message_get_unread_conversations_count` | `getUnreadConversationsCount` | `lib/moodle.ts` |
| `mod_quiz_get_quizzes_by_courses` | `getQuizzesByCourses` | `lib/moodle.ts` |
| `mod_quiz_view_quiz` | `viewQuiz` | `lib/moodle.ts` |
| `mod_quiz_get_quiz_access_information` | `getQuizAccessInformation` | `lib/moodle.ts` |
| `mod_quiz_get_user_quiz_attempts` | `getQuizUserAttempts` | `lib/moodle.ts` |
| `mod_quiz_start_attempt` | `startQuizAttempt` | `lib/moodle.ts` |
| `mod_quiz_view_attempt` | `viewQuizAttempt` | `lib/moodle.ts` |
| `mod_quiz_get_attempt_data` | `getQuizAttemptData` | `lib/moodle.ts` |
| `mod_quiz_save_attempt` | `saveQuizAttempt` | `lib/moodle.ts` |
| `mod_quiz_process_attempt` | `processQuizAttempt` | `lib/moodle.ts` |
| `mod_quiz_view_attempt_summary` | `viewQuizAttemptSummary` | `lib/moodle.ts` |
| `mod_quiz_get_attempt_summary` | `getQuizAttemptSummary` | `lib/moodle.ts` |
| `mod_quiz_get_attempt_review` | `getQuizAttemptReview` | `lib/moodle.ts` |
| `mod_quiz_view_attempt_review` | `viewQuizAttemptReview` | `lib/moodle.ts` |
| `mod_folder_get_folders_by_courses` | `getFoldersByCourses` | `lib/moodle.ts` |
| `mod_page_get_pages_by_courses` | `getPagesByCourses` | `lib/moodle.ts` |
| `core_badges_get_user_badges` | `getUserBadges` | `lib/moodle.ts` |
| `core_competency_list_course_competencies` | `getCoursCompetencies` | `lib/moodle.ts` |
| `core_competency_get_user_competency_in_course` | `getUserCompetencyInCourse` | `lib/moodle.ts` |
| `core_blog_get_entries` | `getBlogEntries` | `lib/moodle.ts` |
| `mod_book_get_books_by_courses` | `getBooksByCourses` | `lib/moodle.ts` |
| `mod_glossary_get_glossaries_by_courses` | `getGlossariesByCourses` | `lib/moodle.ts` |
| `mod_glossary_get_entries_by_letter` | `getGlossaryEntries` | `lib/moodle.ts` |
| `mod_wiki_get_wikis_by_courses` | `getWikisByCourses` | `lib/moodle.ts` |
| `mod_wiki_get_subwiki_pages` | `getWikiSubwikiPages` | `lib/moodle.ts` |
| `mod_wiki_get_page_contents` | `getWikiPageContents` | `lib/moodle.ts` |
| `mod_choice_get_choices_by_courses` | `getChoicesByCourses` | `lib/moodle.ts` |
| `mod_choice_get_choice_results` | `getChoiceResults` | `lib/moodle.ts` |
| `mod_choice_submit_choice_response` | `submitChoiceResponse` | `lib/moodle.ts` |
| `mod_feedback_get_feedbacks_by_courses` | `getFeedbacksByCourses` | `lib/moodle.ts` |
| `mod_feedback_get_items` | `getFeedbackItems` | `lib/moodle.ts` |
| `mod_lesson_get_lessons_by_courses` | `getLessonsByCourses` | `lib/moodle.ts` |
| `mod_data_get_databases_by_courses` | `getDatabasesByCourses` | `lib/moodle.ts` |
| `mod_data_get_entries` | `getDatabaseEntries` | `lib/moodle.ts` |
| `mod_workshop_get_workshops_by_courses` | `getWorkshopsByCourses` | `lib/moodle.ts` |
| `mod_workshop_get_submissions` | `getWorkshopSubmissions` | `lib/moodle.ts` |
| `mod_chat_get_chats_by_courses` | `getChatsByCourses` | `lib/moodle.ts` |
| `mod_lti_get_ltis_by_courses` | `getLtisByCourses` | `lib/moodle.ts` |
| `mod_lti_get_tool_launch_data` | `getLtiLaunchData` | `lib/moodle.ts` |
| `mod_h5p_get_h5pactivities_by_courses` | `getH5PActivitiesByCourses` | `lib/moodle.ts` |
| `mod_h5p_get_h5pactivity_attempts` | `getH5PAttempts` | `lib/moodle.ts` |
| `core_notes_get_course_notes` | `getCourseNotes` | `lib/moodle.ts` |
| `core_group_get_course_user_groups` | `getCourseUserGroups` | `lib/moodle.ts` |
| `core_search_get_results` | `searchGlobal` | `lib/moodle.ts` |
| `message_popup_get_popup_notifications` | `getNotifications` | `lib/moodle.ts` |
| `message_popup_get_unread_popup_notification_count` | `getUnreadNotificationCount` | `lib/moodle.ts` |
| `core_course_search_courses` | `searchCourses` | `lib/moodle.ts` |
| `enrol_self_enrol_user` | `selfEnrolUser` | `lib/moodle.ts` |
| `core_course_get_recent_courses` | `getRecentCourses` | `lib/moodle.ts` |
| `core_course_set_favourite_courses` | `setCourseFavourite` | `lib/moodle.ts` |
| `core_user_get_users_by_field` | `getUserProfile` | `lib/moodle.ts` |
| `core_files_get_files` | `getPrivateFiles` | `lib/moodle.ts` |
| `core_tag_get_tagindex` | `getTagIndex` | `lib/moodle.ts` |
| `core_user_get_user_preferences` | `getUserPreferences` | `lib/moodle.ts` |
| `core_user_set_user_preferences` | `setUserPreferences` | `lib/moodle.ts` |
| `core_user_update_picture` | `updateUserPicture` | `lib/moodle.ts` |
| `mod_assign_save_submission` | `saveAssignmentSubmission` | `lib/moodle.ts` |
| `core_course_get_updates_since` | `getCourseUpdatesSince` | `lib/moodle.ts` |
| `message_popup_mark_all_notifications_as_read` | `markAllNotificationsAsRead` | `lib/moodle.ts` |
| `core_message_mark_message_read` | `markMessageRead` | `lib/moodle.ts` |
| `mod_survey_get_surveys_by_courses` | `getSurveysByCourses` | `lib/moodle.ts` |
| `mod_survey_get_questions` | `getSurveyQuestions` | `lib/moodle.ts` |
| `core_message_get_contacts` | `getContacts` | `lib/moodle.ts` |
| `core_message_create_contacts` | `addContact` | `lib/moodle.ts` |
