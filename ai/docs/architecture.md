# Архитектура MVP

Документ фиксирует одно техническое решение для [requirements.md](/Users/polinashchetkina/project/taverna/ai/docs/requirements.md:1), чтобы за 4 дня не тратить время на повторный выбор стека, структуры и деплоя. Связанные артефакты: [data-model.md](/Users/polinashchetkina/project/taverna/ai/docs/data-model.md:1), [api.md](/Users/polinashchetkina/project/taverna/ai/docs/api.md:1), [testing.md](/Users/polinashchetkina/project/taverna/ai/docs/testing.md:1), [project-context.md](/Users/polinashchetkina/project/taverna/ai/project-context.md:1) и активные tasks `003`–`005`.

## 1. Зафиксированный стек

Зафиксированные на 30 июля 2026 года версии установленных зависимостей:

| Область | Компоненты |
|---|---|
| Runtime/workspace | `Node.js 24.18.0 LTS`, `pnpm 11.18.0`, `TypeScript 5.9.3`, pnpm workspace |
| Frontend | `React/React DOM 19.2.8`, `Vite 8.1.5`, `React Router 7.18.1`, `@gravity-ui/uikit 7.47.1` |
| Client data/forms | `@tanstack/react-query 5.101.4`, `zustand 5.0.14`, `zod 4.4.3` |
| Backend | `Fastify 5.10.0`, `Prisma/Client/@prisma/adapter-pg 7.9.0`, `pg 8.22.0`, `@fastify/cookie 11.1.2`, `@fastify/jwt 10.2.1`, `@fastify/rate-limit 11.1.0`, `argon2 0.45.1` |
| Data/infra | `postgres:18-bookworm`, `caddy:2.11`, Docker Compose, GitHub Actions, GHCR, SSH deploy |
| Tests | `Vitest 4.1.10`, встроенный `fastify.inject()`; Playwright — запланирован в Task 005 |

Пакеты ставятся с `--save-exact`; после scaffold источником истины становится `pnpm-lock.yaml`. Новые библиотеки форм, иконок и E2E не добавляются до появления конкретной задачи: это защищает MVP от преждевременного усложнения.

### Статус реализации

Локальный foundation закрыт: `postgres → migrate → api → web` поднимается через Compose, а `GET /api/health` подтверждает доступность БД. Auth, campaigns, invites, memberships, character update и Notes CRUD реализованы и покрыты текущими проверками. NPC, guest/demo и часть campaign controls остаются следующими срезами. VPS, домен, Caddy в публичном доступе и production CI/CD пока не проверены.

## 2. Почему именно этот стек

- `React 19.2 + Vite 8.1 + React Router 7.18` дают самый короткий путь к SPA без SSR и без лишней сборочной сложности.
- `@gravity-ui/uikit` ускоряет сборку админоподобного интерфейса и даёт аккуратный UI без отдельной дизайн-системы в MVP.
- `@tanstack/react-query` отвечает за серверное состояние, включая `me`; `Zustand` остаётся только для локального UI-state, чтобы не дублировать query cache.
- `Fastify 5.10` поднимается быстрее тяжёлых фреймворков, но даёт нормальную структуру плагинов, хуков и route modules.
- `Prisma 7.9 + PostgreSQL 18` закрывают реляционные связи, транзакции и исторические `membership`, которые уже зафиксированы в [data-model.md](/Users/polinashchetkina/project/taverna/ai/docs/data-model.md:1).
- `packages/contracts` убирает дублирование DTO и валидации: `zod`-схемы и типы используются и в `apps/web`, и в `apps/api`.
- `Caddy 2.11` проще для 4-дневного MVP: меньше конфигурации, нативный HTTPS, удобный same-origin reverse proxy.
- `GitHub Actions -> GHCR -> SSH` достаточно для деплоя, который выглядит серьёзно на демо, но не съедает отдельный день на платформенный overkill.

## 3. Структура репозитория

```text
.
├── apps
│   ├── api
│   └── web
├── packages
│   └── contracts
├── infra
│   ├── Caddyfile
│   ├── compose.dev.yml
│   └── compose.prod.yml
└── ai
```

### `apps/web`

