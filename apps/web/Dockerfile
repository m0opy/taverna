FROM node:24-bookworm-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --frozen-lockfile

FROM base AS development
COPY packages/contracts ./packages/contracts
COPY apps/web ./apps/web
RUN pnpm --filter @taverna/contracts build
CMD ["pnpm", "--filter", "@taverna/web", "dev"]

FROM base AS build
COPY packages/contracts ./packages/contracts
COPY apps/web ./apps/web
RUN pnpm --filter @taverna/contracts build && pnpm --filter @taverna/web build

FROM caddy:2.11-alpine AS production
COPY infra/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /workspace/apps/web/dist /srv
EXPOSE 80 443 443/udp
