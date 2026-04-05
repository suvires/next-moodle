# Student Functionality Gap Report

Audit date: 2026-04-05

Source inputs:
- Repo implementation in `app/`, `app/actions/`, and `lib/moodle.ts`
- Moodle function inventory from `/Users/suvi/Downloads/moodle_funciones_por_dominio.xlsx`

## Summary

The app already covers a broad student surface:
- Course discovery and navigation
- Course detail and module routing
- Forums, messages, notifications, profile, settings, files
- Grades, calendar, competencies, badges, blog, groups
- Read access for many Moodle activity types

The main gaps are not "missing domains", but incomplete student workflows inside already-present domains. The biggest missing capabilities are full quiz taking, assignment final submission flow, interactive lessons, full feedback completion, editable wiki, participatory database activity, richer workshop flow, advanced forum controls, and richer messaging/calendar UX.

The Excel file is not reliable as an implementation tracker for this repo. It marks 735 functions as `Implementado`, but the repo actively uses a much smaller subset. The useful comparison is:

`selected Moodle APIs in Excel` minus `functions actually used by this app`

## Current Coverage

Implemented student-facing pages and flows observed in the repo:

- Global areas:
  - `app/mis-cursos/page.tsx`
  - `app/catalogo/page.tsx`
  - `app/buscar/page.tsx`
  - `app/calendario/page.tsx`
  - `app/mensajes/page.tsx`
  - `app/mensajes/[conversationId]/page.tsx`
  - `app/notificaciones/page.tsx`
  - `app/perfil/page.tsx`
  - `app/ajustes/page.tsx`
  - `app/archivos/page.tsx`
  - `app/contactos/page.tsx`
  - `app/blog/page.tsx`

- Course-level areas:
  - `app/mis-cursos/[courseId]/page.tsx`
  - `app/mis-cursos/[courseId]/calificaciones/page.tsx`
  - `app/mis-cursos/[courseId]/competencias/page.tsx`
  - `app/mis-cursos/[courseId]/tareas/page.tsx`

- Activity detail pages already present:
  - Assignment
  - Quiz
  - Book
  - Glossary
  - Wiki
  - Choice
  - Feedback
  - Lesson
  - Database
  - Workshop
  - Chat
  - LTI
  - H5P
  - Survey
  - SCORM
  - Forum discussion and replies

- Student actions already implemented:
  - Forum discussion creation and replies
  - Choice voting
  - Assignment submission saving
  - Message sending
  - Mark message read
  - Mark all notifications as read
  - Preferences update
  - Self enrolment
  - Course favourite toggle
  - Manual completion update

## High-Priority Gaps

These are the missing student capabilities with the highest product value.

| Priority | Capability gap | Why it is still missing in the app | Relevant Moodle functions from the Excel |
| --- | --- | --- | --- |
| P1 | Full quiz attempt flow | The quiz page is still informational and history-oriented. It does not let the student start, answer, save, submit, or review a complete attempt. | `mod_quiz_get_quiz_access_information`, `mod_quiz_get_attempt_access_information`, `mod_quiz_start_attempt`, `mod_quiz_get_attempt_data`, `mod_quiz_save_attempt`, `mod_quiz_process_attempt`, `mod_quiz_get_attempt_review`, `mod_quiz_get_user_best_grade`, `mod_quiz_view_quiz`, `mod_quiz_view_attempt`, `mod_quiz_view_attempt_review`, `mod_quiz_view_attempt_summary` |
| P1 | Assignment final submission flow | The assignment page loads status and allows saving content, but it does not cover explicit "start", "submit for grading", or richer attempt lifecycle. | `mod_assign_start_submission`, `mod_assign_submit_for_grading`, `mod_assign_copy_previous_attempt`, `mod_assign_view_submission_status`, `mod_assign_view_assign`, `mod_assign_get_submissions`, `mod_assign_get_grades` |
| P1 | Interactive lesson completion | The lesson area exists, but there is no complete lesson runtime for navigating pages, answering questions, launching attempts, and finishing attempts. | `mod_lesson_get_lesson`, `mod_lesson_get_lesson_access_information`, `mod_lesson_get_pages`, `mod_lesson_get_page_data`, `mod_lesson_launch_attempt`, `mod_lesson_process_page`, `mod_lesson_finish_attempt`, `mod_lesson_get_user_attempt`, `mod_lesson_get_user_grade` |
| P1 | Feedback completion flow | Feedback pages can read structure, but the student flow to launch, navigate pages, and submit answers is incomplete. | `mod_feedback_get_feedback_access_information`, `mod_feedback_launch_feedback`, `mod_feedback_get_page_items`, `mod_feedback_process_page`, `mod_feedback_view_feedback` |
| P1 | Wiki editing | Wiki is read-only from the app perspective. There is no edit, create page, or authoring flow for students. | `mod_wiki_get_page_for_editing`, `mod_wiki_edit_page`, `mod_wiki_new_page`, `mod_wiki_view_page`, `mod_wiki_view_wiki`, `mod_wiki_get_subwiki_files` |
| P1 | Database activity participation | Database activities are not usable as collaborative student activities yet. The app lacks create, update, delete, search, and field-aware entry flows. | `mod_data_get_fields`, `mod_data_get_entry`, `mod_data_search_entries`, `mod_data_add_entry`, `mod_data_update_entry`, `mod_data_delete_entry`, `mod_data_view_database`, `mod_data_get_data_access_information` |
| P1 | Workshop full student lifecycle | Workshop exists, but not the full student journey of submission, assessment, grades, and plan/status. | `mod_workshop_get_workshop_access_information`, `mod_workshop_get_user_plan`, `mod_workshop_add_submission`, `mod_workshop_update_submission`, `mod_workshop_delete_submission`, `mod_workshop_get_assessment`, `mod_workshop_update_assessment`, `mod_workshop_get_grades`, `mod_workshop_view_submission`, `mod_workshop_view_workshop` |
| P2 | Advanced forum controls | Forums are good enough for posting, but students cannot edit/delete their posts, manage subscription/tracking, or use favourite/subscription controls. | `mod_forum_update_discussion_post`, `mod_forum_delete_post`, `mod_forum_set_forum_subscription`, `mod_forum_set_subscription_state`, `mod_forum_set_forum_tracking`, `mod_forum_toggle_favourite_state`, `mod_forum_view_forum`, `mod_forum_view_forum_discussion` |
| P2 | Rich messaging UX | The app supports basic direct messaging, but lacks contact requests, conversation metadata, notification preferences, favourites/mute, and richer unread handling. | `core_message_get_conversation`, `core_message_get_conversation_members`, `core_message_send_messages_to_conversation`, `core_message_get_unread_conversation_counts`, `core_message_get_unread_notification_count`, `core_message_mark_all_conversation_messages_as_read`, `core_message_mark_notification_read`, `core_message_search_contacts`, `core_message_get_contact_requests`, `core_message_create_contact_request`, `core_message_confirm_contact_request`, `core_message_get_user_message_preferences`, `core_message_get_user_notification_preferences`, `core_message_set_favourite_conversations` |
| P2 | Calendar with full student actions | The calendar page already reads upcoming and monthly data, but students cannot inspect event details, fetch richer filtered events, or create/manage personal events. | `core_calendar_get_calendar_events`, `core_calendar_get_calendar_event_by_id`, `core_calendar_get_action_events_by_course`, `core_calendar_get_action_events_by_courses`, `core_calendar_get_action_events_by_timesort`, `core_calendar_create_calendar_events`, `core_calendar_delete_calendar_events`, `core_calendar_update_event_start_day`, `core_calendar_get_calendar_access_information` |

