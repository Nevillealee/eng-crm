# AGENTS Best Practices Audit

Date: 2026-02-22

Scope reviewed: all first-party source/config files in this repo, excluding generated/vendor/build artifacts (`node_modules/`, `.next/`, `generated/`).

## Summary

This audit found broad conformance on `var` avoidance and strict equality usage. Tracked remediation items `#1`, `#2`, `#3`, `#4`, `#5`, `#6`, `#7`, `#9`, `#10`, `#11`, and `#12` are completed.

## Findings

## 1) SOLID, single responsibility, and modularization violations

Status: Completed on 2026-02-23.

Target principles:
- `Apply SOLID principles`
- `One function, one responsibility`
- `Split code into modules instead of one large file`
- `Avoid large anonymous functions`

Implemented refactors:
- `app/components/admin-dashboard.js` split into orchestrator directory structure:
  - `app/components/admin-dashboard/index.js`
  - `app/components/admin-dashboard/panels/*`
  - `app/components/admin-dashboard/shared/*`
- `app/components/engineer-account.js` split into orchestrator directory structure:
  - `app/components/engineer-account/index.js`
  - `app/components/engineer-account/personal-panel.js`
  - `app/components/engineer-account/projects-panel.js`
- `app/components/engineer-onboarding-wizard.js` split into:
  - `app/components/engineer-onboarding-wizard/index.js`
  - `app/components/engineer-onboarding-wizard/profile.js`
  - `app/components/engineer-onboarding-wizard/step-content.js`
- `app/signup/page.js` split into:
  - `app/signup/page.js` (orchestrator)
  - `app/signup/form.js`
  - `app/signup/validation.js`
- `app/api/profile/route.js` split into:
  - `app/api/profile/route.js` (HTTP boundary only)
  - `app/api/profile/selectors.js`
  - `app/api/profile/geoip.js`
  - `app/api/profile/patch-input.js`
  - `app/api/profile/audit.js`
- `app/api/projects/[projectId]/route.js` split input parsing/validation into:
  - `app/api/projects/[projectId]/route-input.js`

Size evidence (post-refactor):
- `app/api/profile/route.js` reduced to `93` lines.
- `app/signup/page.js` reduced to `193` lines.
- `app/api/projects/[projectId]/route.js` reduced to `186` lines.
- `app/components/engineer-onboarding-wizard/index.js` reduced to `246` lines with step/profile logic extracted.

## 2) Async error handling not consistently graceful

Status: Completed on 2026-02-23.

Target principles:
- `Handle Errors Gracefully`
- `Use try...catch for async/await`
- `Provide meaningful error messages`

Implemented coverage:
- Added explicit async error boundaries and safe 5xx responses in:
  - `app/api/forgot-password/route.js`
  - `app/api/resend-verification/route.js`
  - `app/api/verify-email/route.js`
  - `app/api/projects/route.js` (`GET`, `POST`)
  - `app/api/admin/engineers/route.js`
  - `app/api/admin/audit-logs/route.js`
  - `app/api/admin/export/engineers/route.js`
  - `app/api/admin/export/projects/route.js`
  - `app/api/profile/route.js` (`GET`, `PATCH`)
  - `app/api/signup/route.js`
  - `app/api/projects/[projectId]/route.js` (`PATCH`, `DELETE`)
- Removed prior `throw error` rethrow paths in:
  - `app/api/signup/route.js`
  - `app/api/projects/[projectId]/route.js`

Verification evidence:
- New integration suite validating graceful 500 responses for these routes:
  - `tests/integration/error-handling/api-routes.graceful-errors.test.js`

## 3) Email flow swallows failures (callers do not enforce success)

Status: Completed on 2026-02-23.

Target principles:
- `Handle Errors Gracefully`
- `Provide meaningful error messages`

Implemented coverage:
- Updated `app/actions/sendEmail.js` so mail send failures are not swallowed:
  - `sendVerificationEmail` now propagates SMTP failure (throws) instead of returning `{ success: false }`.
  - `sendForgotPasswordEmail` now propagates SMTP failure (throws) instead of returning `{ success: false }`.
