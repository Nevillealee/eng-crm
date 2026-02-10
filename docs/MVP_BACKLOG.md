# Devcombine ENG CRM - MVP Backlog

This backlog is the working source of truth for MVP scope. Keep it updated as requirements evolve.

Legend:
- P0: required for MVP
- P1: strongly desired, can slip

## P0 - Authentication and access control

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

## P1 - Quality and operational hardening

- Audit log (admin edits):
  - Record salary and staffing/project changes (who, what, when).
  - Implemented in current build via `AdminAuditLog`, write hooks in admin mutation routes, `/api/admin/audit-logs`, and `/admin` -> `Audit log` panel.
- Import/export:
  - CSV export for engineer list and projects.
  - Implemented in current build via `/api/admin/export/engineers`, `/api/admin/export/projects`, and `/admin` export actions in `Engineers`/`Projects` panels.