## Medium-Priority Gaps

These would improve student experience, but they are below the workflow blockers above.

- Dashboard enrichment:
  - `block_recentlyaccesseditems_get_recent_items`
  - `block_starredcourses_get_starred_courses`
  - `core_course_get_enrolled_courses_by_timeline_classification`
  - `core_course_get_enrolled_courses_with_action_events_by_timeline_classification`

- Course progress and completion:
  - `core_completion_get_course_completion_status`
  - `core_completion_mark_course_self_completed`

- File upload infrastructure for richer student submissions:
  - `core_files_get_unused_draft_itemid`
  - `core_files_upload`
  - `core_files_delete_draft_files`

- Glossary richer exploration and authoring:
  - `mod_glossary_get_entry_by_id`
  - `mod_glossary_get_entries_by_search`
  - `mod_glossary_get_entries_by_term`
  - `mod_glossary_add_entry`
  - `mod_glossary_update_entry`
  - `mod_glossary_view_entry`
  - `mod_glossary_view_glossary`

- H5P richer result and access handling:
  - `mod_h5pactivity_get_results`
  - `mod_h5pactivity_get_h5pactivity_access_information`
  - `mod_h5pactivity_view_h5pactivity`

- Comments and lightweight collaboration:
  - `core_comment_get_comments`
  - `core_comment_add_comments`
  - `core_comment_delete_comments`

- Notes full lifecycle:
  - `core_notes_create_notes`
  - `core_notes_update_notes`
  - `core_notes_delete_notes`
  - `core_notes_view_notes`

- Better grade report fidelity:
  - `gradereport_user_get_access_information`
  - `gradereport_user_get_grades_table`
  - `gradereport_user_view_grade_report`

## Low-Priority or Usually Out of Student Scope

These appear in the Excel but should not be treated as missing student functionality by default:

- Admin-only or teacher-only APIs:
  - `core_admin_*`
  - most `core_cohort_*`
  - most `core_role_*`
  - course/category create/update/delete APIs
  - grader/gradingform APIs
  - qbank APIs
  - bulk enrolment/admin APIs
  - most LTI management APIs
  - workshop grading/teacher-side operations

- System/plugin operations:
  - backup, dataprivacy admin, LP admin, user tours instrumentation, policy admin

- Optional plugin-specific features:
  - AI placement/editor
  - certificates
  - BigBlueButton
  - SEB
  - Moodlenet

These may matter later, but they should not drive the first student backlog.

## Evidence Notes

- Quiz remains read-only in the student experience. The current quiz page loads quiz metadata and attempts but does not start or process attempts.
- Assignment supports draft-like content saving, but not an explicit end-to-end final submission lifecycle.
- Messaging is stronger than the original plan assumed: the app already has conversation list, conversation detail, sending, and mark-read. The missing work is the richer surrounding UX and preferences, not basic messaging itself.
- Calendar is also stronger than a simple list. The missing work is event detail, action events, and personal event management.

## Recommended Delivery Order

1. Full quiz runtime
2. Assignment final submission lifecycle
3. Interactive lesson runtime
4. Feedback completion flow
5. Wiki editing
6. Workshop student lifecycle
7. Database activity participation
8. Forum advanced controls
9. Messaging enhancements
10. Calendar enhancements

## Implementation Rule for Future Work

Whenever a new Moodle service function is used:
- mention it explicitly in implementation notes
- add it to `functions.md`

