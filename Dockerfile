# Multi-stage build for NestJS backend
# Using Debian slim instead of Alpine for better Prisma/OpenSSL compatibility
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build && ls -la dist/ && echo "Build completed, dist folder contents:" && find dist -name "*.js" | head -10

# Production stage
FROM node:20-slim

WORKDIR /app

# Install dumb-init and OpenSSL libraries for Prisma
RUN apt-get update && \
    apt-get install -y --no-install-recommends dumb-init openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only (as root first)
RUN npm ci --only=production && npm cache clean --force

# Generate Prisma client (needed for runtime)
RUN npx prisma generate

# Create non-root user first (before copying files)
RUN groupadd -r nodejs -g 1001 && \
    useradd -r -g nodejs -u 1001 nestjs

# Copy built application from builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Verify dist folder exists and has files
RUN ls -la dist/src/ && ls -la dist/src/main.js || (echo "ERROR: dist/src/main.js not found!" && find . -name "main.js" || echo "No main.js found anywhere")

# Switch to non-root user
USER nestjs

# Expose port (Coolify will map this)
# Using port 3003 to avoid conflict with friend's backend (3001)
EXPOSE 3003

# Health check (Coolify will also use this)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/main.js"]

