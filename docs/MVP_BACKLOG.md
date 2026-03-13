# Devcombine Engineering Portal - MVP Backlog

This backlog is the working source of truth for MVP scope. Keep it updated as requirements evolve.

Legend:
- P0: required for MVP
- P1: strongly desired, can slip
- P2: post-MVP / future enhancement

## P0 - Authentication and access control
Status: Complete (as of February 26, 2026)

- Admin flag:
  - `users.is_admin` defines admin users.
  - Enforce admin-only routes and admin-only fields.
- Signup flow:
  - Email/password signup creates user and verification token.
  - Sends verification email.
- Verify email:
  - Verification endpoint sets `emailVerified` and invalidates token.
- Login/logout:
  - Verified email required.
  - Logout clears session.
  - Role-based landing route after login:
    - Admin (`is_admin=true`) -> `/admin`
    - Engineer (`is_admin=false`) -> `/engineer`
  - Engineer onboarding gate:
    - `/engineer` serves onboarding wizard until complete.
    - `/engineer/account` blocked until `onboarding_completed=true`.
- Resend verification:
  - Only for unverified accounts.
- Secure error messaging:
  - No user enumeration.
  - 5xx shows generic "temporarily unavailable" message.

## P0 - Engineer experience
Status: Complete (as of February 26, 2026)

- Engineer home routing:
  - After login, route to `/engineer` first.
  - Completed onboarding routes engineer to `/engineer/account`.
- Required onboarding wizard:
  - Stateful multi-step flow persists progress.
  - Collects city, skills, availability, and upcoming holidays/time off.
- My Projects page:
  - Lists assigned projects and key metadata (name, client, start/end, status, team members).
  - Filters by ongoing projects based on status + dates.
  - Implemented in current build via `GET /api/projects` and the Engineer Account `Projects` sidebar panel.
- Profile page:
  - Engineer can edit: avatar, city, skills, availability, and time off/holidays.
  - Profile updates persist and are visible to admins.

## P0 - Admin experience
Status: Complete (as of February 26, 2026)

- Admin dashboard:
  - Quick counts: engineers, projects, engineers available.
- Engineer directory:
  - List with search/filter by skill, city, availability status.
  - Engineer detail includes:
    - Email, name, avatar, city, skills
    - Availability status + note + time off entries
    - Last login at + last login IP
    - Monthly salary (PHP) and salary notes
  - Implemented in current build via `/api/admin/engineers`, `/api/admin/engineers/[engineerId]`, and the `/admin` -> `Engineers` panel.
- Project management:
  - Create/edit/archive projects:
    - Name, client, status, start/end dates
    - Assign/unassign team members
    - Admin notes (admin-only)
  - Implemented in current build via `/api/projects`, `/api/projects/[projectId]`, and `/admin` dashboard workflows.

## P0 - Task management
Status: Complete (as of March 11, 2026)

- Objective:
  - Add project-scoped task management across engineer and admin dashboards.
  - Engineers need a `Tasks` section in the engineer side panel with task creation plus a filterable list.
  - Admins need a `Tasks` view in the admin dashboard that can be opened directly, from the Projects view, from a project card, or from the Engineers view to show tasks assigned to a selected engineer.
- Data model and schema:
  - Add Prisma `Task` model with logical task fields:
    - `id`
    - `project_id` (required)
    - `name`
    - `assignee` (`user_id` for now)
    - `assigned_by` (`user_id` for now)
    - `completed_at`
    - `completed_by` (`user_id` for now)
    - `completed` boolean
    - `due_on`
    - `notes`
    - `resource_type` with fixed value `task`
    - `parent` object in the API response
  - Add implementation fields required to support ownership and navigation:
    - `parent_task_id` nullable foreign key so a task can belong to another task while still remaining under a project
    - `created_by_user_id` so engineer ownership survives later admin reassignment
    - `created_at` and `updated_at`
  - Model relations:
    - `project_id -> projects.id`
    - `assignee -> users.id`
    - `assigned_by -> users.id`
    - `completed_by -> users.id`
    - `created_by_user_id -> users.id`
    - `parent_task_id -> tasks.id`
  - Parent shape:
    - If `parent_task_id` exists, `parent` resolves to the parent task summary.
    - Otherwise `parent` resolves to the project summary for `project_id`.
  - Add indexes for:
    - `project_id`
    - `assignee`
    - `created_by_user_id`
    - `completed`
    - `due_on`
    - `parent_task_id`