Целевая FSD-lite структура без лишней вложенности:

```text
src/
├── app
├── pages
├── widgets
├── features
├── entities
└── shared
```

Правило слоёв:

- `entities` — доменные сущности и их client-side adapters
- `features` — пользовательские сценарии: login, create campaign, join campaign
- `widgets` — сборки блоков страницы
- `pages` — маршруты
- `app` — bootstrap, providers и роутинг; `shared` — UI wrappers, api client и инфраструктурные утилиты

### `apps/api`

```text
src/
├── app.ts
├── server.ts
├── plugins
├── modules
│   ├── auth
│   ├── campaigns
│   ├── memberships
│   ├── notes
│   ├── npcs
│   └── health
└── lib
```

Внутри backend-модуля:

- `route.ts` — HTTP-слой и registration роутов
- `service.ts` — бизнес-логика и транзакции
- `repo.ts` — Prisma-запросы, когда они перестают помещаться в service
- `schemas.ts` — адаптация контрактов из `packages/contracts`

### `packages/contracts`

```text
src/
├── auth
├── campaigns
├── invites
├── notes
├── npcs
└── common
```

Здесь лежат:

- `zod`-схемы request/response
- общие enum и error-code типы
- DTO для API, которые импортируются и клиентом, и сервером

## 4. Runtime topology

```text
Browser
  -> web/Caddy :443
    -> /api/* -> api (Fastify)
    -> /*     -> static React build inside web image
                  api -> Postgres
```

Same-origin обязателен для MVP:

- нет отдельного `api.` поддомена
- нет CORS-конфигурации как основной рабочей схемы
- авторизация работает через `httpOnly` cookie на одном origin
- внешний пользователь видит один домен и один HTTPS endpoint

Минимальный прод-рантайм:

- `web` (multi-stage image: Vite build + Caddy runtime)
- `api`
- `postgres`

Redis, очереди, object storage и отдельный cache layer исключаются из MVP.

## 5. Frontend architecture

### Routing

- `/`
- `/login`
- `/register`
- `/campaigns`
- `/campaigns/new`
- `/join/:token`
- `/c/:id`
- `/c/:id/notes`
- `/c/:id/npc`
- `/c/:id/settings`

### Разделение состояния

- `TanStack Query`:
  - `me`
  - список кампаний
  - карточка кампании
  - заметки
  - memberships/персонажи
  - NPC и их связи
- `Zustand`:
  - состояние модалок
  - ephemeral UI flags

Join intent не хранится отдельно: источником истины остаётся полный URL `/join/:token`, переданный через безопасно проверяемый `next` query param. Auth user хранится только в query `['me']`.

### API client

- единая `fetch`-обёртка с `credentials: "include"`
- единый parser ошибок под контракт из [api.md](/Users/polinashchetkina/project/taverna/ai/docs/api.md:1)
- редирект на `/login?next=...` при `401`
- optimistic updates только там, где rollback тривиален

## 6. Backend architecture

### Auth

- `register` и `login` устанавливают `httpOnly` JWT cookie
- middleware достаёт `userId` из cookie и резолвит current user
- все защищённые роуты проходят через auth preHandler
- campaign-level guard проверяет `Campaign.ownerId` или активный `Membership`

### Access rules

Источник истины:

- мастер кампании определяется только через `Campaign.ownerId`
- участие в кампании определяется только через активный `Membership`, где `leftAt IS NULL`
- исторические membership не удаляются, а закрываются временем выхода

Эти правила должны совпадать с [requirements.md](/Users/polinashchetkina/project/taverna/ai/docs/requirements.md:1), [data-model.md](/Users/polinashchetkina/project/taverna/ai/docs/data-model.md:1) и [api.md](/Users/polinashchetkina/project/taverna/ai/docs/api.md:1).

### Transaction hotspots

Транзакции обязательны для:

- регистрации пользователя
- создания кампании вместе с owner membership
- join по invite token
- выхода или исключения из кампании
- удаления кампании
- ротации invite token при конкурентных запросах

## 7. Границы данных

