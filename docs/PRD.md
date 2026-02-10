# Devcombine ENG CRM - PRD (MVP)

## 1) Purpose

Devcombine provides software outsourcing services to US companies with Filipino software engineers. This app consolidates internal communications and visibility across engineers and projects.

MVP focus:
- Engineers can sign up, verify email, log in/out, manage their profile, and view their assigned ongoing projects.
- Admin (initially Neville) can manage engineer accounts and projects, including sensitive compensation and staffing.

## 2) Goals

- Provide a single source of truth for staffing: which engineers are on which projects.
- Provide a searchable admin directory of engineers, skills, location, and availability.
- Ensure authentication and verification are reliable and secure.

## 3) Non-goals (MVP)

- Time tracking, invoicing, payroll automation.
- Client-facing portal.
- Real-time chat and external integrations (Slack/email syncing).
- Fine-grained RBAC beyond `admin` vs `engineer`.

## 4) Personas

### Admin

- Oversees staffing across projects.
- Maintains engineer profile data (skills, city, salary, availability).
- Needs fast filtering and editing workflows.

### Engineer

- Maintains their own profile (skills, city, avatar, availability).
- Needs a simple view of assigned ongoing projects.

## 5) Roles and access

### Admin creation

- Admin is determined by a boolean flag on the user record (`users.is_admin`).
- Admin-only data includes salary and admin notes.

### Engineer permissions

- Can edit: `skills`, `city`, `avatar`, `availability`, and time off/holidays.
- Can view assigned projects (no admin notes).

### Admin permissions

- Can view and edit all engineer profile fields.
- Can edit salary (PHP monthly salary).
- Can create/edit/archive projects and assign/unassign engineers.
- Can view last login IP and other audit-relevant fields.

## 6) Functional requirements (MVP)

### 6.1 Authentication

- Signup with email + password.
- Email verification required before login.
- Login/logout.
- Post-login routing by role:
  - `isAdmin=true` -> `/admin`
  - `isAdmin=false` -> `/engineer`
- Engineers must complete onboarding wizard before account access:
  - Incomplete onboarding: `/engineer` (wizard)
  - Completed onboarding: `/engineer/account`
- Resend verification email.
- Errors must be generic (avoid user enumeration).

### 6.2 Engineer profile

Fields (engineer-editable and admin-editable):
- First name, last name
- Avatar photo
- City
- Skills (tag list: React, Node, TypeScript, etc.)
- Availability status and notes
- Upcoming holidays / time off

### 6.3 Engineer projects view

- A "My Projects" page lists assigned projects.
- Ongoing projects are determined by both:
  - Project `status`
  - Start/end dates
- Engineers can see:
  - Project name, client name, duration (start/end), assigned team members
  - Any engineer-visible notes (MVP: none; admin notes are not visible)

### 6.4 Admin dashboard

Admin can view a list of all engineers including:
- Salary information (admin-entered): monthly salary in PHP
- Engineer skills
- City location
- Last login IP
- Email address
- First name, last name
- Avatar photo
- Availability status, notes, upcoming holidays/time off

Admin can create/manage projects including:
- Project name
- Client name
- Duration (start date, optional end date)
- Status (`Ongoing`, `Completed`, `Archived`)
- Team members assigned
- Admin notes (admin-only)

## 7) Data model (logical)

### User

- `id`, `email`, `passwordHash`, `emailVerifiedAt`
- `isAdmin`: boolean flag persisted in `users.is_admin`
- `role`: derived at runtime from `isAdmin` (`admin` | `engineer`)
- `firstName`, `lastName`, `avatar`
- `city`
- `skills[]`
- `availabilityStatus`, `availabilityNote`
- `timeOff[]` (date ranges, label)
- `onboardingCompleted`, `onboardingStep`
- `monthlySalaryPhp` (admin-only)
- `lastLoginAt`, `lastLoginIp`

### Project

- `id`, `name`, `clientName`
- `status`: `ongoing` | `completed` | `archived`
- `startDate`, `endDate` (nullable)
- `adminNotes` (admin-only)

### ProjectMembership

- `projectId`, `userId`
- Optional `roleOnProject`
- `assignedAt`

## 8) UX / pages (MVP)

Public:
- `/signup`
- `/login`
- `/verify-email`

Engineer:
- `/engineer` (required onboarding wizard until completion)
- `/engineer/account` (engineer account page after onboarding)
- `/projects` (My Projects)
- `/profile`

Admin:
- `/admin` (dashboard)
- `/admin/engineers`
- `/admin/engineers/:id`
- `/admin/projects`
- `/admin/projects/new`
- `/admin/projects/:id`

## 9) Security and privacy

- Salary and admin notes never appear in engineer API responses or UI.
- Generic auth errors: do not reveal if an email exists.
- Record last login time and IP for admins to view.

## 10) Acceptance criteria (MVP)

- Users with `isAdmin=true` can access admin routes; `isAdmin=false` cannot.
- After login, admins land on `/admin` and non-admins land on `/engineer`.
- Engineers cannot access `/engineer/account` until onboarding is completed.
- Engineer can update skills/city/avatar/availability and admin sees the updates.
- Admin can create an ongoing project and assign engineers; engineers see assigned projects.
- Admin notes are only visible to admins.
