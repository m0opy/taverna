FROM node:24-bookworm-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable
WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --frozen-lockfile

FROM base AS development
COPY packages/contracts ./packages/contracts
COPY apps/api ./apps/api
RUN pnpm --filter @taverna/contracts build \
  && pnpm --filter @taverna/api db:generate
CMD ["pnpm", "--filter", "@taverna/api", "dev"]

FROM base AS build
COPY packages/contracts ./packages/contracts
COPY apps/api ./apps/api
RUN pnpm --filter @taverna/contracts build
RUN pnpm --filter @taverna/api db:generate
RUN pnpm --filter @taverna/api build

FROM base AS production

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/packages/contracts ./packages/contracts
COPY --from=build /workspace/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /workspace/apps/api/package.json ./apps/api/package.json
COPY --from=build /workspace/apps/api/dist ./apps/api/dist
COPY --from=build /workspace/apps/api/prisma ./apps/api/prisma
COPY --from=build /workspace/apps/api/prisma.config.ts ./apps/api/prisma.config.ts

WORKDIR /workspace/apps/api

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then((response) => { if (!response.ok) process.exit(1); }).catch(() => process.exit(1));"

CMD ["node", "dist/server.js"]
