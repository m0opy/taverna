# «Таверна» — стратегия тестирования MVP

Документ задаёт минимально достаточную проверку для 4-дневного релиза. Цель не в полном покрытии, а в том, чтобы не сломать auth, доступы и ключевые сценарии из [requirements.md](/Users/polinashchetkina/project/taverna/ai/docs/requirements.md:129).

> Статус: доступны `pnpm check`, Docker smoke `GET /api/health`, contracts/web tests и API integration suite для auth/campaign/invite/Notes flow. Notes integration и локальный owner/player smoke пройдены с PostgreSQL; NPC, guest/demo, Playwright E2E и production smoke остаются gaps следующих срезов.

## 1. Что считаем обязательным

До деплоя должны быть проверены:

- регистрация, логин, логаут, восстановление сессии
- создание кампании
- просмотр дашборда и кампании
- invite preview и join
- редактирование персонажа
- заметки CRUD
- NPC CRUD
- исключение участника и выход игрока
- seed и guest login
- `/api/health`

## 2. Пирамида тестов

### Unit

Покрывают:

- `zod`-схемы
- функции форматирования дат и группировки заметок
- policy helpers: `isCampaignOwner`, `isActiveMember`, `canEditNote`
- нормализацию тегов
- генерацию invite token

### Integration

Покрывают backend модули с реальной тестовой БД:

- auth routes
- campaign create/get/update/delete
- invite preview/join/rotate
- membership leave/remove
- notes CRUD permissions
- NPC CRUD with relations

Интеграционные тесты дают больше пользы, чем глубокие unit-тесты репозиториев.

### E2E / smoke

Обязательный быстрый сценарий судьи:

1. Открыть `/` в чистом browser context.
2. Нажать «Войти как гость».
3. Увидеть две наполненные кампании и открыть player campaign.
4. Открыть заметки и NPC, убедиться, что seed отображается.

Второй критический сценарий проверяет совместную работу: context A регистрируется и создаёт campaign, context B открывает invite, проходит auth, заполняет персонажа и вступает; context A после refresh видит нового участника. Он обязателен до финальной сдачи, но при проблемах с Playwright должен быть покрыт API integration и полностью пройден вручную на production.

## 3. Набор обязательных тест-кейсов

### Auth

- успешная регистрация создаёт пользователя и ставит cookie
- регистрация с email в другом регистре конфликтует с существующим пользователем
- логин с неверным паролем возвращает `401`
- `/api/auth/me` без cookie возвращает `401`
- logout очищает cookie

### Campaigns

- создание кампании создаёт campaign и owner membership в одной транзакции
- пользователь не может создать 21-ю кампанию
- игрок не может `PATCH /api/campaigns/:id`
- неучастник получает `403` на `GET /api/campaigns/:id`

### Invites and membership

- invite preview показывает название, обложку, owner name, количество участников
- join создаёт новый active membership
- повторный join тем же пользователем даёт `409`
- бывший участник после `leftAt` может войти снова и получить новый membership
- rotate invite делает старый токен невалидным
- кампания с 20 активными участниками не принимает нового игрока

### Notes

- игрок может создать заметку
- игрок не может редактировать чужую заметку
- мастер может редактировать и удалить чужую заметку
- заметки без `sessionDate` попадают в группу "Без привязки к сессии"
- note автора после исключения автора всё ещё читается с историческим именем персонажа

### NPC

- участник может создать NPC
- участник может редактировать NPC, созданный другим участником
- нельзя создать relation на самого себя
- relation удаляются каскадно при удалении NPC
- tag filter возвращает только NPC с указанным тегом

### UI behavior

- защищённый роут без сессии редиректит на `/login?next=...`
- авторизованный пользователь на `/login` редиректится на `/campaigns`
- при ошибке 500 данные формы не теряются
- кнопки сабмита блокируются на время запроса

## 4. Что тестировать вручную

Есть сценарии, которые проще и дешевле пройти руками:

- responsive layout от 360px
- фокус-стейты и `aria-label`
- тосты и пустые состояния
- переключатель кампаний
- skeleton states
- copy-to-clipboard поведение
- экран недействительного инвайта
- подтверждение удаления кампании и исключения участника

## 5. Smoke checklist перед релизом

Этот список пройти в воскресенье перед отправкой ссылки:

1. Открыть продовый URL в чистом браузере.
2. Проверить HTTPS и отсутствие mixed content.
3. Нажать `Войти как гость`.
4. Убедиться, что у демо-пользователя есть две кампании.
5. Проверить, что в одной кампании он игрок, в другой мастер.
6. Открыть заметки, NPC, настройки.
7. Проверить invite link и rotate token.
8. Разлогиниться и зарегистрировать новый аккаунт.
9. Вступить в кампанию по ссылке.
10. Проверить `/api/health`.

## 6. Инструменты

Рекомендуемый минимальный набор:

- `Vitest 4.1.10` для unit/integration на web/contracts/API
- встроенный `fastify.inject()` для API integration; `supertest` не добавляем
- Playwright для smoke E2E в Chromium — целевая зависимость Task 005, не текущая установленная библиотека
- отдельный PostgreSQL service в CI; SQLite и mocks Prisma не используются

Если дедлайн горит, сначала делаются integration-тесты API, затем один Playwright happy path. Ручной smoke не заменяет автоматическую проверку прав и транзакционных инвариантов.

## 7. Команды и CI gates

Сейчас исполнимые проверки:

```bash
pnpm check
docker compose -f infra/compose.dev.yml up --build -d
curl --fail http://127.0.0.1:3000/api/health
```

API integration suite уже существует и запускается через Vitest при заданном `TEST_DATABASE_URL`; отдельный root script для неё пока не добавлен. `pnpm test:e2e` и Playwright остаются задачей release-среза после готовности guest flow.

Без `TEST_DATABASE_URL` общий `pnpm check` намеренно обнаруживает API integration file, но пропускает его database-dependent tests. Для release evidence integration-команду нужно запускать с локальной PostgreSQL и фиксировать результат `3 passed, 0 skipped` для текущего auth/campaign набора.

Целевой порядок в CI: дешёвые проверки падают раньше дорогих. Integration job поднимает PostgreSQL 18, выполняет `prisma migrate deploy`, запускает тесты на отдельной БД и всегда удаляет данные job вместе с service container. E2E стартует production builds web/API, а не Vite dev server.

Минимальные merge gates для `main`: lint, typecheck, unit, integration и build. Playwright обязателен перед production deploy; trace и screenshot прикладываются к failed GitHub Actions run.

## 8. Definition of done for quality

Можно считать MVP готовым только если:

- все обязательные integration-тесты зелёные;
- smoke checklist пройден на проде;
- seed создаёт непустой демо-мир;
- после рестарта контейнеров auth и данные остаются рабочими;
- нет известных `401/403/404` в happy-path сценариях.
- production `GET /api/health` возвращает `200` после cold restart;
- в browser console нет uncaught errors, mixed content и failed API requests в smoke flow.
