# AGENTS.md

## Project overview

Devcombine Engineering Portal — a customer-relationship management app with email/password auth built on Next.js 16.1.3 App Router, React 19, JavaScript (no TypeScript in app code), MUI v7, Prisma 7 + PostgreSQL, and NextAuth v5 beta.

## Product requirements

Source of truth for requirements and MVP scope:
- `docs/PRD.md`
- `docs/MVP_BACKLOG.md`

When implementing changes, keep behavior aligned with these docs:
- Admin access is controlled by `users.is_admin` (`isAdmin` in Prisma model).
- Post-login routing is role-based: admins -> `/admin`, non-admins -> `/engineer`.
- Salary is monthly PHP and admin-only.
- Project notes are admin-only.
- Engineers can edit their own skills/city/avatar/availability/time off.

## Setup

```sh
yarn
npx prisma generate   # outputs to generated/prisma/, not node_modules
yarn dev              # starts Next.js dev server
```

Required env vars (see `.env` or hosting dashboard): `POSTGRES_URL` (or `POSTGRES_URL_NON_POOLING` / `POSTGRES_PRISMA_URL`), `NEXTAUTH_SECRET`, `EMAIL_USERNAME`, `EMAIL_PASSWORD`, `NEXT_PUBLIC_APP_URL`.

## Build & lint

- `yarn build` — runs `prisma generate && next build` (generation always runs first).
- `yarn lint` — ESLint with `eslint-config-next`.
- `yarn test` — Jest test suite.
- **Verify changes** — whenever you make changes, run the app with `yarn dev` and resolve any errors that were introduced.
- **Post-change verification (required)** — after all code changes, run `yarn test` to verify nothing broke before considering the task complete.
- **Test account reuse** — prefer reusing existing local test users before creating new ones. Create new test accounts only when required by the scenario.

## Code conventions

- **JavaScript only** — no TypeScript in `app/` code. The Prisma singleton (`lib/prisma.ts`) is the sole `.ts` file.
- **Apply SOLID principles** — keep units focused (single responsibility), extend behavior via composition, keep contracts substitutable, prefer small interfaces, and depend on abstractions/helpers instead of concrete implementations.
- **One function, one responsibility** — each function should do one thing well.
- **Control flow** — avoid deeply nested conditionals; prefer early returns for guard clauses.
- **MUI for all styling** — use the `sx` prop and the theme from `app/theme-registry.js`. Do not use Tailwind utility classes in JSX.
- **`"use client"` directive** — required for any component using React hooks, MUI event handlers, or `next-auth/react` (`signIn`, `signOut`). Server components (e.g., `app/page.js`, `app/forgot-password/page.js`) must not use these.
- **App Router** — all routes live under `app/`. API routes use `NextResponse.json()`.
- **Emails are always lowercased** before any DB lookup or creation.
- **Error UI pattern** — pages manage `error`/`info` state strings shown via MUI `<Alert>`. 5xx errors always show a generic fallback message.
- **Variable declarations** — use `const` by default, `let` only when reassignment is required, and avoid `var`.
- **Use strict equality** — always use `===` / `!==` to avoid coercion surprises.
- **Declare variables clearly** — place function-scoped variable declarations near the top of a function and avoid relying on hoisting behavior.
- **Property access style** — prefer dot notation over bracket notation unless dynamic keys are required.
- **Truthy checks** — use `!!value` for explicit boolean coercion instead of comparing to `undefined`.
- **Avoid magic numbers/strings** — centralize repeated literals in named constants or config objects.
- **Do not overuse safe operators** — use `?.` / `??` at true uncertainty boundaries (request payloads, external APIs). Inside validated internal flows, trust callers and use direct access.
- **Function shape** — avoid large anonymous functions; extract named private helpers for non-trivial logic.
- **Self-documenting code** — choose clear names and structure so code explains itself; comment for intent/why, not obvious what/how.
- **Comment discipline** — avoid over-commenting straightforward logic.
- **Document contracts** — add JSDoc to exported utilities and non-obvious functions to capture input/output expectations.
- **Modern ES6+ usage** — use destructuring for cleaner object/array handling, arrow functions for concise callbacks, template literals for string composition, and optional chaining/nullish coalescing where they improve readability.
- **Modular code** — split features into focused modules instead of one large file.
- **ES Modules** — use `import`/`export` for maintainability; use dynamic `import()` for on-demand loading where it materially improves performance.
- **Performance guardrails** — debounce/throttle heavy event handlers (scroll/resize/input) and memoize expensive repeated computations.
- **Error handling** — use `try...catch` around async/await failure boundaries and return meaningful, user-safe error messages.
- **Testing expectations** — every new feature must include a test added in the same change, preferably an integration test. If the change is strictly unit-level/internal and does not introduce new user-facing behavior, a new test is optional.
- **Tooling** — keep ESLint clean and maintain Prettier-compatible formatting.

