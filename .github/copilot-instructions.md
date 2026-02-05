# Copilot instructions

## Project snapshot
- Next.js App Router app using React 19 and Next 16.1.3 (see [package.json](package.json)).
- App entry points live in [app/layout.js](app/layout.js) and [app/page.js](app/page.js).
- Styling uses Tailwind CSS v4 via the CSS-first import in [app/globals.css](app/globals.css).

## Architecture and flow
- `RootLayout` in [app/layout.js](app/layout.js) sets up global HTML structure, loads Geist fonts via `next/font/google`, and applies the font variables on `<body>`.
- The homepage component `Home` in [app/page.js](app/page.js) renders the main UI and uses `next/image` for optimized images.
- Global theme tokens are defined as CSS variables in [app/globals.css](app/globals.css) and mapped into Tailwind via `@theme inline`.

## Styling conventions
- Use Tailwind utility classes in JSX (see [app/page.js](app/page.js)).
- Keep global CSS minimal and theme-related in [app/globals.css](app/globals.css); prefer component-level styling via Tailwind utilities.
- Dark mode is handled with `prefers-color-scheme` in [app/globals.css](app/globals.css).

## Developer workflows
- Dev server: `npm run dev` (Next.js dev server).
- Production build: `npm run build`; start: `npm run start`.
- Linting: `npm run lint` (ESLint with Next.js config).

## Integration points
- `next/font` is used for Geist fonts; keep new fonts consistent with the CSS variables (`--font-geist-sans`, `--font-geist-mono`) defined in [app/layout.js](app/layout.js) and referenced in [app/globals.css](app/globals.css).
- `next/image` is the standard image component (see [app/page.js](app/page.js)).

## Notes for agents
- This repo currently mirrors the default create-next-app template; prefer minimal, incremental changes unless the user requests a redesign.
- When adding routes, follow the App Router convention under the [app](app) directory.
