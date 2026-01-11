# ====================================
# Stage 1: Base - Install dependencies
# ====================================
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# ====================================
# Stage 2: Dependencies
# ====================================
FROM base AS deps

# Copy workspace configuration files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY turbo.json ./

# Copy package.json files for all workspaces
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# ====================================
# Stage 3: Builder
# ====================================
FROM base AS builder

WORKDIR /app

# Build arguments for environment variables
ARG VITE_API_URL
ARG VITE_APP_NAME=Subscriber

# Set environment variables for build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy source files
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
COPY turbo.json package.json pnpm-workspace.yaml ./

# Build the application
RUN pnpm turbo run build --filter=web

# ====================================
# Stage 4: Production - Nginx
# ====================================
FROM nginx:alpine AS runner

# Add non-root user
RUN addgroup -g 1001 -S nginx-app && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx-app nginx-app

# Remove default nginx config
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Set proper permissions
RUN chown -R nginx-app:nginx-app /usr/share/nginx/html && \
    chown -R nginx-app:nginx-app /var/cache/nginx && \
    chown -R nginx-app:nginx-app /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx-app:nginx-app /var/run/nginx.pid

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
