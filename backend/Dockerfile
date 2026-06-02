# ==============================================================
#  Strapi v5 — Multi-stage Dockerfile
#  Stages: base → development → builder → production
# ==============================================================

ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine AS base

# Install OS deps needed by node-gyp and sharp
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat \
    vips-dev \
    && ln -sf python3 /usr/bin/python

WORKDIR /app

# ---------------------------------------------------------------
# Stage: development
# ---------------------------------------------------------------
FROM base AS development

ENV NODE_ENV=development

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 1337

CMD ["npm", "run", "develop"]

# ---------------------------------------------------------------
# Stage: builder (compile admin panel)
# ---------------------------------------------------------------
FROM base AS builder

ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

COPY . .

RUN npm run build

# ---------------------------------------------------------------
# Stage: production (minimal image)
# ---------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS production

RUN apk add --no-cache \
    vips-dev \
    && addgroup -S strapi \
    && adduser  -S strapi -G strapi

WORKDIR /app

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

# Copy only production artifacts
COPY --from=builder --chown=strapi:strapi /app/node_modules ./node_modules
COPY --from=builder --chown=strapi:strapi /app/dist         ./dist
COPY --from=builder --chown=strapi:strapi /app/build        ./build
COPY --from=builder --chown=strapi:strapi /app/public       ./public
COPY --from=builder --chown=strapi:strapi /app/package.json ./package.json
COPY --from=builder --chown=strapi:strapi /app/src          ./src
COPY --from=builder --chown=strapi:strapi /app/config       ./config

USER strapi

EXPOSE 1337

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:1337/_health || exit 1

CMD ["npm", "run", "start"]
