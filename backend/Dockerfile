# Development Dockerfile
FROM node:18-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "start:dev"]

# Production Build Stage
FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
RUN cp -R node_modules prod_node_modules
RUN npm ci

# Build application
COPY . .
RUN npm run build

# Production Stage
FROM node:18-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy dependencies and built files
COPY --from=build /app/prod_node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/package*.json ./

# Create uploads directory with proper permissions
RUN mkdir -p uploads/avatars uploads/banners uploads/listings && \
    chown -R nestjs:nodejs uploads

USER nestjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/main"]
