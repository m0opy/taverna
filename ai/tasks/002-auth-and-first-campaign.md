# Task 002: Auth And First Campaign

Цель этапа: к концу Thursday, July 30, 2026 закрыть первый обязательный вертикальный срез MVP.

## Статус

Завершена 30 июля 2026. Вертикальный срез auth → campaign → invite/join реализован и проверен через `pnpm check`, API integration tests на отдельной PostgreSQL БД, Docker Compose healthcheck и ручной browser smoke с двумя последовательными пользовательскими сессиями.

## Scope

- регистрация
- логин
- логаут
- восстановление сессии через `GET /api/auth/me`
- дашборд `/campaigns`
- создание кампании
- просмотр `/c/:id`
- preview invite
- join flow
- редиректы `next` и возврат на `/join/:token`

## Why this slice first

Если этот срез не работает end-to-end, всё остальное не имеет смысла:

- нет входа в продукт;
- нет первой кампании;
- нельзя показать основную архитектуру;
- нельзя быстро проверить доступы и `membership`.

## Deliverables

### Backend

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/campaigns`
- `POST /api/campaigns`
- `GET /api/campaigns/:id`
- `GET /api/invites/:token`
- `POST /api/invites/:token/join`
- `PATCH /api/campaigns/:id/me`

### Frontend

- лендинг `/`
- страницы `/login` и `/register`
- защищённый layout с редиректом на логин
- дашборд кампаний
- форма создания кампании
- страница кампании с участниками, synopsis, next session block
- страница join с тремя состояниями

### Shared/domain

- auth schemas
- campaign create/update schemas
- join invite schema
- mapping role from `ownerId`

## Acceptance criteria

- пользователь может зарегистрироваться и сразу попасть на `/campaigns`
- после перезагрузки страницы сессия остаётся активной
- новый пользователь может создать кампанию и попасть на `/c/:id`
- владелец видит invite link на странице кампании
- неавторизованный пользователь открывает `/join/:token`, проходит логин/регистрацию и возвращается на тот же join flow
- авторизованный пользователь может вступить в кампанию и попасть на `/c/:id`
- повторное вступление в ту же кампанию даёт корректный `409`
- неучастник получает `403` на `/c/:id`

## Checklist

- [x] Поднять cookie auth
- [x] Настроить `me` bootstrap на frontend
- [x] Реализовать route guards
- [x] Сделать create campaign transaction
- [x] Реализовать invite preview
- [x] Реализовать join transaction c new membership
- [x] Пройти smoke сценарий вручную

## Smoke scenario

1. Гость открывает `/`.
2. Переходит в регистрацию.
3. Создаёт аккаунт.
4. Попадает на пустой `/campaigns`.
5. Создаёт первую кампанию.
6. Открывает её invite link в новой вкладке.
7. Разлогинивается.
8. Регистрирует второй аккаунт.
9. Возвращается в `/join/:token`.
10. Заполняет персонажа и вступает.

## Risks

- неправильная обработка `next` после логина
- потеря `join token` между страницами login/register
- гонка при повторном join и проверке лимита участников
- смешение `userId` и `membershipId` в доступах к заметкам и NPC позже

## Exit condition

Этап завершён, когда приложение уже можно показать как живой продукт: есть логин, кампания, участники и инвайт, а не только голый каркас.
