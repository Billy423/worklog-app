# WorkLog

McMaster Facility Services — field worker maintenance log for ION-series electrical meters.

Scope: **135 ArcGIS-mapped meters** across campus.

---

## Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Backend | NestJS (TypeScript) | Modules, Guards, `@nestjs/schedule` |
| Auth | Azure AD (Entra ID) | `@nestjs/passport` + `passport-jwt` + `jwks-rsa`; dev bypass via `AUTH_BYPASS=true` |
| Frontend | React 18 + Vite | TypeScript strict; Tailwind CSS + shadcn/ui |
| Database | PostgreSQL 17 | Raw `pg` + `node-pg-migrate` |
| Local dev | Docker Compose | postgres + app container; Vite runs on host |
| Production | Azure App Service + Azure DB for PostgreSQL | No nginx — Azure handles TLS, headers, rate limit |

---

## Repository Layout

```
worklog-app/
├── backend/                    NestJS API (Node 22)
│   ├── migrations/             node-pg-migrate SQL migrations (001–005 applied)
│   ├── src/
│   │   ├── auth/               JwtStrategy, JwtAuthGuard, RolesGuard
│   │   ├── meters/             GET /api/meters, /api/meters/:id, /api/meters/:id/pins
│   │   ├── work-logs/          POST /api/work-logs, GET /api/work-logs
│   │   ├── sync/               PME + ArcGIS sync services + cron
│   │   ├── admin/              POST /api/admin/sync (admin only)
│   │   ├── health/             GET /api/health
│   │   └── openapi/            Swagger config; generate script → docs/openapi.yaml
│   └── docs/openapi.yaml       OpenAPI spec (committed; CI drift guard)
├── frontend/                   React + Vite (Phase 3b — in development)
├── docker-compose.yml          Base: postgres + app (production-like)
├── docker-compose.override.yml Dev overrides: hot reload, exposed DB port (auto-merged)
├── .env.example                Root Compose substitution vars
└── README.md
```

---

## Prerequisites

- **Docker** 24+ and `docker compose` CLI (space, not hyphen — Compose V2)
- **Node.js** 22 LTS + npm — only needed on the host for the frontend dev server
- A McMaster account if connecting to Azure AD (not required for dev bypass workflow)

---

## Quick Start (Local Dev)

### 1. Configure env files

```bash
# Root .env — read by Docker Compose for variable substitution
cp .env.example .env
# Required: POSTGRES_PASSWORD

# Backend .env — read by the app container
cp backend/.env.example backend/.env
# Required for full functionality: POSTGRES_PASSWORD, AZURE_*, ARCGIS_API_KEY, PME_*
# For prototype work: AUTH_BYPASS=true is already set in the example
```

### 2. Start postgres + backend (Docker)

```bash
docker compose up --build
```

`docker-compose.override.yml` is auto-merged — no `-f` flags needed.

- Backend API: `http://localhost:3000`
- Postgres: `localhost:5432` (exposed for tooling — psql / pgAdmin)
- Health check: `GET http://localhost:3000/api/health`
- Swagger UI (dev only): `http://localhost:3000/api/docs`

### 3. Run database migrations

```bash
cd backend
npm run migrate up
```

Five migrations are applied on a fresh database (001–005). See `backend/migrations/` for the full list.

### 4. Start frontend (host, separate terminal)

> Phase 3b — frontend is in development. Run once the work log form is implemented.

```bash
cd frontend
npm install
npm run dev
```

- Vite dev server: `http://localhost:5173`
- `/api/*` requests are proxied to `http://localhost:3000`

---

## Backend Commands

```bash
cd backend
npm install
npm run start:dev       # nest start --watch (hot reload)
npm run build           # nest build → dist/
npm run test            # jest (unit)
npm run test:e2e        # jest e2e (integration — requires running postgres)
npm run lint            # eslint
npm run migrate up      # run pending migrations
npm run generate:openapi  # regenerate docs/openapi.yaml
```

## Frontend Commands

```bash
cd frontend
npm install
npm run dev             # Vite dev server
npm run build           # tsc + vite build → frontend/dist/
npm run lint
```

---

## API Surface

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | public | Health check |
| GET | `/api/meters` | any role | All meters (paginated) |
| GET | `/api/meters/:ionDeviceName` | any role | Single meter or 404 |
| GET | `/api/meters/:ionDeviceName/pins` | any role | I/O pins for meter (returns `[]` until data load) |
| POST | `/api/work-logs` | technician, admin | Create work log entry |
| GET | `/api/work-logs` | technician (own), admin (all) | List work log entries |
| POST | `/api/admin/sync` | admin only | Trigger manual ArcGIS + PME sync |
| GET | `/api/docs` | dev only | Swagger UI |

Full OpenAPI spec: `backend/docs/openapi.yaml`.

---

## Database Migrations

Migrations live in `backend/migrations/` and are numbered sequentially. Run with `npm run migrate up` from `backend/`.

| # | File | What |
|---|------|------|
| 001 | `create_meters.sql` | `meters` table — PME + ArcGIS cache columns |
| 002 | `create_work_log_entries.sql` | stub (superseded by 005) |
| 003 | `add_meters_arcgis_and_ip_columns.sql` | adds `arcgis_meter_id`, `meter_ip_address`, `serial_number` |
| 004 | `create_meter_io_pins.sql` | `meter_io_pins` table — app-managed I/O pin config |
| 005 | `rebuild_work_log_entries.sql` | final `work_log_entries` shape (UUID PK, `pin_ids[]`) |

Down migrations are in `backend/migrations/down/` — apply manually if needed:
```bash
psql "$DATABASE_URL" -f backend/migrations/down/NNN_<name>.sql
```

---

## External Integrations

WorkLog syncs with two read-only external systems on a daily cron (default: 2 AM). WorkLog **never writes** to either.

| System | Purpose | Config keys |
|--------|---------|-------------|
| PME SQL Server | Meter device registry (ION_Network + ION_Data) | `PME_HOST`, `PME_INSTANCE`, `PME_USER`, `PME_PASSWORD`, `PME_WINDOWS_AUTH` |
| ArcGIS REST API | Meter physical locations, GPS coordinates, utility type | `ARCGIS_API_KEY` |

Sync can also be triggered manually via `POST /api/admin/sync`.

---

## Auth

**Development (prototype):** Set `AUTH_BYPASS=true` and `AUTH_BYPASS_ROLE=admin` (or `technician`) in `backend/.env`. The backend short-circuits JWT validation and attaches a stub user. The frontend injects an `X-Test-User` header for the same effect. A WARN is logged on every request when bypass is active.

**Production:** Set `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, and `AZURE_AUDIENCE`. Azure AD app registration is provisioned by McMaster IT. `AUTH_BYPASS` must be `false` (the app will refuse to start if it is `true` and `NODE_ENV=production`).

| Role | Permissions |
|------|-------------|
| `technician` | Submit work logs; view own entries |
| `admin` | All technician permissions + view all entries + trigger sync + reports |

---

## CI

GitHub Actions runs on every PR: lint → unit tests → integration tests → build.
Integration tests require a running postgres instance (provided by the CI service container).

The CI pipeline also checks for OpenAPI spec drift: if `docs/openapi.yaml` is out of sync with the running app, the check fails. Run `npm run generate:openapi` from `backend/` to regenerate.