- Call paths now enforce those failures through existing API error boundaries:
  - `app/api/signup/route.js`
  - `app/api/resend-verification/route.js`
  - `app/api/forgot-password/route.js`

Verification evidence:
- Added integration tests for email-delivery failure handling:
  - `tests/integration/auth.email-flows.test.js`:
    - signup returns 500 when verification email delivery fails
    - resend-verification returns 500 when email delivery fails
    - forgot-password returns 500 when email delivery fails

## 4) Magic numbers/strings are duplicated instead of centralized

Status: Completed on 2026-02-24.

Target principles:
- `Avoid Magic Numbers & Strings`

Implemented coverage:
- Added centralized constant modules:
  - `app/constants/password-policy.js`
  - `app/constants/avatar.js`
  - `app/constants/text-limits.js`
- Replaced duplicated password constraints (`8`, `32`) in:
  - `app/signup/validation.js`
  - `app/signup/form.js`
  - `app/reset-password/page.js`
  - `app/api/signup/route.js`
  - `app/api/reset-password/route.js`
- Replaced duplicated avatar limits/validation literals in:
  - `app/api/signup/route.js`
  - `app/api/profile/shared.js`
- Replaced repeated truncation limits (`120/200/500/1000/5000`) in:
  - `app/api/profile/geoip.js`
  - `app/api/profile/patch-input.js`
  - `app/api/profile/shared.js`
  - `app/api/projects/route.js`
  - `app/api/projects/[projectId]/route-input.js`
  - `app/api/admin/engineers/[engineerId]/route.js`
- Extended centralization to admin-audit truncation limits in:
  - `lib/admin-audit.js`

Verification evidence:
- `yarn test tests/integration/auth.password-reset.test.js` (pass)
- `yarn test tests/integration/projects.form-persistence.behavior.test.js` (pass)
- `yarn test tests/integration/admin-engineers.compensation.behavior.test.js` (pass)
- `yarn test tests/integration/auth.email-flows.test.js` (pass)
- `yarn test tests/integration/profile.personal-info.behavior.test.js` (pass)
- `yarn test tests/integration/onboarding/profile-onboarding.behavior.test.js` (pass)
- `yarn test` (pass: `23` suites, `99` tests)

## 5) Overuse of safe operators and undefined checks in validated/internal paths

Status: Completed on 2026-02-24.

Violates:
- `Do not overuse safe operators`
- `Trust callers`
- `Truthy checks — use !!value instead of undefined comparisons`

Implemented coverage:
- Removed explicit `"undefined"` checks and simplified sentinel handling in:
  - `lib/csv.js`
  - `app/reset-password/page.js`
  - `app/verify-email/page.js`
  - `app/api/profile/patch-input.js`
  - `app/api/profile/route.js`
  - `app/api/admin/engineers/[engineerId]/route.js`
- Refactored project patch/update paths to use explicit presence flags rather than `typeof ... === "undefined"` checks:
  - `app/api/projects/[projectId]/route-input.js`
  - `app/api/projects/[projectId]/route.js`
  - `app/api/projects/[projectId]/route-helpers.js`
- Reduced optional chaining in validated internal request-body parsing by normalizing payload objects first:
  - `app/api/projects/route.js`
  - `app/api/projects/[projectId]/route-input.js`
  - `app/api/profile/patch-input.js`
  - `app/api/admin/engineers/[engineerId]/route.js`
- Optional chaining count across `app/`, `lib/`, and `auth.js` reduced from `112` to `82`, with remaining usage concentrated at external uncertainty boundaries (session/request payloads/api responses).

Verification evidence:
- `yarn test tests/integration/projects.form-persistence.behavior.test.js` (pass)
- `yarn test tests/integration/access-control/projects-api.access-control.test.js` (pass)
- `yarn test tests/integration/admin-engineers.compensation.behavior.test.js` (pass)
- `yarn test tests/integration/profile.personal-info.behavior.test.js` (pass)
- `yarn test tests/integration/onboarding/profile-onboarding.behavior.test.js` (pass)
- `yarn test` (pass: `23` suites, `99` tests)
- `yarn lint` (pass with only pre-existing generated Prisma warnings)

## 6) Missing JSDoc on exported utilities/non-obvious helpers

Status: Completed on 2026-02-24.

