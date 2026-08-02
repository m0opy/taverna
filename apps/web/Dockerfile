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

FROM nginx:1.28-alpine AS production
COPY infra/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html
EXPOSE 80
