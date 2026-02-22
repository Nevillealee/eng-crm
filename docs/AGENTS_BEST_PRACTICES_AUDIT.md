# AGENTS Best Practices Audit

Date: 2026-02-22

Scope reviewed: all first-party source/config files in this repo, excluding generated/vendor/build artifacts (`node_modules/`, `.next/`, `generated/`).

## Summary

This audit found broad conformance on `var` avoidance and strict equality usage, but repeated non-conformance in module sizing, async error handling consistency, magic constant centralization, optional chaining/undefined overuse, and missing JSDoc on exported utilities. Item `#11` (testing setup) is now completed.

## Findings

## 1) SOLID, single responsibility, and modularization violations

These files are large multi-responsibility units and violate:
- `Apply SOLID principles`
- `One function, one responsibility`
- `Split code into modules instead of one large file`
- `Avoid large anonymous functions`

Locations:
- `app/components/admin-dashboard.js:181` (component start), file size `1677` lines.
- `app/components/admin-dashboard.js:1097` (large inline IIFE in JSX that computes + renders a full engineer card subtree).
- `app/components/engineer-account.js:71`, file size `637` lines.
- `app/api/profile/route.js:193`, file size `431` lines (input parsing, validation, geo-IP, persistence, and auditing in one route module).
- `app/components/engineer-onboarding-wizard.js:48`, file size `403` lines.
- `app/signup/page.js:27`, file size `360` lines.
- `app/api/projects/[projectId]/route.js:21`, file size `282` lines.

## 2) Async error handling not consistently graceful

Violates:
- `Handle Errors Gracefully`
- `Use try...catch for async/await`
- `Provide meaningful error messages`

Locations with uncaught async flows or rethrow behavior:
- `app/api/forgot-password/route.js:6`
- `app/api/resend-verification/route.js:33`
- `app/api/verify-email/route.js:5`
- `app/api/projects/route.js:16`
- `app/api/projects/route.js:47`
- `app/api/admin/engineers/route.js:5`
- `app/api/admin/audit-logs/route.js:5`
- `app/api/admin/export/engineers/route.js:31`
- `app/api/admin/export/projects/route.js:12`
- `app/api/profile/route.js:193`
- `app/api/profile/route.js:236`
- `app/api/signup/route.js:190` (explicit `throw error`)
- `app/api/projects/[projectId]/route.js:228` (explicit `throw error`)
- `app/api/projects/[projectId]/route.js:280` (explicit `throw error`)

## 3) Email flow swallows failures (callers do not enforce success)

Violates:
- `Handle Errors Gracefully`
- `Provide meaningful error messages`

Locations:
- `app/actions/sendEmail.js:59` to `app/actions/sendEmail.js:70` catches and returns `{ success: false }` instead of throwing.
- `app/actions/sendEmail.js:87` to `app/actions/sendEmail.js:98` catches and returns `{ success: false }` instead of throwing.
- `app/actions/sendEmail.js:68`, `app/actions/sendEmail.js:96` logs error but does not force API-layer failure.
- Call sites that await these functions but do not check returned success status:
- `app/api/signup/route.js:79`
- `app/api/signup/route.js:193`
- `app/api/resend-verification/route.js:26`
- `app/api/resend-verification/route.js:52`
- `app/api/forgot-password/route.js:48`

## 4) Magic numbers/strings are duplicated instead of centralized

Violates:
- `Avoid Magic Numbers & Strings`

Password constraints duplicated (`8`, `32`):
- `app/signup/page.js:74`
- `app/signup/page.js:75`
- `app/reset-password/page.js:30`
- `app/api/signup/route.js:117`
- `app/api/signup/route.js:124`
- `app/api/reset-password/route.js:20`
- `app/api/reset-password/route.js:28`

Avatar size cap duplicated (`2 * 1024 * 1024`):
- `app/api/signup/route.js:11`
- `app/api/profile/route.js:17`

Repeated hard-coded truncation limits (`120/200/500/1000/5000`) not centralized:
- `app/api/profile/route.js:64`
- `app/api/profile/route.js:184`
- `app/api/profile/route.js:190`
- `app/api/profile/route.js:250`
- `app/api/projects/route.js:112`
- `app/api/projects/route.js:113`
- `app/api/projects/route.js:119`
- `app/api/projects/[projectId]/route.js:122`
- `app/api/projects/[projectId]/route.js:124`
- `app/api/projects/[projectId]/route.js:134`
- `app/api/admin/engineers/[engineerId]/route.js:57`

