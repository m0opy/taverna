# Taverna — AI context

Каталог `ai/` — короткий рабочий контекст проекта для человека и coding-агентов. Он описывает зафиксированные решения, текущий статус и правила изменения кода; здесь не должно быть дубликатов реализации или устаревших prompt-файлов.

## С чего начинать агенту

1. Прочитать [project-context.md](./project-context.md).
2. Для границ продукта открыть [docs/requirements.md](./docs/requirements.md).
3. Для устройства системы открыть [docs/architecture.md](./docs/architecture.md) и [docs/data-model.md](./docs/data-model.md).
4. Для HTTP-контракта открыть [docs/api.md](./docs/api.md).
5. Для проверок открыть [docs/testing.md](./docs/testing.md).
6. Прочитать skill, соответствующий работе, и только затем брать task.

## Skills

- [context-loader](./skills/context-loader/SKILL.md) — обязательная загрузка контекста перед работой.
- [frontend-architecture](./skills/frontend-architecture/SKILL.md) — FSD-lite, границы слоёв и CSS Modules.
- [feature-slice](./skills/feature-slice/SKILL.md) — порядок реализации вертикального среза.
- [testing-and-quality](./skills/testing-and-quality/SKILL.md) — выбор уровня теста и quality gates.
- [release-verifier](./skills/release-verifier/SKILL.md) — локальная и production-проверка перед сдачей.

## Активные задачи

- [Task 003: Notes and campaign controls](./tasks/003-notes-and-campaign-controls.md)
- [Task 004: NPC and demo](./tasks/004-npc-and-demo.md)
- [Task 005: Release and production](./tasks/005-release-and-production.md)

Завершённые задачи не хранятся как отдельные prompt-файлы: факт реализации фиксируется в canonical docs, тестах и git history. План по срокам находится в [.omx/plans/taverna-mvp-4-days.md](../.omx/plans/taverna-mvp-4-days.md).

## Правила работы

- `requirements.md` — источник истины для scope; `architecture.md` — для структуры и стека; `api.md` — для HTTP; `data-model.md` — для схемы и инвариантов; `testing.md` — для проверок.
- Сначала уточнить контракт и тестируемое поведение, затем менять код. Не добавлять слой, библиотеку или абстракцию без конкретной причины.
- Реализовывать вертикальными срезами: contracts → API → интеграционные проверки → client data → UI → smoke.
- Не объявлять задачу готовой по одному `build`: нужны подходящие тесты, typecheck/lint и ручной smoke критического сценария.
- Статус в документации должен соответствовать коду и последней проверке; непроверенный production не выдавать за готовый.

## Базовые команды

```bash
pnpm check
docker compose -f infra/compose.dev.yml up --build -d
curl --fail http://127.0.0.1:3000/api/health
```

Для API integration tests нужна локальная PostgreSQL и `TEST_DATABASE_URL`; подробности и ограничения описаны в [docs/testing.md](./docs/testing.md).
