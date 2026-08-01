# Task 001: Foundation

Цель этапа: к концу первого дня получить поднимаемый локально каркас проекта, на который без переделок ляжет весь MVP.

## Статус

Локальная часть завершена 30 июля: Compose поднимает PostgreSQL, миграцию, API и web; `/api/health` возвращает `200` с БД `up`. Production shell на VPS намеренно перенесён в [Task 005](/Users/polinashchetkina/project/taverna/ai/tasks/005-release-and-production.md:1), потому что сервер и домен ещё не выбраны.

## Scope

- `pnpm` monorepo
- `apps/web`, `apps/api`, `packages/contracts`
- базовая структура frontend и backend
- PostgreSQL + Prisma schema
- Docker Compose для локального запуска
- production Compose + Caddy как подготовка к последующему HTTPS smoke
- healthcheck endpoint
- базовая UI-оболочка и роутинг-заглушки
- общая библиотека `zod`-схем

## Out of scope

- полноценная бизнес-логика auth
- campaign CRUD
- invite flow
- notes/NPC
- полный deploy продуктовых фич за пределами health/frontend shell

## Deliverables

### Repo structure

```text
apps/web
apps/api
packages/contracts
infra/compose.dev.yml
infra/compose.prod.yml
```

### Web

- Vite app стартует
- настроен React Router
- есть layout для гостя и для авторизованной части
- заведены страницы-заглушки под все MVP маршруты

### API

- Fastify server стартует
- есть `GET /api/health`
- подключён Prisma client
- есть middleware для error handling
- есть заготовка auth guard и campaign guard

### Contracts

- общие `zod`-схемы для auth/campaign/membership/note/npc
- экспорт типов из `zod.infer`

### Infra

- `docker compose -f infra/compose.dev.yml up` поднимает `postgres`, `migrate`, `api`, `web`
- для Postgres заданы volume и healthcheck
- переменные окружения описаны в `.env.example`
- production domain через Caddy отдаёт frontend shell и проксирует `/api/health`

## Acceptance criteria

- `pnpm install` проходит из корня
- `pnpm -r build` проходит
- `docker compose up` поднимает все сервисы без ручных шагов
- `GET /api/health` отвечает `200`
- production HTTPS smoke переносится в Task 005 после появления VPS и домена
- Prisma migration создаёт все таблицы из `data-model.md`
- в `packages/contracts` нет дублирования типов вручную

## Checklist

- [x] Инициализировать workspace
- [x] Создать package boundaries
- [x] Поднять Prisma и первую migration
- [x] Описать env vars
- [x] Поднять compose локально
- [ ] Поднять production shell на VPS и проверить HTTPS
- [x] Провести smoke run health endpoint

## Risks

- слишком рано уйти в UI-полировку вместо каркаса
- потерять время на сложную FSD-иерархию
- завязать `contracts` на runtime web/api и получить циклы зависимостей

## Exit condition

Этап завершён, когда следующий разработческий день можно целиком посвятить auth и первому вертикальному срезу без возврата к инфраструктурному фундаменту.
