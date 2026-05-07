# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Type-check + Vite build
npm run lint       # ESLint
npm run test       # Run all tests (Vitest)
npx vitest run src/hooks/useEmployees.test.ts  # Run a single test file
```

Environment variables required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (in `.env`).

## Architecture

**Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Supabase (PostgreSQL) + React Router v7. Registered as a PWA via `public/sw.js`.

### Layout

`AppShell` renders a desktop `Sidebar` + `BottomNav` (mobile, `md:hidden`) wrapping a React Router `<Outlet>`. Routes are defined in `App.tsx`. **Navigation items are hardcoded in both `Sidebar.tsx` and `BottomNav.tsx` — both arrays must be updated when adding a route.**

### Data layer

Each feature domain has a custom hook in `src/hooks/` that owns all Supabase calls and exposes typed state + async operations. Pages import hooks directly — there is no global state or context. The Supabase client in `src/lib/supabase.ts` is typed via the generated `Database` type in `src/types/database.ts`. When adding tables, add the Row/Insert/Update types there and export a convenience type alias.

### Database schema

| Table | Purpose |
|---|---|
| `projects` | Core entity; status: `activo`/`inactivo` |
| `tasks` | Kanban tasks; `project_id` FK; `assigned_to` is a `string[]` of employee IDs |
| `employees` | Personnel; `status`: `active`/`inactive` |
| `project_employees` | M:N join between projects and employees |
| `attendance_logs` | Daily check-in/check-out; `date` is `YYYY-MM-DD` |
| `task_attachments` | Files stored in Supabase Storage |

### Styling

Tailwind CSS v4 — theme tokens are defined via `@theme` in `src/index.css`, **not** in a `tailwind.config.js`. Primary brand color is `navy-900` (`#162F65`). Icons use Material Symbols Outlined loaded via CDN; add `icon-filled` class for the filled variant.

### Date handling

**Never use `new Date().toISOString().split('T')[0]` or `new Date("YYYY-MM-DD")` with local date methods.** Both produce UTC-based dates that shift by one day in UTC− timezones (e.g. Argentina, UTC-3, after 21:00).

Always use the helpers in `src/lib/utils.ts`:
- `toLocalDateStr(date?)` — returns today (or any Date) as `YYYY-MM-DD` in local time
- `parseDateLocal(str)` — parses a `YYYY-MM-DD` string as local midnight

### Testing

Vitest + Testing Library. Tests live alongside hooks (`*.test.ts`). Supabase is mocked via `vi.mock('../lib/supabase')` using a chainable builder pattern — see `useEmployees.test.ts` for the established pattern.
