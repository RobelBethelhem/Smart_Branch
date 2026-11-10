# ZSmart Branch customer-facing app (Next.js 15, port 3000) — production image for a Linux host.
#
# Two kinds of configuration:
#  • Build time (build args): NEXT_PUBLIC_* values are compiled into the browser JavaScript, so
#    changing them means rebuilding the image. docker-compose passes them from smart_branch_backend/deploy/app-server/.env.
#  • Run time (environment): FlexCube credentials, RESPONSE_ENCRYPTION_KEY, EXPRESS_BACKEND_URL …
#    (see smart_branch_backend/deploy/app-server/env/frontend.env.example). Nothing secret is baked in.
#
# The API routes query FlexCube in Oracle "thick" mode, so the image carries Oracle Instant Client.

ARG NODE_IMAGE=node:22-bookworm-slim
# Full image (same Debian release) with python3/make/g++ preinstalled, in case a dependency
# has to compile a native module. Only used for npm ci; the runtime image stays slim.
ARG BUILD_IMAGE=node:22-bookworm

# ── Oracle Instant Client ────────────────────────────────────────────────────────
FROM ${NODE_IMAGE} AS oracle
ARG INSTANT_CLIENT_URL=https://download.oracle.com/otn_software/linux/instantclient/2360000/instantclient-basic-linux.x64-23.6.0.24.10.zip
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl unzip \
 && curl -fsSL --retry 3 -o /tmp/instantclient.zip "$INSTANT_CLIENT_URL" \
 && mkdir -p /opt/oracle \
 && unzip -q /tmp/instantclient.zip -d /opt/oracle \
 && mv /opt/oracle/instantclient_* /opt/oracle/instantclient \
 && rm -f /opt/oracle/instantclient/*.jar /tmp/instantclient.zip \
 && rm -rf /var/lib/apt/lists/*

# ── Dependencies ─────────────────────────────────────────────────────────────────
FROM ${BUILD_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Build ────────────────────────────────────────────────────────────────────────
FROM ${NODE_IMAGE} AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_FINGERPRINT_WS_URL
ARG NEXT_PUBLIC_RESPONSE_ENCRYPTION_KEY
# ORACLE_CLIENT_PATH is listed under `env` in next.config.js, which inlines it at build time.
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_FINGERPRINT_WS_URL=${NEXT_PUBLIC_FINGERPRINT_WS_URL} \
    NEXT_PUBLIC_RESPONSE_ENCRYPTION_KEY=${NEXT_PUBLIC_RESPONSE_ENCRYPTION_KEY} \
    ORACLE_CLIENT_PATH=/opt/oracle/instantclient \
    NEXT_OUTPUT=standalone \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS=--max-old-space-size=4096
RUN test -n "$NEXT_PUBLIC_API_URL" || { echo "build arg NEXT_PUBLIC_API_URL is required (e.g. http://10.1.2.132:5000)" >&2; exit 1; }
# The check makes a build that exits cleanly without its output fail here, instead of being
# cached as a success and only noticed (or not) later.
RUN npm run build && test -f .next/standalone/server.js

# ── Runtime ──────────────────────────────────────────────────────────────────────
# The first three steps are identical in the backend image, so both images share these
# layers (incl. the ~300 MB Instant Client) in the build cache and on the server's disk.
FROM ${NODE_IMAGE}
RUN apt-get update \
 && apt-get install -y --no-install-recommends libaio1 \
 && rm -rf /var/lib/apt/lists/*
COPY --from=oracle /opt/oracle/instantclient /opt/oracle/instantclient
RUN echo /opt/oracle/instantclient > /etc/ld.so.conf.d/oracle-instantclient.conf && ldconfig
# UV_THREADPOOL_SIZE: Oracle thick mode runs every database call on a libuv thread, and the same
# threads read static files and gzip responses. Node's default is 4. Keep it above
# FLEXCUBE_POOL_MAX (default 20) with room for that other work.
ENV NODE_ENV=production \
    UV_THREADPOOL_SIZE=28 \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    TZ=Africa/Addis_Ababa \
    ORACLE_CLIENT_PATH=/opt/oracle/instantclient

WORKDIR /app
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
# oracledb loads its native binary through a computed path that Next's file tracing cannot
# follow, so ship the whole package rather than rely on the traced copy.
COPY --from=build --chown=node:node /app/node_modules/oracledb ./node_modules/oracledb

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
