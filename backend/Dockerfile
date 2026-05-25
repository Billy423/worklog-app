FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./

# ── dev: hot reload via ts-node-dev ──────────────────────────────────────────
FROM base AS dev
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ── build: compile TypeScript ─────────────────────────────────────────────────
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# ── production: minimal image, compiled JS only ───────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
