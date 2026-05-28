# syntax=docker/dockerfile:1.7

# base: shared layer with package manifests
FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./

# dev: hot reload via nest start --watch
FROM base AS dev
ENV NODE_ENV=development
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# build: compile TypeScript to ./dist
# NODE_ENV must NOT be set to production here — npm install skips devDependencies otherwise,
# and @nestjs/cli (needed for nest build) is a devDependency.
FROM base AS build
RUN npm install
COPY . .
RUN npm run build

# production: runtime-only, no dev deps
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/migrations ./migrations
EXPOSE 3000
CMD ["node", "dist/main.js"]