- Permissions and business rules:
  - Admin:
    - Full CRUD on all tasks.
    - Can create tasks for themselves or for engineers.
    - Can assign and reassign tasks to engineers.
    - Can complete/uncomplete tasks on behalf of an engineer.
  - Engineer:
    - Can create tasks only for themselves.
    - Can read/update/delete tasks when they are either the creator or the current assignee.
    - Cannot assign tasks to another user; only admins can assign or reassign tasks to someone else.
  - Task membership rules:
    - `project_id` is required for MVP so every task belongs to a project.
    - Engineers can only create tasks for projects they are assigned to.
    - Admin task assignment should be limited to engineers who are assigned to that project.
  - Completion rules:
    - Setting `completed=true` stamps `completed_at=now()` and `completed_by=session.user.id`.
    - Setting `completed=false` clears `completed_at` and `completed_by`.
  - Assignment rules:
    - `assigned_by` is always written by the server.
    - Engineer-created tasks set both `assignee` and `assigned_by` to `session.user.id`.
    - Admin reassignment updates `assigned_by` to the acting admin user.
  - Resource rules:
    - `resource_type` is always `task`.
    - `resource_type` is not user-editable.
- API and shared server work:
  - Add shared task helpers following the `app/api/projects/shared.js` pattern for:
    - date parsing
    - filter parsing
    - permission checks
    - parent summary formatting
    - task DTO formatting
  - Add `app/api/tasks/route.js`:
    - `GET` returns tasks visible to the current user.
    - `POST` creates a task within role and project-membership rules.
  - Add `app/api/tasks/[taskId]/route.js`:
    - `GET` returns a single visible task.
    - `PATCH` updates allowed fields for the current user.
    - `DELETE` removes a task when the current user is allowed to manage it.
  - Supported task filters for MVP:
    - `projectId`
    - `assigneeId`
    - `createdBy`
    - `completed`
    - `due`
    - `q` for task name search
    - `parentTaskId`
  - Task responses should return the required task fields above and may include hydrated summaries for `project`, `assigneeUser`, `assignedByUser`, `completedByUser`, and `createdByUser` to support list rendering without extra queries.
- Engineer UI requirements:
  - Add `Tasks` to `app/components/engineer-account/account-navigation.js`.
  - Extend `app/components/engineer-account/index.js` to load tasks alongside profile and projects data.
  - Add an engineer `TasksPanel` with:
    - create-task form
    - filter controls
    - list of tasks where the engineer is creator or assignee
  - Engineer task filters for MVP:
    - project
    - completion (`open`, `completed`, `all`)
    - due bucket (`overdue`, `due today`, `upcoming`, `no due date`, `all`)
    - search by task name
  - Add project-context entry points so an engineer can open the Tasks panel from the existing Projects panel with `projectId` preselected in the task form and filter state.
- Admin UI requirements:
  - Add `Tasks` to `app/components/admin-dashboard/shared/constants.js` navigation.
  - Add `app/components/admin-dashboard/panels/tasks-panel.js`.
  - Add shared admin task UI pieces similar to current project management components:
    - `app/components/admin/task-form.js`
    - `app/components/admin/task-list.js`
  - Admin task form fields:
    - project
    - name
    - assignee
    - due date
    - notes
    - parent task
    - completed toggle
  - Admin task list filters for MVP:
    - project
    - assignee
    - completion
    - due bucket
    - task name search
  - Required admin entry points:
    - dashboard navigation item for `Tasks`
    - Projects panel action to open the Tasks panel
    - project-card action to open Tasks filtered by that project
    - engineer-card action to open Tasks filtered by assignee
  - Add state helpers in `app/components/admin-dashboard/index.js` so project and engineer entry points can switch to the Tasks panel with the correct filters already applied.
- Audit and operational requirements:
  - Extend admin audit logging for admin-originated task mutations.
  - Add audit actions for:
    - `task.created`
    - `task.updated`
    - `task.deleted`
    - `task.assigned`
    - `task.completed`
  - Audit metadata should capture:
    - task id and name
    - project id and project name
    - old/new assignee
    - completion metadata changes
- Implementation sequence:
  1. Add Prisma `Task` model, enums, relations, indexes, and migration.
  2. Add shared task validators, DTO mappers, and permission helpers.
  3. Implement `GET/POST /api/tasks` and `GET/PATCH/DELETE /api/tasks/[taskId]`.
  4. Add engineer `Tasks` navigation, panel, create flow, and task filters.
  5. Add admin `Tasks` panel, admin task form/list, and project/engineer deep-link flows.
  6. Add admin audit hooks for task mutations.
  7. Add regression coverage across API, access control, UI behavior, and safe error handling.
- Required test coverage:
  - Integration:
    - access-control tests for admin vs engineer task permissions
    - task form persistence tests for create and edit flows
    - safe-error tests for task list and task mutation routes
  - UI behavior:
    - engineer Tasks panel render/filter/create behavior
    - admin Tasks panel render/filter/create behavior
    - project-card to Tasks-panel linking
    - engineer-card to Tasks-panel linking
