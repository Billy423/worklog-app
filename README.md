# WorkLog

McMaster Facility Services — field worker maintenance log for ION-series electrical meters.

## Structure

```
worklog-app/
  backend/          Express + TypeScript API server
  frontend/         React + Vite frontend
  docker-compose.yml          Production services
  docker-compose.dev.yml      Dev overrides (postgres exposed, hot reload)
```

## Quick Start (Dev)

```bash
cp backend/.env.example backend/.env
# Fill in DATABASE_URL, PME credentials, ARCGIS_API_KEY

docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

Backend: `http://localhost:3000`  
Frontend dev server: `http://localhost:5173`  
Health check: `GET /api/health`

## Stack

| Layer | Choice |
|-------|--------|
| Backend | TypeScript + Express |
| Frontend | React 18 + Vite |
| Database | PostgreSQL 17 |
| Deployment | Docker Compose (on-prem) |
| Migrations | node-pg-migrate |

See `../decisions/ADR-001-tech-stack.md` for rationale.

## External Integrations

| System | Purpose | Access |
|--------|---------|--------|
| PME SQL Server (`PFSPMEDB01\ION`) | Meter registry + alarms | Read-only, daily sync |
| ArcGIS REST API | Meter locations + utility type | Read-only, daily sync |

WorkLog **never writes** to PME or ArcGIS.
