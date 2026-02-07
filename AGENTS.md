# AGENTS.md

## Project overview

ENG CRM — a customer-relationship management app with email/password auth built on Next.js 16.1.3 App Router, React 19, JavaScript (no TypeScript in app code), MUI v7, Prisma 7 + PostgreSQL, and NextAuth v5 beta.

## Setup

```sh
yarn
npx prisma generate   # outputs to generated/prisma/, not node_modules
yarn dev              # starts Next.js dev server
```

Required env vars (see `.env` or hosting dashboard): `POSTGRES_URL` (or `POSTGRES_URL_NON_POOLING` / `POSTGRES_PRISMA_URL`), `NEXTAUTH_SECRET`, `GMAIL_USERNAME`, `GMAIL_PASSWORD`, `NEXT_PUBLIC_APP_URL`.

## Build & lint

- `yarn build` — runs `prisma generate && next build` (generation always runs first).
- `yarn lint` — ESLint with `eslint-config-next`.
- **Verify changes** — whenever you make changes, run the app with `yarn dev` and resolve any errors that were introduced.
- No test framework is configured yet.

## Code conventions

- **JavaScript only** — no TypeScript in `app/` code. The Prisma singleton (`lib/prisma.ts`) is the sole `.ts` file.
- **MUI for all styling** — use the `sx` prop and the theme from `app/theme-registry.js`. Do not use Tailwind utility classes in JSX.
- **`"use client"` directive** — required for any component using React hooks, MUI event handlers, or `next-auth/react` (`signIn`, `signOut`). Server components (e.g., `app/page.js`, `app/forgot-password/page.js`) must not use these.
- **App Router** — all routes live under `app/`. API routes use `NextResponse.json()`.
- **Emails are always lowercased** before any DB lookup or creation.
- **Error UI pattern** — pages manage `error`/`info` state strings shown via MUI `<Alert>`. 5xx errors always show a generic fallback message.

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

1. **Signup** → `POST /api/signup` creates `User` + `VerificationToken`, sends verification email via `app/actions/sendEmail.js`.
2. **Verify** → `GET /api/verify-email?token=...&email=...` sets `emailVerified`, deletes token.
3. **Resend** → `POST /api/resend-verification` re-issues token for unverified users.
4. **Email** → `app/actions/sendEmail.js` (`"use server"`) uses Nodemailer + Gmail SMTP. Dispatches on `payload.type` (`verify-email` or generic contact).

## Styling guidelines

- **Brand color**: `#5a8dd6`
- **Theme**: Space Grotesk font, border-radius 16, pill-shaped buttons, elevated Paper with `boxShadow: "0 20px 60px rgba(0,0,0,0.12)"`, gradient backgrounds (`linear-gradient(135deg, #f5f5f7 0%, #e8eefc 100%)`).
- Motion: purposeful, 150–220ms. Use LottieFiles for icon animation, GSAP for scroll-driven animation. Avoid layout-shift animations.
- Glassmorphism: only for headers, floating toolbars, modals, secondary cards. Maintain text contrast; never stack blurred layers.
- Mega footer: brand description → product links → docs/support links → trust/legal links.

## File structure reference

| Path | Role |
|---|---|
| `auth.js` | NextAuth config (Credentials + JWT) |
| `lib/prisma.ts` | Prisma client singleton |
| `app/theme-registry.js` | MUI ThemeProvider (`"use client"`) |
| `app/actions/sendEmail.js` | Server action for transactional email |
| `app/api/signup/route.js` | User registration endpoint |
| `app/api/verify-email/route.js` | Email verification endpoint |
| `app/api/resend-verification/route.js` | Resend verification endpoint |
| `prisma/schema.prisma` | Database schema |
| `generated/prisma/` | Generated Prisma client (do not edit) |