Violates:
- `Leverage JSDoc annotations`
- `Document contracts`

Implemented coverage:
- Added JSDoc contracts to exported helpers in:
  - `lib/admin-audit.js`
  - `lib/email-verification.js`
  - `lib/request-ip.js`
  - `lib/csv.js`
  - `app/api/projects/shared.js`
  - `app/signup/crop-image.js`

Verification evidence:
- `yarn lint` (pass with only pre-existing generated Prisma warnings)
- `yarn test` (pass: `23` suites, `99` tests)

## 7) API response convention drift (`NextResponse.json` vs raw `Response`)

Status: Completed on 2026-02-24.

Violates:
- `App Router — API routes use NextResponse.json()`

Implemented coverage:
- Replaced raw `Response` usage in export routes with `NextResponse`/`NextResponse.json`:
  - `app/api/admin/export/engineers/route.js`
  - `app/api/admin/export/projects/route.js`
- Standardized unauthorized and 500 failure responses to JSON payloads while preserving CSV success responses via `new NextResponse(content, { headers })`.
- Updated affected integration assertions:
  - `tests/integration/access-control/admin-export.access-control.test.js`
  - `tests/integration/error-handling/api-routes.graceful-errors.test.js`

Verification evidence:
- `yarn test tests/integration/access-control/admin-export.access-control.test.js` (pass)
- `yarn test tests/integration/error-handling/api-routes.graceful-errors.test.js` (pass)
- `yarn test` (pass: `23` suites, `99` tests)
- `yarn lint` (pass with only pre-existing generated Prisma warnings)


## 9) Dot-notation preference drift

Status: Completed on 2026-02-24.

Violates:
- `Prefer dot notation over bracket notation`

Implemented coverage:
- Replaced bracket-style env access with dot notation in:
  - `prisma.config.ts`

Verification evidence:
- `yarn lint` (pass with only pre-existing generated Prisma warnings)
- `yarn test` (pass: `23` suites, `99` tests)

## 10) Self-documenting code/comment discipline drift

Status: Completed on 2026-02-24.

Violates:
- `Code should explain itself; comments should explain why, not what`
- `Avoid over-commenting obvious logic`

Implemented coverage:
- Removed obvious "what" comments and kept intent clear via structure/naming in:
  - `app/components/footer.js`
- Confirmed `app/signup/page.js` no longer contains the previously flagged "what" comments after earlier modularization work.

Verification evidence:
- `yarn lint` (pass with only pre-existing generated Prisma warnings)
- `yarn test` (pass: `23` suites, `99` tests)

## 11) Completed: Testing setup and feature integration tests

Status: Completed on 2026-02-22.

Implemented evidence:
- Jest is configured and runnable:
- `package.json:11` (`test` script)
- `package.json:12` (`test:watch` script)
- `package.json:34` (`@jest/globals`)
- `package.json:40` (`jest`)
- `jest.config.mjs:1`
- `tests/setup/jest.setup.js:1`
- Integration tests were added for feature-level auth/security and admin flows:
- `tests/integration/auth.signin.test.js`
- `tests/integration/auth.email-flows.test.js`
- `tests/integration/auth.password-reset.test.js`
- `tests/integration/access-control-and-onboarding.test.js`
- Model-level CRUD integration coverage was split into dedicated files:
- `test/model/project-crud.test.js`
- `test/model/engineer-crud.test.js`

Verification evidence:
- `yarn test` currently passes (`6` suites, `27` tests).

## 12) Formatting consistency drift (Prettier-style)

Status: Completed on 2026-02-24.

Violates:
- `Maintain Prettier-compatible formatting`

Implemented coverage:
- Fixed footer indentation and normalized JSX formatting in:
  - `app/components/footer.js`
- Aligned import quote/style consistency in:
  - `lib/prisma.ts`

Verification evidence:
- `yarn lint` (pass with only pre-existing generated Prisma warnings)
- `yarn test` (pass: `23` suites, `99` tests)

## Compliant checks (no violations found)

- No `var` usage found in first-party source files.
- No loose equality (`==`, `!=`) usage found in first-party source files.
- No Tailwind utility classes found in JSX (`className=` not present in `app/` components).