- MVP acceptance criteria:
  - Engineers see a `Tasks` section in the engineer side panel after onboarding.
  - Engineers can create self-assigned tasks for projects they belong to.
  - Engineers can update, complete, uncomplete, and delete tasks when they created the task or are the current assignee.
  - Engineers cannot assign tasks to another user.
  - Admins can create tasks, assign tasks to engineers, reassign tasks, and manage all tasks from a dedicated admin Tasks view.
  - Admins can open the Tasks view from the admin navigation, from the Projects view, from a project card, and from the Engineers view to see tasks filtered to a selected engineer.
  - Task payloads include the requested fields plus the derived `parent` object.
  - `parent` resolves to either the parent task or the owning project for top-level tasks.
  - Implemented in current build via Prisma `Task`, `/api/tasks`, `/api/tasks/[taskId]`, engineer `Tasks` panel, admin `Tasks` panel, and related integration/UI coverage.

## P1 - Quality and operational hardening
Status: Complete (as of February 26, 2026)

- Audit log (admin edits):
  - Record salary and staffing/project changes (who, what, when).
  - Implemented in current build via `AdminAuditLog`, write hooks in admin mutation routes, `/api/admin/audit-logs`, and `/admin` -> `Audit log` panel.
- Import/export:
  - CSV export for engineer list and projects.
  - Implemented in current build via `/api/admin/export/engineers`, `/api/admin/export/projects`, and `/admin` export actions in `Engineers`/`Projects` panels.

## P2 - Future enhancements

- Avatar cloud storage:
  - Status: Complete (as of February 26, 2026).
  - Move avatar hosting from PostgreSQL `Bytes` column to S3 or equivalent cloud blob storage (e.g. cloudinary, AWS S3, Cloudflare R2, Supabase Storage).
  - Store a URL reference on the `User` record instead of raw bytes.
  - Update upload (signup, profile) and read paths (admin engineer list, engineer account) accordingly.
- Mobile UI redesign:
  - Status: Complete (as of March 11, 2026).
  - Redesign the site's appearance for mobile screens across authentication, onboarding, engineer, and admin views.
  - Apply UI/UX best practices for mobile using MUI responsive design patterns (breakpoints, touch targets, spacing, typography scale, and navigation).
  - Use this guidance as a design reference: https://medium.com/@WebdesignerDepot/essential-tips-for-converting-a-desktop-site-to-mobile-3686c35a7364
  - Phases:
    - Phase 1: Engineer dashboard shell mobile redesign (layout, navigation, global spacing/typography), using mobile UX do/don't guidance from https://medium.com/@pepper_square/mobile-ux-design-dos-donts-b68a4a990d5b (excluding accessibility-specific guidance).
    - Phase 2: Engineer panel-by-panel mobile redesign (Personal panel, Projects panel, and any additional engineer subviews), continuing the same https://medium.com/@pepper_square/mobile-ux-design-dos-donts-b68a4a990d5b guidance (excluding accessibility-specific guidance).
    - Phase 3: Admin dashboard shell mobile redesign (layout, navigation drawer/menu behavior, overview cards responsiveness).
    - Phase 4: Admin panel-by-panel mobile redesign (Dashboard, Engineers, Personal, Projects, Audit, and related admin subviews).

## P0 - Admin calendar view
Status: Planned

- Objective:
  - Finish MVP with a unified admin calendar panel before dockerization / production hardening begins.
  - Add a `Calendar` panel to the existing `/admin` dashboard rather than creating a separate route.
  - Surface two operational event types in one view:
    - engineer upcoming holidays / time off from `users.upcoming_holidays`
    - project milestones from `projects.start_date` and `projects.end_date`
- Scope constraints for MVP:
  - Read-only calendar for MVP. Editing continues through existing `Personal information` and `Projects` panels.
  - Desktop-first dense admin view, but must preserve the completed mobile admin redesign patterns.
  - No new database tables required for MVP.
  - Use CalendarJS only: `@calendarjs/ce` with React bindings from `@calendarjs/ce/dist/react` and the packaged stylesheet from `@calendarjs/ce/dist/style.css`.
  - Do not add any other calendar/date UI dependencies for this feature.
  - Do not expand scope to task due dates, staffing allocations, drag-and-drop scheduling, or external calendar sync.
- Existing data sources already available:
  - `/api/admin/engineers` already returns `id`, engineer identity fields, `availabilityStatus`, and `upcomingHolidays`.
  - `/api/projects` already returns admin-visible project metadata including `id`, `name`, `startDate`, `endDate`, `status`, and team members.
  - The current admin dashboard already loads both datasets on first render, so MVP can derive calendar events client-side without a new API.
- CalendarJS implementation constraints from official docs:
  - Install from a single package: `npm install @calendarjs/ce`.
  - React usage should import from `@calendarjs/ce/dist/react`.
  - `Schedule` documents `type` values `day`, `week`, and `weekdays`; it does not document a month scheduler view.
  - `Calendar` supports inline month-style rendering, date navigation, and per-date event markers via its `data` prop.
  - `Helpers` is available from the same package for date formatting/parsing when useful, so no extra date helper package should be introduced.
