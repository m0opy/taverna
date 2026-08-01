# «Таверна» — HTTP API MVP

Документ конкретизирует [requirements.md](/Users/polinashchetkina/project/taverna/ai/docs/requirements.md:1) и фиксирует внешний контракт для `apps/web` и `apps/api`. Все request/response schemas живут в `packages/contracts`, валидируются общими Zod-схемами и должны совпадать с этим документом.

> Статус: `GET /api/health`, auth, campaigns, invite preview/join, memberships и character update реализованы. Notes, NPC, guest/demo и часть campaign controls пока остаются контрактами для следующих срезов; не считать их доступными только потому, что они описаны ниже.

## 1. Общие правила

- Base path: `/api`.
- В production SPA и API будут работать на одном origin за `Caddy`; в локальном Compose healthcheck ходит напрямую в API на порту `3000`.
- Формат ответов: `application/json; charset=utf-8`.
- Идентификаторы: UUID strings.
- Даты без времени: строки `YYYY-MM-DD`.
- Timestamps: ISO 8601 UTC strings.
- Клиент отправляет cookie через `credentials: 'include'`.
- Неизвестные поля body отклоняются через `z.strictObject(...)`.
- Успешные ответы не оборачиваются в универсальный `{data}`.
- `204 No Content` используется для logout и delete.

### Auth cookie

- Имя: `taverna_session`
- Тип: JWT
- Lifetime: 7 дней
- Flags в production: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`
- В dev `Secure=false` допустим только при `NODE_ENV=development`

### Формат ошибки

```json
{
  "error": {
    "code": "CAMPAIGN_FULL",
    "message": "В кампании нет свободных мест",
    "fields": {
      "characterName": "Имя персонажа от 2 до 40 символов"
    },
    "meta": {
      "campaignId": "uuid"
    },
    "requestId": "req-01J..."
  }
}
```

- `fields` присутствует только для field-level validation.
- `meta` используется только там, где UI должен принять решение по данным ошибки.
- `requestId` нужен для логов и трассировки.

### HTTP-статусы и доменные коды

| HTTP | `error.code` |
|---:|---|
| `400` | `VALIDATION_ERROR`, `CONFIRMATION_MISMATCH`, `OWNER_CANNOT_LEAVE`, `NPC_SELF_RELATION`, `TOO_MANY_RELATIONS`, `CHARACTER_NAME_REQUIRED` |
| `401` | `UNAUTHORIZED`, `INVALID_CREDENTIALS`, `SESSION_EXPIRED` |
| `403` | `CAMPAIGN_FORBIDDEN`, `FORBIDDEN` |
| `404` | `NOT_FOUND`, `INVITE_INVALID`, `ACTIVE_MEMBERSHIP_NOT_FOUND`, `RELATED_NPC_NOT_FOUND` |
| `409` | `EMAIL_TAKEN`, `ALREADY_MEMBER`, `CAMPAIGN_FULL`, `CAMPAIGN_LIMIT_REACHED`, `NOTE_LIMIT_REACHED`, `NPC_LIMIT_REACHED`, `CONFLICT` |
| `429` | `RATE_LIMITED` |
| `500` | `INTERNAL_ERROR` |

## 2. Общие DTO

### `CoverKey`

```ts
type CoverKey =
  | 'forest'
  | 'dungeon'
  | 'tavern'
  | 'sea'
  | 'mountains'
  | 'city';
