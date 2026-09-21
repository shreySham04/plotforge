# Multi-stage Dockerfile for PlotForge Full-Stack Deployment
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Clean install all dependencies (including build tools)
RUN npm ci

# Copy application source code
COPY . .

# Build both Vite frontend assets and bundle Express/WebSocket server
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built frontend distribution and bundled server from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Data directory for persistent local JSON fallback storage
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
