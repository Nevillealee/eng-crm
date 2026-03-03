# Devcombine Engineering Portal - MVP Backlog

This backlog is the working source of truth for MVP scope. Keep it updated as requirements evolve.

Legend:
- P0: required for MVP
- P1: strongly desired, can slip

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
Status: Planned

- Objective:
  - Add project-scoped task management across engineer and admin dashboards.
  - Engineers need a `Tasks` section in the engineer side panel with task creation plus a filterable list.
  - Admins need a `Tasks` view in the admin dashboard that can be opened directly, from the Projects view, from a project card, or from the Engineers view to show tasks assigned to a selected engineer.
- Data model and schema:
  - Add Prisma enums:
    - `TaskApprovalStatus`: `pending` | `approved` | `rejected`
  - Add Prisma `Task` model with logical task fields:
    - `id`
    - `project_id` (required)
    - `name`
    - `assignee` (`user_id` for now)
    - `assigned_by` (`user_id` for now)
    - `completed_at`
    - `completed_by` (`user_id` for now)
    - `completed` boolean
    - `approval_status`
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
    - `approval_status`
    - `completed`
    - `due_on`
    - `parent_task_id`
- Permissions and business rules:
  - Admin:
    - Full CRUD on all tasks.
    - Can create tasks for themselves or for engineers.
    - Can assign and reassign tasks to engineers.
    - Can set `approval_status` and can complete/uncomplete tasks on behalf of an engineer.
  - Engineer:
    - Can create tasks only for themselves.
    - Can read/update/delete tasks when they are either the creator or the current assignee.
    - Cannot assign tasks to another user; only admins can assign or reassign tasks to someone else.
    - Cannot directly approve or reject tasks; `approval_status` is admin-managed for MVP.
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
    - `approvalStatus`
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
    - approval status
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
    - approval status
  - Admin task list filters for MVP:
    - project
    - assignee
    - approval status
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
    - `task.approved`
    - `task.rejected`
  - Audit metadata should capture:
    - task id and name
    - project id and project name
    - old/new assignee
    - old/new approval state
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
  - Engineers cannot assign tasks to another user and cannot directly set `approval_status` to `approved` or `rejected`.
  - Admins can create tasks, assign tasks to engineers, reassign tasks, approve/reject tasks, and manage all tasks from a dedicated admin Tasks view.
  - Admins can open the Tasks view from the admin navigation, from the Projects view, from a project card, and from the Engineers view to see tasks filtered to a selected engineer.
  - Task payloads include the requested fields plus the derived `parent` object.
  - `parent` resolves to either the parent task or the owning project for top-level tasks.

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
  - Redesign the site's appearance for mobile screens across authentication, onboarding, engineer, and admin views.
  - Apply UI/UX best practices for mobile using MUI responsive design patterns (breakpoints, touch targets, spacing, typography scale, and navigation).
  - Use this guidance as a design reference: https://medium.com/@WebdesignerDepot/essential-tips-for-converting-a-desktop-site-to-mobile-3686c35a7364
  - Phases:
    - Phase 1: Engineer dashboard shell mobile redesign (layout, navigation, global spacing/typography), using mobile UX do/don't guidance from https://medium.com/@pepper_square/mobile-ux-design-dos-donts-b68a4a990d5b (excluding accessibility-specific guidance).
    - Phase 2: Engineer panel-by-panel mobile redesign (Personal panel, Projects panel, and any additional engineer subviews), continuing the same https://medium.com/@pepper_square/mobile-ux-design-dos-donts-b68a4a990d5b guidance (excluding accessibility-specific guidance).
    - Phase 3: Admin dashboard shell mobile redesign (layout, navigation drawer/menu behavior, overview cards responsiveness).
    - Phase 4: Admin panel-by-panel mobile redesign (Dashboard, Engineers, Personal, Projects, Audit, and related admin subviews).
- Admin calendar view:
  - Add a calendar panel to the admin dashboard using CalendarJS react components.
  - Surfaces engineer time-off / upcoming holidays and project start/end dates in a unified calendar.
  - Should support month/week views and be filterable by engineer or project.
