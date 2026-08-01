# Taverna — project context

Этот файл — быстрый вход для coding-агента. Он не заменяет canonical docs: его задача — дать текущую картину, границы работы и команды, чтобы агент не начинал с устаревших предположений.

## Текущий статус

| Область | Состояние | Что важно помнить |
|---|---|---|
| Monorepo и Docker Compose | готово локально | `postgres → migrate → api → web`, `/api/health` отвечает `200` |
| Shared contracts | готово для текущих срезов | Zod-схемы и DTO находятся в `packages/contracts` |
| Auth/session | реализовано | регистрация, логин, logout, `me`, cookie session |
| Campaigns | реализовано частично | создание, просмотр, memberships, invites и join flow доступны |
| Character update | реализовано | участник может изменить имя персонажа через campaign membership flow |
| Notes | MVP срез закрыт локально | контракт, API CRUD, права, frontend Notes page и локальный owner/player smoke проверены; production не проверен |
| NPC | следующий срез | целевой контракт есть, CRUD и relations ещё нужно закрыть |
| Guest/demo seed | запланировано | не считать готовым до ручного smoke в чистом браузере |
| Production | не проверено | VPS, домен, HTTPS и автоматический deploy не считать настроенными |

Текущая цель до feature freeze: закрыть Notes, затем NPC/demo, затем пройти release gate. Не расширять MVP параллельными экспериментами со стеком.

## Стек и границы

- Workspace: pnpm monorepo; приложения — `apps/web` и `apps/api`, общий пакет — `packages/contracts`.
- Frontend: React + TypeScript + Vite + React Router, React Query для server state, Zustand только для локального UI state.
- Backend: Fastify + Prisma + PostgreSQL; HTTP-слой не должен содержать бизнес-правила и прямые Prisma-запросы вперемешку.
- UI: FSD-lite (`app`, `pages`, `widgets`, `features`, `entities`, `shared`) и CSS Modules для компонентных/страничных стилей.
- Infra: Docker Compose локально; Caddy/GHCR/SSH — только после отдельной проверки production.

Подробная структура и ограничения находятся в [docs/architecture.md](./docs/architecture.md), схема — в [docs/data-model.md](./docs/data-model.md), контракты — в [docs/api.md](./docs/api.md).

## Порядок чтения и источник истины

1. [requirements.md](./docs/requirements.md) — зачем и что входит в MVP.
2. [architecture.md](./docs/architecture.md) — как устроены приложения и инфраструктура.
3. [data-model.md](./docs/data-model.md) — таблицы, связи и инварианты.
4. [api.md](./docs/api.md) — публичные request/response и error codes.
5. [testing.md](./docs/testing.md) — минимальные проверки и release gates.
6. Исходный код и существующие тесты — фактическое поведение, которое нельзя описывать предположениями.

Если docs и код расходятся, сначала зафиксировать расхождение в задаче; не молча поддерживать две версии правды.

## Команды

```bash
pnpm install
pnpm check
docker compose -f infra/compose.dev.yml up --build -d
curl --fail http://127.0.0.1:3000/api/health
```

API integration tests используют реальную PostgreSQL:

```bash
TEST_DATABASE_URL='postgresql://taverna:taverna@127.0.0.1:5432/taverna?schema=public' \
  pnpm --filter @taverna/api exec vitest run test/auth-campaigns.integration.spec.ts
```

Полный список тестов, условия запуска и известные gaps — в [docs/testing.md](./docs/testing.md).

## Правила безопасного изменения

- Не менять публичный API, Prisma-модель или структуру FSD только ради эстетики без обновления соответствующего canonical doc.
- Не добавлять зависимости без отдельной необходимости: сначала использовать существующий стек и утилиты.
- Перед cleanup сначала найти существующие тесты и закрепить поведение; для docs-only cleanup достаточно проверить ссылки, diff и quality gates.
- Для новой функции держать границу: contract → backend service/policy → integration test → client query/mutation → UI → smoke.
- Не переносить тесты и не менять тестовый runner в рамках feature-рефакторинга без отдельного шага миграции.