```

### `UserDto`

```ts
type UserDto = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};
```

### `MembershipDto`

```ts
type MembershipDto = {
  id: string;
  user: {
    id: string;
    name: string;
  };
  characterName: string | null;
  characterClass: string | null;
  characterInfo: string | null;
  joinedAt: string;
  isOwner: boolean;
};
```

В списки участников попадают только активные memberships. Исторические memberships раскрываются только как snapshot автора внутри заметок и NPC.

### `CampaignSummaryDto`

```ts
type CampaignSummaryDto = {
  id: string;
  title: string;
  coverKey: CoverKey;
  nextSessionAt: string | null;
  membersCount: number;
  myRole: 'master' | 'player';
};
```

### `CampaignDetailDto`

```ts
type CampaignDetailDto = CampaignSummaryDto & {
  synopsis: string;
  ownerId: string;
  inviteUrl: string | null;
  myMembershipId: string;
  members: MembershipDto[];
  createdAt: string;
};
```

`inviteUrl` возвращается только мастеру; игрок получает `null`.

### `AuthorDto`

```ts
type AuthorDto = {
  membershipId: string;
  userName: string;
  characterName: string | null;
  isActive: boolean;
};
```

### `InvitePreviewDto`

```ts
type InvitePreviewDto = {
  campaignId: string;
  title: string;
  synopsis: string;
  coverKey: CoverKey;
  membersCount: number;
  ownerName: string;
  isFull: boolean;
};
```

### `NoteDto`

```ts
type NoteDto = {
  id: string;
  campaignId: string;
  author: AuthorDto;
  body: string;
  sessionDate: string | null;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
  canDelete: boolean;
};
```

### `NpcRelationDto`

```ts
type NpcRelationDto = {
  id: string;
  toNpc: {
    id: string;
    name: string;
  };
  label: string;
};
```

### `NpcDto`

```ts
type NpcDto = {
  id: string;
  campaignId: string;
  createdBy: AuthorDto;
  name: string;
  title: string;
  attitude: 'ally' | 'neutral' | 'enemy' | 'unknown';
  tags: string[];
  notes: string;
  relations: NpcRelationDto[];
  createdAt: string;
  updatedAt: string;
};
```

## 3. Авторизация

Rate limit для `POST /auth/register` и `POST /auth/login`: 10 запросов за 60 секунд на IP. При `429` сервер отдаёт `Retry-After`.

### `POST /auth/register`

Auth: public.

```ts
type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};
```

Валидация:

- `name`: `trim`, 2..40
- `email`: `trim`, lowercase, valid email
- `password`: 8..128

Успех `201`:

```json
{
  "id": "uuid",
  "name": "Полина",
  "email": "polina@example.com",
  "createdAt": "2026-07-29T18:00:00.000Z"
}
```

Побочный эффект: сервер сразу ставит auth cookie.

Ошибка: `409 EMAIL_TAKEN` с `fields.email`.

### `POST /auth/login`

Auth: public.

```ts
type LoginRequest = {
  email: string;
  password: string;
};
```

Успех `200`: `UserDto` + Set-Cookie.

Ошибка: одинаковый `401 INVALID_CREDENTIALS` и для неизвестного email, и для неверного пароля.

### `POST /auth/logout`

Auth: optional. Всегда `204`; cookie очищается, даже если уже истекла или невалидна.

### `GET /auth/me`

Auth: required.

Успех `200`: `UserDto`

Ошибка: `401 SESSION_EXPIRED`

## 4. Кампании и участники

Все `/campaigns/:campaignId/**` сначала проверяют:

1. кампания существует;
2. у пользователя есть активный membership этой кампании.

Если второго условия нет, сервер возвращает `403 CAMPAIGN_FORBIDDEN`, а не `404`.

### `GET /campaigns`

Auth: required.

Ответ:

```ts
type CampaignListResponse = {
  items: CampaignSummaryDto[];
};
```

Возвращаются только кампании с активным membership текущего пользователя.

### `POST /campaigns`

Auth: required.

```ts
type CreateCampaignRequest = {
  title: string;
  synopsis?: string;
  coverKey: CoverKey;
};
```

Успех `201`: `CampaignDetailDto`

Правила:

- `title`: `trim`, 2..60
- `synopsis`: `trim`, max 500, отсутствие нормализуется в `''`
- кампания и owner membership создаются атомарно
- лимит: максимум 20 кампаний у пользователя

Ошибка: `409 CAMPAIGN_LIMIT_REACHED`

### `GET /campaigns/:campaignId`

Auth: active member.

Успех `200`: `CampaignDetailDto`

### `PATCH /campaigns/:campaignId`

Auth: master.

```ts
type UpdateCampaignRequest = {
  title?: string;
  synopsis?: string;
  coverKey?: CoverKey;
  nextSessionAt?: string | null;
};
```

Правила:

- partial update разрешён
- минимум одно поле обязательно
- `nextSessionAt` сериализуется строго как `YYYY-MM-DD`

Успех `200`: `CampaignDetailDto`

### `DELETE /campaigns/:campaignId`

Auth: master.

```ts
type DeleteCampaignRequest = {
  confirmationTitle: string;
};
```

`confirmationTitle` должен совпасть с текущим `title` после `trim`.

Успех: `204`

Ошибка: `400 CONFIRMATION_MISMATCH`

### `POST /campaigns/:campaignId/invite/rotate`

Auth: master.

Body отсутствует.

Успех `200`:

```json
{
  "inviteUrl": "https://example.com/join/newToken123"
}
```

После ответа старый token недействителен.

### `PATCH /campaigns/:campaignId/me`

Auth: active member.

```ts
type UpdateCharacterRequest = {
  characterName?: string | null;
  characterClass?: string | null;
  characterInfo?: string | null;
};
```

Правила:

- игрок не может очистить `characterName`
- мастер может хранить `characterName: null`
- пустые `characterClass` и `characterInfo` нормализуются в `null`

Успех `200`: `MembershipDto`

Ошибка: `400 CHARACTER_NAME_REQUIRED`

### `DELETE /campaigns/:campaignId/members/:membershipId`

Auth:

- мастер может исключить любого активного участника, кроме себя;
- игрок может удалить только собственный активный membership, то есть выйти сам.

Body отсутствует.

Успех: `204`

После успеха у membership выставляется `leftAt`.

Ошибки:

- `400 OWNER_CANNOT_LEAVE`
- `404 ACTIVE_MEMBERSHIP_NOT_FOUND`

## 5. Приглашения

### `GET /invites/:token`

Auth: public.

Успех `200`: `InvitePreviewDto`

Правила:

- endpoint не возвращает список участников;
- токен не возвращается в body;
- `isFull=true` не отменяет `200`, чтобы экран мог показать кампанию и причину недоступности.

Ошибка: `404 INVITE_INVALID`

### `POST /invites/:token/join`

Auth: required.

```ts
type JoinCampaignRequest = {
  characterName: string;
  characterClass?: string;
  characterInfo?: string;
};

type JoinCampaignResponse = {
  campaignId: string;
  membership: MembershipDto;
};
```

Правила:

- `characterName`: `trim`, 2..40
- join выполняется в транзакции
- historical membership не переиспользуется
- повторный join защищён частичным уникальным индексом активного membership

Успех `201`: `JoinCampaignResponse`

Ошибки:

- `404 INVITE_INVALID`
- `409 ALREADY_MEMBER` с `meta.campaignId`
- `409 CAMPAIGN_FULL`

## 6. Заметки

### `GET /campaigns/:campaignId/notes`

Auth: active member.

Ответ:

```ts
type NoteListResponse = {
  items: NoteDto[];
};
```

Сортировка:

- `sessionDate DESC NULLS LAST`
- внутри даты: `createdAt DESC`

Клиент группирует уже отсортированный список и подписывает `null` как «Без привязки к сессии».

### `POST /campaigns/:campaignId/notes`

Auth: active member.

```ts
type NoteWriteRequest = {
  body: string;
  sessionDate?: string | null;
};
```

Правила:

- `body`: 1..5000 после `trim`
- `sessionDate`: `YYYY-MM-DD` или `null`
- лимит: максимум 500 заметок на кампанию

Успех `201`: `NoteDto`

Ошибка: `409 NOTE_LIMIT_REACHED`

### `PATCH /campaigns/:campaignId/notes/:noteId`

Auth: author или master.

Body: `NoteWriteRequest`

Успех `200`: `NoteDto`

Политика конкурентности: last write wins.

### `DELETE /campaigns/:campaignId/notes/:noteId`

Auth: author или master.

Успех: `204`

Note lookup всегда включает `campaignId` из URL.

## 7. NPC

### `GET /campaigns/:campaignId/npcs`

Auth: active member.

Query:

```ts
type NpcListQuery = {
  tag?: string;
};
```

Ответ:

```ts
type NpcListResponse = {
  items: NpcDto[];
  availableTags: string[];
};
```

Правила:

- фильтр по тегу один, регистронезависимый;
- `availableTags` строится по всем NPC кампании до применения фильтра;
- relations содержат только исходящие связи.

### `POST /campaigns/:campaignId/npcs`

Auth: active member.

```ts
type NpcWriteRequest = {
  name: string;
  title?: string;
  attitude?: 'ally' | 'neutral' | 'enemy' | 'unknown';
  tags?: string[];
  notes?: string;
  relations?: Array<{
    toNpcId: string;
    label: string;
  }>;
};
```

Правила:

- `name`: 1..60 после `trim`
- `title`: max 60, отсутствие нормализуется в `''`
- `tags`: максимум 5, каждый 1..24 после `trim`
- `notes`: max 1000, отсутствие нормализуется в `''`
- `relations`: максимум 5
- create NPC и relations выполняется в одной транзакции
- лимит: максимум 200 NPC на кампанию

Успех `201`: `NpcDto`

Ошибка: `409 NPC_LIMIT_REACHED`

### `PATCH /campaigns/:campaignId/npcs/:npcId`

Auth: любой active member.

Body: полный `NpcWriteRequest`

Успех `200`: `NpcDto`

Правила:

- relations заменяются переданным списком целиком;
- отсутствие relation в payload означает удаление этой исходящей relation;
- входящие relations не меняются.

Ошибки:

- `400 NPC_SELF_RELATION`
- `400 TOO_MANY_RELATIONS`
- `404 RELATED_NPC_NOT_FOUND`

### `DELETE /campaigns/:campaignId/npcs/:npcId`

Auth: любой active member.

Успех: `204`

Входящие и исходящие relations удаляются каскадно.

## 8. Healthcheck

### `GET /health`

Auth: public.

Успех `200`:

```json
{
  "status": "ok",
  "database": "up",
  "version": "git-sha",
  "timestamp": "2026-08-02T18:00:00.000Z"
}
```

Если проверка БД не проходит за 2 секунды, endpoint возвращает `503`:

```json
{
  "status": "degraded",
  "database": "down"
}
```

Container healthcheck обращается к API напрямую; post-deploy smoke после настройки production будет обращаться к тому же endpoint через публичный `Caddy` origin.

## 9. Вне API MVP

Refresh tokens, password reset, OAuth, file upload, inventory, dedicated sessions, comments, notifications, realtime, search, markdown, cursor pagination, публичный OpenAPI UI и отдельный endpoint для визуального графа связей.
