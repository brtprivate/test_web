## AiCryptoBot Admin Console

Feature-driven Next.js 16 dashboard for managing the AiCryptoBot server. It ships with:

- 🔐 Secure admin login with RTK Query + token persistence
- 📊 Realtime dashboard cards, charts, and deposit intelligence
- 👥 User moderation, team hierarchy insights, and investment controls
- 💰 Income runway visualisations + treasury tracking
- 🎨 Global theme engine with live color orchestration
- ⚙️ Settings CRUD wired directly to the Express API (`server/src`)

---

## Project layout

```
app/                   # App Router routes (auth + protected sections)
src/
  components/          # Reusable UI + layout primitives
  config/              # API + theme configuration
  features/            # Feature-based slices (auth, dashboard, users, investments, ...)
  hooks/               # Shared hooks (auth guard, theme sync, typed redux)
  lib/                 # RTK store, slices, utilities
  providers/           # Application-level providers (Redux, theme, toasts)
```

State is managed via Redux Toolkit + RTK Query. Each feature injects its own endpoints into the base API.

---

## Prerequisites

1. Run the Express backend in `../server` (defaults to `http://localhost:5000`).
2. Create an admin account (the server seeds one on first boot, see `server/README.md`).
3. Create an `.env.local` inside `admin/` with the API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## Scripts

```bash
pnpm dev     # start Next.js in dev mode
pnpm build   # production build
pnpm start   # serve the built app
pnpm lint    # ESLint (runs on CI)
```

The admin UI runs on [http://localhost:3000](http://localhost:3000) by default.

---

## Authentication flow

1. `POST /api/admin/login` — handled by `features/auth/api.ts`.
2. Token is persisted to both `localStorage` and cookies.
3. Protected layouts (`app/(admin)/layout.tsx`) enforce `useAuthGuard`, fetch profile, and hydrate Redux.

Update server secrets (JWT, DB) from the Express service only; the frontend only consumes APIs.

---

## Theming

- Palette presets live in `src/lib/slices/themeSlice.ts`.
- `ColorManager` (management page) writes custom palettes to localStorage and updates CSS variables via `useThemeSync`.
- Colors are referenced through CSS custom properties defined in `app/globals.css`.

---

## API integration checklist

- Dashboard stats: `GET /api/admin/manage/dashboard`
- Users CRUD: `GET|PATCH /api/admin/manage/users`
- Deposits & treasury: `GET /api/deposits/admin/all`, `PATCH /api/deposits/admin/:id/status`
- Settings: `GET|PATCH /api/settings`
- Investment plans: `GET /api/investment-plans`

Extend any feature by adding endpoints to `src/features/<name>/api.ts` and composing UI inside the same folder.

---

## Testing & quality

- All TypeScript lint checks pass via `pnpm lint`.
- UI relies on mock-less live data, so confirm the backend is running before QA.
- For visual tweaks, update `app/globals.css` (CSS variables + utility classes) or the feature-specific components.

---

Happy shipping! 🚀
