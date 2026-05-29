# WorkLog Frontend

React + Vite app for McMaster Facility Services field workers — select a meter, pick the I/O
pins worked on, add notes, and submit a work log entry. Mobile-first (tablets/phones).

---

## Stack

| Concern | Choice | Notes |
|---------|--------|-------|
| Framework | React 18 + Vite + TypeScript (strict) | |
| Styling | Tailwind CSS v3 | brand colors as `mcmaster.*`; shadcn theme via CSS vars in `src/index.css` |
| Components | shadcn/ui | vendored into `src/components/ui/` — owned by us, safe to edit |
| Server state | TanStack Query v5 | provider in `main.tsx`; meter/pin data only changes via nightly sync |
| Forms | React Hook Form + zod | |
| Toasts | sonner | `<Toaster>` mounted in `main.tsx` |
| HTTP | `fetch` via shared `apiFetch` helper | no axios |
| Auth (prototype) | `X-Test-User` header injection | no MSAL yet — see below |

---

## Running locally

```bash
npm install
npm run dev        # Vite dev server on http://localhost:5173
```

The dev server proxies `/api/*` → `http://localhost:3000` (the backend; run it via
`docker compose up` from the repo root). All API calls use relative paths — no hardcoded ports.

```bash
npm run build      # tsc -b && vite build
npm run lint
```

---

## Environment

Vite exposes only `VITE_`-prefixed vars to the browser. Copy `.env.example` → `.env`
(gitignored) for local dev.

| Var | Purpose |
|-----|---------|
| `VITE_API_BASE_URL` | Backend origin. **Leave blank in dev** — the Vite proxy handles `/api`. |
| `VITE_AUTH_BYPASS` | `true` for the prototype: injects an `X-Test-User` header instead of an Azure AD token and shows the DEV MODE banner. Must be unset/false once MSAL lands. |

**Auth is bypassed for the June 8 prototype.** No MSAL, no Azure AD app registration — the
backend's `AUTH_BYPASS=true` reads the `X-Test-User` header. A visible gold "DEV MODE" banner
makes this obvious to demo viewers. Real `@azure/msal-react` auth is deferred post-prototype.

---

## Layout

```
src/
├── App.tsx                 # top-level layout: header + banners + form
├── main.tsx                # entry; mounts QueryClient + Toaster providers
├── index.css               # Tailwind directives + shadcn/McMaster theme tokens
├── components/ui/          # shadcn/ui primitives (button, select, card, …)
├── layout/
│   ├── Header.tsx          # McMaster maroon header
│   ├── DevModeBanner.tsx   # "DEV MODE — auth bypassed" indicator
│   └── OfflineBanner.tsx   # shown when navigator.onLine === false
├── lib/utils.ts            # cn() class-merge helper
└── offline/                # ADR-004 Option C: localStorage queue + online-status hook
```

Form flow (locked): **Building → Room → Meter → I/O Pins → Notes → Submit**. Building/Room are
derived client-side from `GET /api/meters` (`buildingLocation`); pins come from
`GET /api/meters/:ionDeviceName/pins`; submit posts to `POST /api/work-logs`. When offline,
entries are queued to `localStorage` and synced manually on reconnect.
