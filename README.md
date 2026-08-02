# Таверна

Хаб для ДнД-кампании: участники и персонажи, заметки игровых сессий, NPC и дата следующей игры.

Проект находится на этапе MVP. Продуктовые требования и технические решения собраны в [AI Docs](./ai/README.md).

## Структура

```text
apps/web          React SPA
apps/api          Fastify API + Prisma
packages/contracts  общие Zod-контракты и DTO
infra             Docker Compose и Nginx
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

## Публичная версия и релизы

Сайт доступен по адресу [http://92.118.114.232/](http://92.118.114.232/).

`main` — релизная ветка. Для каждого изменения:

1. Создайте feature-ветку от актуального `main`.
2. Внесите изменения и выполните `pnpm check`.
3. Откройте Pull Request в `main`; обязательная проверка `quality` должна пройти.
4. После merge в `main` изменения становятся новой версией сайта.

Не вносите изменения напрямую в `main`: он должен содержать только проверенные
релизные коммиты.

## Архитектура и CI/CD

Проект — monorepo на `pnpm` с разделением на три приложения:

- `apps/web` — React + Vite SPA; Nginx раздаёт статику и проксирует `/api/*`;
- `apps/api` — Fastify API с Prisma;
- `packages/contracts` — общие Zod-контракты между frontend и API.

В production API, web и PostgreSQL запускаются отдельными Docker-контейнерами
через Compose. База данных не публикуется наружу, а браузер работает с API по
same-origin маршруту `/api/*`.

CI/CD разделён на последовательные этапы:

1. Pull Request в `main` запускает `quality`: генерацию Prisma Client,
   миграции тестовой PostgreSQL, lint, typecheck, все тесты и production build.
2. После merge в `main` проверки запускаются повторно; затем
   `container-smoke` собирает production Docker-образы, проверяет Compose и
   Nginx, поднимает dev-стек и запрашивает health endpoint API.
3. Только после успешных проверок запускается deploy на VPS. Он получает SHA
   коммита, сверяет его с текущей вершиной `origin/main`, собирает образы с
   immutable тегом SHA, применяет миграции и ожидает health endpoint через
   reverse proxy.

Канал деплоя ограничен отдельным SSH-пользователем и forced command: GitHub
Actions может вызвать только `deploy <SHA>`, а не произвольную команду на
сервере. Production deploy сериализованы и не отменяют уже начатый релиз;
устаревшие проверки отменяются только для одного Pull Request. Production-
секреты остаются на VPS; SSH-ключ хранится в GitHub Environment Secret. Они не
попадают в Git, Docker-образы или логи CI.

Для полного соблюдения процесса в GitHub для `main` следует включить защиту
ветки: `quality` должна быть обязательной проверкой, а прямые и force push —
запрещены для обычной разработки.

## Docker Compose

После установки Docker Desktop:

```bash
docker compose -f infra/compose.dev.yml up --build
```

Покупка VPS и домена для локальной разработки не требуется.
