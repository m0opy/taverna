# Task 005: Release And Production

Цель: сделать MVP воспроизводимым, проверяемым и доступным по публичной ссылке.

## Scope

- создать GitHub repository/remote и первый осмысленный commit;
- включить GitHub Actions quality workflow; добавить один E2E smoke только после готовности guest flow;
- README: локальный запуск, demo, topology, ограничения и checklist;
- подготовить production Compose/Caddy и runbook;
- после предоставления VPS и домена: DNS, HTTPS, production smoke, persistence check;
- GHCR + SSH deploy только если инфраструктура доступна до дедлайна.

## Acceptance criteria

- локально `pnpm check` и Docker health smoke проходят с нуля;
- чистый browser проходит guest flow без ошибок;
- GitHub Actions запускает install, migration, lint, typecheck, tests и build;
- при наличии VPS/домена `https://<domain>/api/health` возвращает `200`, HTTPS валиден, а данные переживают restart;
- README не заявляет о непроверенном автоматическом деплое.

## External dependency

Публичный URL требует VPS и домена. Их покупка или выбор провайдера не выполняются автоматически: до такого решения можно полностью закрыть локальный release checklist и подготовить конфигурацию.

## Scope cut order

Оставить один E2E happy path и ручной production smoke. Не заявлять GHCR/SSH deploy как готовый, если он не был реально пройден.

## Exit condition

Есть проверенная ссылка для судей либо, если инфраструктура ещё не предоставлена, полностью готовый к развёртыванию production пакет с честно указанным ограничением.