## 5) Overuse of safe operators and undefined checks in validated/internal paths

Violates:
- `Do not overuse safe operators`
- `Trust callers`
- `Truthy checks — use !!value instead of undefined comparisons`

Undefined comparisons and explicit `"undefined"` checks:
- `lib/csv.js:2`
- `app/reset-password/page.js:34`
- `app/components/admin-dashboard.js:400`
- `app/verify-email/page.js:13`
- `app/verify-email/page.js:44`
- `app/api/profile/route.js:95`
- `app/api/signup/route.js:28`
- `app/api/admin/engineers/[engineerId]/route.js:83`
- `app/api/projects/[projectId]/route.js:108`
- `app/api/projects/[projectId]/route.js:109`
- `app/api/projects/[projectId]/route.js:122`
- `app/api/projects/[projectId]/route.js:124`
- `app/api/projects/[projectId]/route.js:131`
- `app/api/projects/[projectId]/route.js:132`

Optional chaining density is high in internal flows (`113` total occurrences in app/lib/auth):
- `app/components/admin-dashboard.js` (`22`)
- `app/api/projects/[projectId]/route.js` (`15`)
- `app/api/projects/route.js` (`11`)
- `app/api/profile/route.js` (`9`)
- `app/components/engineer-account.js` (`7`)
- `auth.js` (`6`)
- `app/components/admin/project-form.js` (`5`)
- `app/api/admin/export/engineers/route.js` (`4`)
- `app/api/admin/engineers/[engineerId]/route.js` (`4`)

## 6) Missing JSDoc on exported utilities/non-obvious helpers

Violates:
- `Leverage JSDoc annotations`
- `Document contracts`

Locations:
- `lib/admin-audit.js:10`
- `lib/email-verification.js:18`
- `lib/email-verification.js:25`
- `lib/email-verification.js:34`
- `lib/email-verification.js:45`
- `lib/request-ip.js:140`
- `lib/csv.js:27`
- `lib/csv.js:40`
- `app/api/projects/shared.js:20`
- `app/api/projects/shared.js:33`
- `app/api/projects/shared.js:46`
- `app/api/projects/shared.js:61`
- `app/api/projects/shared.js:69`
- `app/api/projects/shared.js:95`
- `app/api/projects/shared.js:108`
- `app/signup/crop-image.js:1`

## 7) API response convention drift (`NextResponse.json` vs raw `Response`)

Violates:
- `App Router — API routes use NextResponse.json()`

Locations:
- `app/api/admin/export/engineers/route.js:35` (raw `Response("Unauthorized", ...)`)
- `app/api/admin/export/engineers/route.js:108` (raw `Response(content, ...)`)
- `app/api/admin/export/projects/route.js:16` (raw `Response("Unauthorized", ...)`)
- `app/api/admin/export/projects/route.js:86` (raw `Response(content, ...)`)


## 9) Dot-notation preference drift

Violates:
- `Prefer dot notation over bracket notation`

Location:
- `prisma.config.ts:24`
- `prisma.config.ts:25`
- `prisma.config.ts:26`

## 10) Self-documenting code/comment discipline drift

Violates:
- `Code should explain itself; comments should explain why, not what`
- `Avoid over-commenting obvious logic`

Locations with "what" comments for obvious behavior:
- `app/signup/page.js:89`
- `app/signup/page.js:91`
- `app/signup/page.js:162`
- `app/components/footer.js:18`
- `app/components/footer.js:31`
- `app/components/footer.js:44`
- `app/components/footer.js:57`

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

Violates:
- `Maintain Prettier-compatible formatting`

Locations:
- `app/components/footer.js:21` (mis-indented typography line)
- `app/components/footer.js:67` (mis-indented copyright line)
- `lib/prisma.ts:4` and `lib/prisma.ts:5` (quote/style inconsistency vs predominant repo style)

## Compliant checks (no violations found)

- No `var` usage found in first-party source files.
- No loose equality (`==`, `!=`) usage found in first-party source files.
- No Tailwind utility classes found in JSX (`className=` not present in `app/` components).