- UX requirements:
  - Add `Calendar` to the admin dashboard navigation between `Projects` and `Tasks`.
  - Support `month` and `week` views using CalendarJS components only:
    - month view = CalendarJS `Calendar` in inline mode
    - week view = CalendarJS `Schedule` with `type=\"week\"`
  - Include quick filters for:
    - event type: `all` | `time_off` | `project_milestone`
    - engineer: `all` + engineer list
    - project: `all` + project list
  - Event presentation:
    - month view should show date-level markers and a compact selected-date summary list beside or below the calendar
    - week view should show titled schedule entries for the selected week
    - time off entries show engineer name + holiday label
    - project events show project name + `Start` or `End`
    - color treatment distinguishes time off from project milestones while staying within the current light-theme admin system
  - Interaction:
    - month and week views should share the same selected date / visible period state
    - clicking a time-off event should switch to the `Engineers` panel with that engineer highlighted/filtered
    - clicking a project event should switch to the `Projects` panel with that project ready for review/edit
  - Empty/error states:
    - clear empty state when no events match active filters
    - non-blocking error state if event derivation fails on malformed dates
- Technical implementation plan:
  - Phase 1: dependency and panel scaffold
    - add `@calendarjs/ce` only
    - import CalendarJS React components from `@calendarjs/ce/dist/react`
    - import the packaged stylesheet from `@calendarjs/ce/dist/style.css`
    - create `app/components/admin-dashboard/panels/calendar-panel.js`
    - register the panel in `app/components/admin-dashboard/shared/constants.js`, navigation, and `AdminDashboard`
  - Phase 2: event normalization helpers
    - add a shared mapper that converts engineer holiday JSON and project dates into two CalendarJS-ready datasets:
      - month marker data for `Calendar`
      - week schedule event data for `Schedule`
    - normalize a canonical internal event shape first, including:
      - `id`
      - `type` (`time_off` or `project_milestone`)
      - `title`
      - `start`
      - `end`
      - `allDay`
      - `engineerId` (nullable)
      - `projectId` (nullable)
      - `meta` for label/status/details
    - map canonical events into:
      - `Calendar` marker records keyed by date for month rendering
      - `Schedule` event objects with `guid`, `title`, `date`, `start`, `end`, `color`, and `readonly`
    - represent all-day operational events in week view using a consistent time block convention documented in code, since `Schedule` expects time-based events
    - validate date parsing defensively and skip malformed records instead of breaking the panel
  - Phase 3: filtering and interactions
    - add admin dashboard state for:
      - calendar view mode (`month` or `week`)
      - selected date
      - calendar filters
    - derive filtered canonical events with `useMemo` from already-loaded `engineers` and `projects`
    - derive CalendarJS component props from the canonical events without additional libraries
    - wire event click handlers back into existing dashboard actions for engineer/project drill-in
  - Phase 4: visual integration and responsive tuning
    - style the calendar shell with the same MUI card/surface language used in other admin panels
    - ensure the toolbar, filters, month calendar, selected-date event summary, and week schedule remain usable on mobile without undoing the completed redesign
    - keep month/week switching obvious and low-friction
    - avoid fighting CalendarJS internals; prefer wrapping and theming its provided output rather than layering custom calendar mechanics on top
  - Phase 5: test coverage
    - unit tests for event normalization and filter behavior
    - UI behavior tests for navigation visibility, empty states, and event click drill-ins
    - regression coverage that the admin dashboard still renders when one source contains invalid/missing dates
- Recommended file targets:
  - `app/components/admin-dashboard/index.js`
  - `app/components/admin-dashboard/shared/constants.js`
  - `app/components/admin-dashboard/shared/navigation.js`
  - `app/components/admin-dashboard/panels/calendar-panel.js`
  - `app/components/admin-dashboard/shared/calendar-events.js` (new)
  - `tests/ui/admin-dashboard/calendar-panel.behavior.test.js` (new)
  - `tests/ui/admin-dashboard/calendar-events.test.js` (new)
- Acceptance criteria:
  - Admin navigation includes a `Calendar` panel.
  - Admin can switch between a CalendarJS month view and a CalendarJS week view.
  - Calendar shows engineer time off and project start/end events in one unified view.
  - Admin can filter calendar results by engineer and by project.
  - Clicking an event routes the admin into the relevant existing workflow context inside the dashboard.
  - Invalid or incomplete source dates do not crash the admin dashboard.
  - Mobile admin layout remains functional after adding the new panel.
  - The feature ships using `@calendarjs/ce` only, with no additional calendar/date UI dependency added for the admin calendar.
