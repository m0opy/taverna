# Skill: Release Verifier

## Цель

Проверить, что MVP воспроизводим локально и что публичный deploy не объявлен готовым без фактического smoke.

## Local release gate

Последовательно выполнить:

```bash
pnpm check
docker compose -f infra/compose.dev.yml up --build -d
curl --fail http://127.0.0.1:3000/api/health
```

После этого вручную проверить критический flow в чистом browser context: landing → auth/guest → campaigns → campaign detail → refresh. Для совместного сценария использовать две независимые сессии.

## Production gate

Считать production проверенным только после фактического результата:

- HTTPS URL открывается без certificate error;
- `/api/health` отвечает `200` через публичный origin;
- auth cookie и API работают через same-origin proxy;
- данные переживают restart контейнеров;
- CI job и deploy log завершились успешно.

Наличие `compose.prod.yml`, Caddyfile или workflow само по себе не доказывает deploy.

## Отчёт перед сдачей

- перечислить команды и фактические результаты;
- указать commit/branch и публичный URL, если он реально проверен;
- назвать непроверенные части, инфраструктурные зависимости и scope cuts;
- не скрывать warnings, skipped tests или отсутствие production smoke.

## Приоритет при нехватке времени

Сначала `pnpm check`, Docker health, guest happy path и основные права доступа. Затем E2E/visual polish. Автоматический GHCR/SSH deploy не добавлять в последний момент без повторяемого локального и серверного smoke.