## Database

- Prisma schema: `prisma/schema.prisma`. Models: `User`, `Account`, `Session`, `VerificationToken`.
- Client generated to `generated/prisma/`. Always import via `lib/prisma` (the singleton), never directly from `@prisma/client`.
- After changing `schema.prisma`, run `npx prisma generate` before building.
- Migrations: `npx prisma migrate dev`. Studio: `npx prisma studio`.

## Auth architecture

- `auth.js` (project root) — single Credentials provider, JWT strategy, `bcryptjs` cost 12.
- Login requires `emailVerified` to be set; `lastLogin` is updated on each sign-in.
- `app/api/auth/[...nextauth]/route.js` re-exports `handlers` from `auth.js`.

## Key data flows

1. **Signup page** (`app/signup/page.js`) validates form + optional avatar crop, then `POST`s JSON to `app/api/signup/route.js`.
2. **Signup API** (`app/api/signup/route.js`) normalizes input, validates password/avatar, upserts behavior for existing emails, creates user with bcrypt hash, issues verification token, and sends email through `app/actions/sendEmail.js`.
3. **Verification page** (`app/verify-email/page.js`) reads `token` (`hash` or query), strips token from browser URL, then calls `POST /api/verify-email`.
4. **Verify API** (`app/api/verify-email/route.js`) hashes token, resolves verification record, enforces expiry, sets `user.emailVerified`, and removes used token.
5. **Resend verification** (`POST /api/resend-verification`) re-issues verification token for unverified users from forgot-password flow or explicit resend requests.
6. **Sign-in page** (`app/login/page.js`) collects credentials + `rememberMe`, reads `callbackUrl`, and calls `signIn("credentials", { redirect: false, ... })`.
7. **Sign-in API path** (`app/api/auth/[...nextauth]/route.js` -> `auth.js`) runs Credentials `authorize`: lowercases email, validates bcrypt password + `emailVerified`, updates `lastLogin`/IP, and returns role claims.
8. **Post-auth session routing** (`auth.js` callbacks + `app/page.js`) refreshes role in JWT/session and routes users by role (`/admin` vs `/engineer`).
9. **Email transport** (`app/actions/sendEmail.js`) is the shared server action used by verification and password-reset mail flows.

## Styling guidelines

- **Brand color**: `#5a8dd6`
- **Theme**: Space Grotesk font, border-radius 16, pill-shaped buttons, elevated Paper with `boxShadow: "0 20px 60px rgba(0,0,0,0.12)"`, gradient backgrounds (`linear-gradient(135deg, #f5f5f7 0%, #e8eefc 100%)`).
- Motion: purposeful, 150–220ms. Use LottieFiles for icon animation, GSAP for scroll-driven animation. Avoid layout-shift animations.
- Glassmorphism: only for headers, floating toolbars, modals, secondary cards. Maintain text contrast; never stack blurred layers.
- Mega footer: brand description → product links → docs/support links → trust/legal links.

## File structure reference

| Path | Role |
|---|---|
| `auth.js` | NextAuth configuration (Credentials provider, JWT/session callbacks, role + remember-me handling) |
| `app/api/auth/[...nextauth]/route.js` | NextAuth App Router entrypoint (`GET`/`POST` handlers) |
| `app/signup/page.js` | Sign-up UI with client-side validation and avatar crop/upload |
| `app/login/page.js` | Sign-in UI using `next-auth/react` `signIn` |
| `app/verify-email/page.js` | Verification UI that consumes token from URL and calls verify API |
| `app/forgot-password/page.js` | Forgot-password UI + resend verification trigger |
| `app/reset-password/page.js` | Password reset UI (token + new password submit) |
| `app/api/signup/route.js` | Registration endpoint (validation, hashing, user creation, verification token issue) |
| `app/api/verify-email/route.js` | Verification endpoint (token validation, expiry check, `emailVerified` update) |
| `app/api/resend-verification/route.js` | Resend verification endpoint for unverified users |
| `app/api/forgot-password/route.js` | Password-reset request endpoint (token generation + email dispatch) |
| `app/api/reset-password/route.js` | Password-reset completion endpoint (token validation + password update) |
| `app/actions/sendEmail.js` | Server action for transactional emails (verify, reset, contact) |
| `lib/email-verification.js` | Verification token hashing/TTL and verification URL helpers |
| `lib/request-ip.js` | Request IP extraction utility used during sign-in tracking |
| `app/page.js` | Auth gate + role-based redirect root (`/login`, `/admin`, `/engineer`) |
| `app/theme-registry.js` | MUI ThemeProvider (`"use client"`) |
| `lib/prisma.ts` | Prisma client singleton |
| `prisma/schema.prisma` | Database schema |
| `generated/prisma/` | Generated Prisma client (do not edit) |
