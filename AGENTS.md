<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# UI stack

Use Tailwind CSS and Radix UI for the entire interface layer. Prefer shared UI primitives/components built on Radix over ad hoc HTML-only controls when implementing or revising the frontend.

Use `boneyard-js` for all page-level skeleton/loading states. Any page or route segment with loading UI should render its skeletons through that library rather than custom placeholders.

# Moodle service functions

Every time a new Moodle service function is used, you must explicitly tell the user which function was introduced.

Each newly used Moodle service function must also be documented in `functions.md`.
<!-- END:nextjs-agent-rules -->
