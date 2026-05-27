# Multi-stage Dockerfile for Next.js 14 (App Router, standalone output).
# Designed for Azure Container Apps cloud build (no local Docker required).
# Final image runs `node server.js` on port 3000.

# ---------- 1) deps: install npm dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# ---------- 2) builder: produce .next standalone output ----------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- 3) runner: minimal runtime image ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as non-root (alpine ships with nobody:nogroup)
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copy public assets and the standalone server output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Bundled sample CSV (served via /api/sample)
COPY --from=builder --chown=nextjs:nodejs /app/sample ./sample

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
