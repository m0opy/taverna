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

## Docker Compose

После установки Docker Desktop:

```bash
docker compose -f infra/compose.dev.yml up --build
```

Покупка VPS и домена для локальной разработки не требуется.

## Production / VPS

Production-запуск рассчитан на VPS с Docker Engine и Compose plugin, доменом,
направленным на сервер, и открытыми портами `80` и `443`. Caddy получает и
обновляет HTTPS-сертификат автоматически.

Создайте `.env` на сервере:

```bash
cp .env.example .env
```

Укажите в нём реальные значения:

```env
DOMAIN=example.com
API_IMAGE=ghcr.io/your-org/taverna-api:release-sha
WEB_IMAGE=ghcr.io/your-org/taverna-web:release-sha
POSTGRES_PASSWORD=replace-with-a-strong-password
JWT_SECRET=replace-with-a-long-random-secret
APP_VERSION=release-sha
ENABLE_DEMO_SEED=true
DEMO_PASSWORD=replace-with-a-demo-password
```

`API_IMAGE` и `WEB_IMAGE` должны указывать на доступные Docker-образы. Сейчас
репозиторий не публикует образы в GHCR и не выполняет SSH-деплой автоматически:
образы нужно заранее собрать и загрузить в registry либо собрать непосредственно
на VPS.

Проверьте итоговую конфигурацию и запустите стек:

```bash
docker compose --env-file .env -f infra/compose.prod.yml config
docker compose --env-file .env -f infra/compose.prod.yml up -d
docker compose --env-file .env -f infra/compose.prod.yml ps
docker compose --env-file .env -f infra/compose.prod.yml logs migrate
```

Migration-контейнер сначала применяет миграции, затем запускает идемпотентный
demo seed. После успешного завершения API и web запускаются автоматически.

Минимальная проверка после запуска:

```bash
curl --fail https://example.com/api/health
curl --fail -i -X POST https://example.com/api/auth/guest
```

Не используйте `docker compose down --volumes` на production: эта команда
удалит volume PostgreSQL и данные кампаний. Резервное копирование PostgreSQL
этим Compose-файлом автоматически не настраивается.
