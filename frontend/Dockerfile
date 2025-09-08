# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for node-gyp (if needed)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Use npm ci for faster, reproducible builds
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Inject build-time environment variables from docker-compose args
ARG VITE_API_BASE_URL
ARG VITE_TCE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_TCE_API_BASE_URL=${VITE_TCE_API_BASE_URL}

# Build the application
RUN npm run build

# Serve stage
FROM node:20-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs \
    && adduser -S react -u 1001 \
    && chown -R react:nodejs /app

USER react

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5173/ || exit 1

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]