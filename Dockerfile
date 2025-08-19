# Stage 1: Build the app
FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --ignore-scripts

COPY . .
RUN bun run build

# Stage 2: Serve with nginx
FROM nginx:1.25-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
