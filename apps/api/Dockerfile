# Production Dockerfile for Kaa Rental Platform API
# Multi-stage build for optimal image size and security

# Build stage
FROM oven/bun:1.1.38-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies (production only in final stage)
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application (if you have a build step)
# RUN bun run build

# Remove dev dependencies and clean up
RUN bun install --frozen-lockfile --production && \
    rm -rf node_modules/.cache && \
    rm -rf /root/.bun/install/cache

# Production stage
FROM oven/bun:1.1.38-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S kaaapi -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=kaaapi:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=kaaapi:nodejs /app/package.json ./
COPY --from=builder --chown=kaaapi:nodejs /app/src ./src
COPY --from=builder --chown=kaaapi:nodejs /app/bun.lockb ./

# Create logs directory
RUN mkdir -p /app/logs && chown kaaapi:nodejs /app/logs

# Switch to non-root user
USER kaaapi

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD bun --version > /dev/null && curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["bun", "run", "src/index.ts"]

# Labels for better container management
LABEL maintainer="Kaa Rental Platform Team" \
      version="1.0.0" \
      description="Kaa Rental Platform API - Kenya-specific rental management system" \
      org.opencontainers.image.source="https://github.com/your-org/kaa-saas-mvp" \
      org.opencontainers.image.title="Kaa Rental API" \
      org.opencontainers.image.description="Production-ready rental platform API for Kenya market"
