# ====================================
# Stage 1: Base - Install dependencies
# ====================================
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Set working directory
WORKDIR /app

# ====================================
# Stage 2: Dependencies
# ====================================
FROM base AS deps

# Copy workspace configuration files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY turbo.json ./

# Copy package.json files for all workspaces
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# ====================================
# Stage 3: Builder
# ====================================
FROM base AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy source files
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
COPY prisma ./prisma
COPY turbo.json package.json pnpm-workspace.yaml ./

# Generate Prisma client
RUN pnpm --filter api db:generate

# Build the shared package and API
RUN pnpm turbo run build --filter=api

# ====================================
# Stage 4: Production Runner
# ====================================
FROM node:20-alpine AS runner

# Add non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 api

WORKDIR /app

# Install production dependencies only
ENV NODE_ENV=production

# Copy built application
COPY --from=builder --chown=api:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=api:nodejs /app/apps/api/package.json ./
COPY --from=builder --chown=api:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=api:nodejs /app/prisma ./prisma

# Copy Prisma generated client
COPY --from=builder --chown=api:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=api:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Switch to non-root user
USER api

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
