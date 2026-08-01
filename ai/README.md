# Taverna AI Docs

Этот каталог превращает [requirements.md](/Users/polinashchetkina/project/taverna/ai/docs/requirements.md:1) в рабочий набор решений для MVP, который нужно собрать за 4 дня.

## Что здесь лежит

- [docs/requirements.md](/Users/polinashchetkina/project/taverna/ai/docs/requirements.md:1) — продуктовые требования и границы MVP.
- [docs/architecture.md](/Users/polinashchetkina/project/taverna/ai/docs/architecture.md:1) — точный стек, структура монорепо и схема деплоя.
- [docs/data-model.md](/Users/polinashchetkina/project/taverna/ai/docs/data-model.md:1) — реляционная модель, инварианты и Prisma/Postgres-решения.
- [docs/api.md](/Users/polinashchetkina/project/taverna/ai/docs/api.md:1) — HTTP-контракты, форматы ошибок и правила доступа.
- [docs/testing.md](/Users/polinashchetkina/project/taverna/ai/docs/testing.md:1) — тестовая стратегия, smoke и release-checklist.
- [четырёхдневный план](/Users/polinashchetkina/project/taverna/.omx/plans/taverna-mvp-4-days.md:1) — календарь 30 июля–2 августа, hard stops, приоритеты P0/P1/P2 и release gate.
- [tasks/001-foundation.md](/Users/polinashchetkina/project/taverna/ai/tasks/001-foundation.md:1) — каркас монорепо, контейнеры, база, healthcheck.
- [tasks/002-auth-and-first-campaign.md](/Users/polinashchetkina/project/taverna/ai/tasks/002-auth-and-first-campaign.md:1) — auth, первая кампания, join flow и базовый UI.
- [tasks/003-notes-and-campaign-controls.md](/Users/polinashchetkina/project/taverna/ai/tasks/003-notes-and-campaign-controls.md:1) — заметки, настройки кампании и проверка прав.
- [tasks/004-npc-and-demo.md](/Users/polinashchetkina/project/taverna/ai/tasks/004-npc-and-demo.md:1) — NPC, связи, demo seed и гостевой вход.
- [tasks/005-release-and-production.md](/Users/polinashchetkina/project/taverna/ai/tasks/005-release-and-production.md:1) — GitHub, production deploy, QA и отправка ссылки.

## Зафиксированное решение

Для MVP принимается один стек без альтернатив по ходу разработки:

- Monorepo: `pnpm workspace` с пакетами `apps/web`, `apps/api`, `packages/contracts`
- Frontend: `React 19.2` + `TypeScript` + `Vite 8.1` + `React Router 7.18` + `@gravity-ui/uikit` + `@tanstack/react-query` + `Zustand`
- Backend: `Node.js` + `Fastify 5.10` + `Prisma 7.9` + `PostgreSQL 18`
- Contracts: `packages/contracts` с `zod`-схемами и общими DTO для web/api
- Infra/dev: `Docker Compose`
- Prod deploy: `Caddy 2.11` как same-origin reverse proxy + `Docker Compose`
- CI/CD: `GitHub Actions` -> `GHCR` -> `SSH` deploy на VPS

Причина выбора: это минимальный по риску стек под известный фронтенд, с нормальной реляционной моделью, общими контрактами и инфраструктурой, которую можно показать на демо без ручной магии на сервере.

## Текущий статус на 30 июля

- Локальный фундамент готов и проверен: `postgres`, `migrate`, `api`, `web` запускаются через Compose; `/api/health` отвечает `200` с доступной БД.
- Реализованы schema/migration, healthcheck, contracts, базовый роутинг и UI shell.
- Auth, campaigns, invites, notes и NPC пока не реализованы: маршруты и backend-модули существуют как заготовки. Их порядок указан в tasks `002`–`004`.
- Production Caddy, GitHub Actions deploy, VPS и домен — целевой следующий release-шаг, а не уже выполненная часть проекта.

## Первый обязательный срез

Пока не закрыт этот сценарий, остальное считается вторичным:

1. Пользователь регистрируется или логинится.
2. Создаёт кампанию.
3. Видит дашборд и страницу кампании.
4. Получает и открывает рабочую invite-ссылку.
5. После перезагрузки остаётся авторизованным.

После этого добавляются NPC, заметки, настройки и полировка по приоритетам из [четырёхдневного плана](/Users/polinashchetkina/project/taverna/.omx/plans/taverna-mvp-4-days.md:1).

## Как читать документы

1. Источник истины по scope: [requirements.md](/Users/polinashchetkina/project/taverna/ai/docs/requirements.md:1).
2. Источник истины по техрешению: [architecture.md](/Users/polinashchetkina/project/taverna/ai/docs/architecture.md:1).
3. Источник истины по схеме и инвариантам: [data-model.md](/Users/polinashchetkina/project/taverna/ai/docs/data-model.md:1).
4. Целевой контракт и error model: [api.md](/Users/polinashchetkina/project/taverna/ai/docs/api.md:1); статус реализации указан в начале документа.
5. Целевая стратегия проверок и текущие доступные gates: [testing.md](/Users/polinashchetkina/project/taverna/ai/docs/testing.md:1).
6. Источник истины по срокам и порядку: [taverna-mvp-4-days.md](/Users/polinashchetkina/project/taverna/.omx/plans/taverna-mvp-4-days.md:1).

## Критические риски дедлайна

- Auth с `httpOnly` cookie и корректным redirect-after-login.
- Join flow с сохранением invite intent и проверкой активного `membership`.
- Исторические `membership` через `leftAt`, а не удаление строк.
- Seed и demo/guest вход, чтобы приложение не выглядело пустым.
- Same-origin HTTPS через `Caddy`: `/api/*` проксируется в `apps/api`, остальное обслуживает `apps/web`.
