# Таверна

Хаб для ДнД-кампании: участники и персонажи, заметки игровых сессий, NPC и дата следующей игры.

Проект находится на этапе MVP. Продуктовые требования и технические решения собраны в [AI Docs](./ai/README.md), календарный план — в [плане на четыре дня](./.omx/plans/taverna-mvp-4-days.md).

## Структура

```text
apps/web          React SPA
apps/api          Fastify API + Prisma
packages/contracts  общие Zod-контракты и DTO
infra             Docker Compose и Caddy
```

## Локальный запуск без Docker

Требования: Node.js 24 LTS, Corepack и локальный PostgreSQL 18.

```bash
corepack enable
corepack prepare pnpm@11.18.0 --activate
cp .env.example .env
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Web: `http://localhost:5173`. API health: `http://localhost:3000/api/health`.

## Проверка

```bash
pnpm check
```

## Docker Compose

После установки Docker Desktop:

```bash
docker compose -f infra/compose.dev.yml up --build
```

Покупка VPS и домена для локальной разработки не требуется.
