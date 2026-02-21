# Copilot instructions

## Project snapshot
- **Devcombine Engineering Portal** – a customer-relationship management app with email/password auth.
- Next.js 16.1.3 App Router, React 19, JavaScript (no TypeScript in app code).
- UI: **MUI v7** (`@mui/material`) — not Tailwind utilities in JSX. Tailwind is installed but `globals.css` is minimal; all component styling uses MUI's `sx` prop and theme.
- Database: PostgreSQL via **Prisma 7** with the `@prisma/adapter-pg` driver adapter.
- Auth: **NextAuth v5 beta** (`next-auth@5.0.0-beta.30`) with the Credentials provider and JWT sessions.

## Architecture

### Layout & theming
- [app/layout.js](app/layout.js) loads **Space Grotesk** via `@fontsource`, wraps children in `<ThemeRegistry>`.
- [app/theme-registry.js](app/theme-registry.js) is a `"use client"` component that provides the MUI `<ThemeProvider>` + `<CssBaseline>`. The custom theme defines palette, typography (Space Grotesk), border-radius 16, pill-shaped buttons, and elevated Paper. **All new UI must use this theme, not raw Tailwind classes.**

### Auth flow ([auth.js](auth.js))
- Single Credentials provider; passwords hashed with `bcryptjs` (cost 12).
- `PrismaAdapter` wires NextAuth to the DB. JWT strategy — no server-side sessions table used at runtime.
- Login blocked until `emailVerified` is set; `lastLogin` timestamp updated on each sign-in.
- Auth route handler: [app/api/auth/[...nextauth]/route.js](app/api/auth/[...nextauth]/route.js) re-exports `handlers` from the root `auth.js`.

### Signup → email verification flow
1. Client POST to [app/api/signup/route.js](app/api/signup/route.js) — creates `User` + `VerificationToken`, sends email.
2. Verification link hits [app/api/verify-email/route.js](app/api/verify-email/route.js) (GET) — sets `emailVerified`, deletes token.
3. [app/api/resend-verification/route.js](app/api/resend-verification/route.js) re-issues a token for unverified users.
4. Emails sent via **SMTP2GO REST API** in [app/actions/sendEmail.js](app/actions/sendEmail.js) (a `"use server"` action). The `sendEmail` function handles both `verify-email` and generic contact types by inspecting `payload.type`.

### Database ([prisma/schema.prisma](prisma/schema.prisma))
- Models: `User`, `Account`, `Session`, `VerificationToken` (standard NextAuth schema extended with `firstName`, `lastName`, `avatar` as `Bytes`, `avatarMimeType`, `lastLogin`).
- Generator outputs to `generated/prisma/` (not the default `node_modules`). Import the client from `generated/prisma/client`.
- Prisma client singleton: [lib/prisma.ts](lib/prisma.ts) — resolves connection string from `POSTGRES_URL` / `POSTGRES_URL_NON_POOLING` / `POSTGRES_PRISMA_URL`, auto-adds `uselibpqcompat` for SSL.
- Build script: `prisma generate && next build` — always runs generation first.

### Page routing
| Route | Type | Purpose |
|---|---|---|
| `/` | Server component | Auth gate → redirects to `/login` or renders `<Dashboard>` |
| `/login` | Client component | Email/password sign-in, resend-verification button |
| `/signup` | Client component | Registration with avatar crop (`react-easy-crop`) |
| `/verify-email` | Client component | Token verification on mount |
| `/forgot-password` | Server component | Static page directing users to admin |

## Conventions & patterns
- **Client vs server split**: pages that need interactivity (`useState`, `signIn`, form handling) are `"use client"`; the root page and forgot-password are server components that `import { auth }` or render static content.
- **API routes** live in `app/api/` and use `NextResponse.json()`. Validation is inline (no schema library yet).
- **Error handling in UI**: pages manage `error`/`info` state strings displayed via MUI `<Alert>`. Non-2xx API responses surface a safe user-facing message; 5xx errors always show a generic fallback.
- **Emails are always lowercased** before DB lookups or creation.
- **No test framework is configured yet.** No `test` script in package.json.

## UI styling

### Global defaults
- **Brand color**: `#5a8dd6`
- **Font**: Space Grotesk
- **Shapes**: Pill-shaped buttons, defaults to `borderRadius: 16`.

### Minimalism meets motion
Clean, spacious layouts remain the foundation, but the interface should feel alive through subtle motion.

Use:
- Gentle transitions
- Micro-interactions
- Light parallax where it adds meaning
- Small entrance and state-change animations

Keep motion purposeful and short (150–220ms).

**Implementation:**
- Use **LottieFiles** for icon and illustration motion.
- Use **GSAP** for timeline-based or scroll-driven animations.
- Avoid animating layout shifts that affect usability or performance.

This style is the primary visual and interaction baseline.

### Glassmorphism (used selectively)
Semi-transparent surfaces with background blur create a modern layered look similar to Windows 11. A well-known example of subtle layered and blurred surfaces can be seen in Apple Music, where glass-like panels soften transitions between content and backgrounds.

**Guidelines:**
- Use only for: headers, floating toolbars, modals, secondary cards.
- Always maintain clear contrast for text and controls.
- Avoid stacking multiple blurred layers.

Glass surfaces are accent components, not the core layout surface.

### Mega footer
As pages become simpler, the footer becomes a primary navigation and trust surface. A good real-world reference is the footer on Zapier.

**Structure:**
1. Brand and short product description
2. Primary product and resource links
3. Documentation, help and support links
4. Trust signals and legal links

Use strong visual hierarchy and consistent spacing to keep the footer scannable.

## Developer workflows
- Dev server: `yarn dev`
- Build (includes Prisma generate): `yarn build`
- Lint: `yarn lint` (ESLint with `eslint-config-next`)
- **Verification rule**: Whenever you make changes, run the app with `yarn dev` and resolve any errors that were introduced.
- **Test account reuse**: Reuse existing local test user accounts whenever possible; create new test accounts only when a scenario requires it.
- Prisma commands: `npx prisma generate`, `npx prisma migrate dev`, `npx prisma studio`

## Environment variables
`POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_PRISMA_URL` (at least one), `NEXTAUTH_SECRET` or `SUPABASE_JWT_SECRET`, `EMAIL_USERNAME`, `EMAIL_PASSWORD`, `NEXT_PUBLIC_APP_URL` or `NEXTAUTH_URL` (for verification links).

## Notes for agents
- When adding routes, use the App Router convention under `app/`.
- Use MUI components and the `sx` prop for styling — match the existing visual language (gradient backgrounds, elevated Paper cards, pill buttons, Space Grotesk font).
- Import Prisma from `lib/prisma` (the singleton), not directly from `@prisma/client`.
- After changing `schema.prisma`, run `npx prisma generate` to regenerate the client in `generated/prisma/`.
- `"use client"` is required for any component using React hooks, MUI event handlers, or `next-auth/react` functions like `signIn`/`signOut`.
