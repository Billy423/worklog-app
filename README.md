# WorkLog

McMaster Facility Services — field worker maintenance log for ION-series electrical meters.

Scope: the **135 ArcGIS-mapped meters**, not all 307 ION devices.

## Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Backend | NestJS (TypeScript) | Modules, Guards, `@nestjs/schedule` |
| Auth | Azure AD (Entra ID) + MSAL | `@nestjs/passport` + `passport-jwt` + `jwks-rsa`; dev bypass via `AUTH_BYPASS=true` |
| Frontend | React 18 + Vite | TypeScript strict, MSAL React |
| Database | PostgreSQL 17 | Raw `pg` + `node-pg-migrate` |
| Local dev | Docker Compose | postgres + app container; Vite runs on host |
| Production | Azure App Service + Azure DB for PostgreSQL | No nginx — Azure handles TLS, headers, rate limit |

See `../decisions/` for the full ADRs (ADR-001 through ADR-004).

## Repository Layout

```
worklog-app/
├── backend/                NestJS API (Node 20)
├── frontend/               React + Vite
├── docker-compose.yml      prod-like: postgres + app           (Step 3)
├── docker-compose.dev.yml  dev override: hot reload, exposed DB (Step 3)
├── .env.example            Compose substitution vars
└── README.md
```

## Prerequisites

- **Docker** 24+ and modern `docker compose` CLI (space, not hyphen)
- **Node.js** 20 LTS + npm — only needed on the host for the frontend dev server
- A McMaster account if connecting to Azure AD (not required for the dev bypass workflow)

## Quick Start (Local Dev)

> Steps 3–5 of issue #6 are not yet implemented. The commands below are the **intended** dev workflow; the README will be updated as each step lands.

### 1. Configure env files

```bash
# Root .env — read by Docker Compose for variable substitution
cp .env.example .env
# Fill in: POSTGRES_PASSWORD

# Backend .env — read by the app container
cp backend/.env.example backend/.env
# Fill in: POSTGRES_PASSWORD (same value as root .env), AZURE_*, ARCGIS_API_KEY, PME_*
# Keep AUTH_BYPASS=true for prototype work

# Frontend .env — only needed when wiring MSAL (Step 5+)
cp frontend/.env.example frontend/.env
```

### 2. Start backend + postgres (Docker)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

- Backend: `http://localhost:3000`
- Postgres: `localhost:5432` (exposed for tooling — psql / pgAdmin)
- Health check: `GET http://localhost:3000/api/health`

### 3. Start frontend (host, separate terminal)

```bash
cd frontend
npm install
npm run dev
```

- Vite dev server: `http://localhost:5173`
- `/api/*` requests are proxied to `http://localhost:3000`

## Commands

### Backend

```bash
cd backend
npm install
npm run start:dev    # nest start --watch
npm run build        # nest build
npm run test         # jest
npm run lint
npm run migrate up   # node-pg-migrate (Step 6+)
```

### Frontend

```bash
cd frontend
npm install
npm run dev          # Vite
npm run build        # tsc + vite build → frontend/dist
npm run lint
```

## External Integrations (Read-Only)

| System | Purpose | Access |
|--------|---------|--------|
| PME SQL Server (`PFSPMEDB01\ION`, `172.26.118.107`) | Meter registry (ION_Network + ION_Data) | Read-only via Windows Auth `ads\wu897`. Daily sync only. |
| ArcGIS REST API | Meter physical locations + utility type | Read-only API key (`ARCGIS_API_KEY`). Daily sync only. |

WorkLog **never writes** to PME or ArcGIS.

## Auth in Dev

For the prototype, set `AUTH_BYPASS=true` and `AUTH_BYPASS_ROLE=admin` (or `technician`) in `backend/.env`. The backend will short-circuit Bearer validation, attach a stub user, and log a WARN on every request. Real Azure AD wiring (MSAL on the frontend, `passport-jwt` + JWKS on the backend) activates once McMaster IT provisions the app registration.

## Project Documents

This repo is part of the broader `IT-technical-assistant/` workspace. Architecture decisions, specs, and planning docs live one level up:

- `../decisions/ADR-001..004` — tech stack, auth, deployment, offline
- `../specs/02-integration-architecture.md` — meter scope, DB schema, sync queries
- `../specs/03-next-steps.md` — open decisions, requirements
- `../agents/claude-code/CLAUDE.md` — agent operating rules