- `packages/contracts` содержит только контракты и валидацию, без UI-логики и без Prisma client
- `apps/api` владеет persistence-логикой и SQL/Prisma-решениями
- `apps/web` не знает о схеме БД и работает только через API DTO
- markdown в заметках хранится как текст; рендер markdown не нужен для MVP
- обложки кампаний остаются preset-ключами
- связи NPC остаются реляционной моделью; визуальный граф не обязателен для первой сдачи

## 8. Локальная разработка

### Docker Compose

Проверенный локальный запуск:

```bash
docker compose -f infra/compose.dev.yml up --build -d
curl --fail http://127.0.0.1:3000/api/health
```

Он поднимает:

- `postgres`
- `migrate`
- `api`
- `web`

В браузере локальное приложение доступно по `http://127.0.0.1:5173`. Caddy и TLS относятся к production-задаче после появления VPS и домена.

### Dev workflow

1. `pnpm install`
2. `docker compose -f infra/compose.dev.yml up --build -d`
3. Открыть `http://127.0.0.1:5173`
4. Проверить `curl --fail http://127.0.0.1:3000/api/health`

Цель foundation: один разработчик поднимает проект локально без ручной синхронизации типов между web и api.

## 9. Production deploy

### Server topology

- VPS с Docker Engine и Compose plugin
- один публичный домен
- `Caddy 2.11` завершает TLS и маршрутизирует трафик
- `apps/web` собирается в multi-stage image и обслуживается Caddy
- `apps/api` доступен только внутри docker network и через прокси

### Same-origin routing

- `https://domain.tld/` -> `web`
- `https://domain.tld/api/*` -> `api`
- `https://domain.tld/api/health` используется для smoke после деплоя

Почему это решение лучше для MVP:

- cookie-auth проще и надёжнее на одном origin
- не нужен отдельный CORS-контур
- проще объяснить и проверить end-to-end путь на демо

## 10. CI/CD

Целевая цепочка Task 005:

1. push в `main`
2. `GitHub Actions` ставит зависимости и запускает quality gates из [testing.md](/Users/polinashchetkina/project/taverna/ai/docs/testing.md:1)
3. собираются Docker-образы `web` и `api`
4. образы публикуются в `GHCR`
5. workflow делает `SSH` на сервер
6. сервер выполняет `docker compose pull` и `docker compose up -d`
7. smoke-check бьёт в `https://domain.tld/api/health`

Сейчас в репозитории есть только quality workflow (install, migration, lint, typecheck, test, build); GitHub remote, публикация в GHCR и SSH deploy ещё не созданы. До появления VPS и домена их нельзя проверять как завершённые.

## 11. План выполнения

Канонический четырёхдневный schedule, hard stops и contingency cuts находятся в [`.omx/plans/taverna-mvp-4-days.md`](/Users/polinashchetkina/project/taverna/.omx/plans/taverna-mvp-4-days.md:1). Архитектурный документ не дублирует календарный план, чтобы они не расходились.

## 12. Scope guardrails

- без SSR
- без Redux
- без отдельного BFF
- без загрузки файлов
- без websocket/realtime
- без Redis
- без canvas-графа NPC как обязательной фичи первого релиза

## 13. Definition of done

Архитектура считается принятой, если:

- проект поднимается локально без ручного копирования типов между `web` и `api`
- `packages/contracts` является единым источником DTO и `zod`-валидации
- доступ к кампании реализован через `ownerId` и активные `membership`
- локальная Compose-топология воспроизводима и healthcheck подтверждает БД
- production доступен по одному HTTPS origin через `Caddy` после выполнения Task 005
- seed наполняет приложение данными, чтобы ссылка для судей не вела в пустой интерфейс

## 14. Источники версий и совместимости

- [Node.js release lines](https://nodejs.org/en/about/previous-releases)
- [React versions](https://react.dev/versions)
- [Vite releases](https://vite.dev/releases)
- [Fastify v5 reference](https://fastify.dev/docs/latest/Reference/)
- [Prisma 7 requirements and upgrade notes](https://docs.prisma.io/docs/orm/v6/more/upgrades/to-v7)
- [Gravity UI UIKit](https://gravity-ui.com/libraries/uikit)
- [Caddy automatic HTTPS](https://caddyserver.com/docs/quick-starts/https)
