# This Dockerfile is built with the repo root as the Docker build context
# (Render: Root Directory empty, Dockerfile Path backend/Dockerfile, Docker
# Build Context Directory .) because the app is an npm-workspaces monorepo
# with a single lockfile at the repo root, not one per package.

# Development Dockerfile
FROM node:18-alpine AS development

WORKDIR /app

COPY package*.json ./
COPY backend/package*.json ./backend/
COPY mobile/package.json ./mobile/
COPY shared/package.json ./shared/
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev", "--workspace=@pbg/backend"]

# Production Stage
FROM node:18-alpine AS production

WORKDIR /app

COPY package*.json ./
COPY backend/package*.json ./backend/
COPY mobile/package.json ./mobile/
COPY shared/package.json ./shared/
RUN npm ci

COPY . .
RUN npm run build --workspace=@pbg/backend

# Set after the build so devDependencies (@nestjs/cli etc.) are still
# installed above — npm skips them automatically once NODE_ENV=production.
ENV NODE_ENV=production

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

RUN mkdir -p backend/uploads/avatars backend/uploads/banners backend/uploads/listings && \
    chown -R nestjs:nodejs backend

USER nestjs

WORKDIR /app/backend

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["sh", "-c", "npm run migration:run && node dist/main"]
