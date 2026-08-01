# Prompt: Task 002 — Auth And First Campaign

Ты работаешь в репозитории `/Users/polinashchetkina/project/taverna`. Выполни полностью [Task 002](/Users/polinashchetkina/project/taverna/ai/tasks/002-auth-and-first-campaign.md:1): первый вертикальный срез «регистрация → создание кампании → invite → вступление второго пользователя».

## Контекст и источники истины

Перед началом прочитай:

- [requirements.md](/Users/polinashchetkina/project/taverna/ai/docs/requirements.md:1) — продуктовые требования;
- [architecture.md](/Users/polinashchetkina/project/taverna/ai/docs/architecture.md:1) — стек и границы слоёв;
- [data-model.md](/Users/polinashchetkina/project/taverna/ai/docs/data-model.md:1) — Prisma-модель и инварианты;
- [api.md](/Users/polinashchetkina/project/taverna/ai/docs/api.md:1) — целевой контракт API;
- [testing.md](/Users/polinashchetkina/project/taverna/ai/docs/testing.md:1) — проверяемые сценарии;
- текущий код в `apps/`, `packages/contracts/` и `infra/`.

Task 001 уже выполнена локально: Compose поднимает `postgres`, `migrate`, `api`, `web`, а `GET /api/health` работает. Не переделывай foundation и не начинай Notes, NPC, seed/guest login, production deploy или новый CI/CD — это отдельные задачи.

## Дизайн

Есть макеты: https://www.figma.com/design/JT0xX4hjXkOSEx9jS0sRNB/%D0%A2%D0%B0%D0%B2%D0%B5%D1%80%D0%BD%D0%B0-%E2%80%94-%D0%BC%D0%B0%D0%BA%D0%B5%D1%82%D1%8B-MVP?node-id=1-2&t=2A6kY2WikC6voirZ-1

Используй их как ориентир по экранам и функционалу, но не пытайся пиксель-в-пиксель воспроизвести каждый набросок. Текущий визуальный стиль приложения удачный и предпочтителен: продолжай в его вайбе, сохрани палитру, типографику, отступы, компоненты Gravity UI и общую спокойную «тавернную» атмосферу. Новые экраны должны выглядеть как естественное продолжение существующего интерфейса, а не как отдельный шаблон из Figma.

## Что нужно сделать

### Backend и contracts

Реализуй в `packages/contracts` и `apps/api`:

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`;
- cookie JWT session: `httpOnly`, `SameSite=Lax`, `Secure` только в production;
- нормализацию email, безопасное хеширование password через уже установленный argon2, понятные ошибки по контракту;
- `GET /api/campaigns`, `POST /api/campaigns`, `GET /api/campaigns/:id`;
- транзакционное создание campaign вместе с owner membership;
- `GET /api/invites/:token`, `POST /api/invites/:token/join`;
- `PATCH /api/campaigns/:id/me` для character name;
- auth и campaign access guards: owner определяется `Campaign.ownerId`, участник — только активным `Membership` (`leftAt IS NULL`);
- корректные `401`, `403`, `404` и `409` для описанных в task сценариев;
- обработку `204 No Content` в API client, если используешь logout endpoint с `204`, и чтение вложенного error envelope `{ error: { message, code } }`.

Не добавляй зависимости, если это не абсолютно необходимо. Используй Fastify, Prisma, Zod и существующие project patterns.

### Frontend

Реализуй:

- landing `/`, `/register`, `/login`;
- bootstrap `GET /api/auth/me`, публичные и защищённые роуты;
- `next` redirect: неавторизованный пользователь, открывший `/join/:token`, после login/register возвращается на тот же join flow;
- dashboard `/campaigns`, форму `/campaigns/new`, страницу `/c/:id`;
- invite preview с понятными состояниями: валидная ссылка, уже участник, invalid/expired, требуется login;
- форму имени персонажа перед вступлением в кампанию;
- states loading, empty, validation error и server error без потери введённых данных.

Используй TanStack Query для server state и Zustand только для действительно локального UI-state. Соблюдай текущую FSD-lite структуру, не создавай «god component» и не дублируй DTO вручную.

## Обязательные сценарии

1. Пользователь регистрируется и попадает на `/campaigns`.
2. После перезагрузки сессия сохраняется.
3. Пользователь создаёт кампанию и попадает на `/c/:id` как owner.
4. Owner копирует invite link.
5. Второй пользователь открывает ссылку без сессии, проходит регистрацию или login, возвращается в join flow, вводит character name и вступает.
6. Повторный join возвращает `409`, а не создаёт второе активное membership.
7. Неучастник не видит campaign detail и получает `403`; player не получает owner actions.

## Качество и проверка

- Добавь тесты контрактов и API integration tests для register/login/me, campaign create + owner membership, forbidden access, join/rejoin.
- Пройди вручную сценарий выше в двух независимых browser sessions.
- Запусти:

```bash
pnpm check
docker compose -f infra/compose.dev.yml up --build -d
curl --fail http://127.0.0.1:3000/api/health
```

- Обнови статус и checklist [Task 002](/Users/polinashchetkina/project/taverna/ai/tasks/002-auth-and-first-campaign.md:1) только после подтверждённого успешного результата.

## Итоговый отчёт

В конце кратко перечисли: реализованные endpoints и страницы, изменённые файлы, результаты проверок и оставшиеся ограничения. Не заявляй, что deployment, guest demo, Notes или NPC готовы: они вне Task 002.
