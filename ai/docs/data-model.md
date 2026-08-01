# «Таверна» — модель данных MVP

Источник продуктовых ограничений — [requirements.md](/Users/polinashchetkina/project/taverna/ai/docs/requirements.md:1). Этот документ фиксирует реляционную схему для `Prisma 7.9` поверх `PostgreSQL 18-bookworm`, инварианты и решения, которые должны попасть в Prisma schema и SQL migrations.

## 1. Основные решения

- База: `PostgreSQL 18-bookworm`
- ORM: `Prisma 7.9`
- Общие runtime-схемы: `packages/contracts` с Zod
- Даты домена (`nextSessionAt`, `sessionDate`) хранятся как PostgreSQL `date` и на API-границе сериализуются строго как `YYYY-MM-DD`
- Мастер кампании определяется только через `Campaign.ownerId`
- История участия хранится через `Membership.leftAt`, а не через физическое удаление
- Ограничение «не более одного активного membership на пару user/campaign» обеспечивается частичным уникальным индексом и сервисной транзакцией

Отдельных таблиц `sessions`, `characters`, `tags`, `roles` и `inventory_items` в MVP нет. Персонаж является частью конкретного membership, а сессия — это дата на заметке.

## 2. ER-диаграмма

```mermaid
erDiagram
    USER ||--o{ CAMPAIGN : owns
    USER ||--o{ MEMBERSHIP : joins
    CAMPAIGN ||--o{ MEMBERSHIP : has
    CAMPAIGN ||--o{ NOTE : contains
    CAMPAIGN ||--o{ NPC : contains
    MEMBERSHIP ||--o{ NOTE : authors
    MEMBERSHIP ||--o{ NPC : creates
    NPC ||--o{ NPC_RELATION : from
    NPC ||--o{ NPC_RELATION : to

    USER {
      uuid id PK
      varchar name
      varchar email UK
      text passwordHash
      timestamptz createdAt
    }
    CAMPAIGN {
      uuid id PK
      varchar title
      varchar synopsis
      varchar coverKey
      char inviteToken UK
      date nextSessionAt
      uuid ownerId FK
      timestamptz createdAt
    }
    MEMBERSHIP {
      uuid id PK
      uuid userId FK
      uuid campaignId FK
      varchar characterName
      varchar characterClass
      varchar characterInfo
      timestamptz joinedAt
      timestamptz leftAt
    }
    NOTE {
      uuid id PK
      uuid campaignId FK
      uuid authorId FK
      text body
      date sessionDate
      timestamptz createdAt
      timestamptz updatedAt
    }
    NPC {
      uuid id PK
      uuid campaignId FK
      uuid createdById FK
      varchar name
      varchar title
      npc_attitude attitude
      text_array tags
      varchar notes
      timestamptz createdAt
      timestamptz updatedAt
    }
    NPC_RELATION {
      uuid id PK
      uuid fromNpcId FK
      uuid toNpcId FK
      varchar label
    }
```

## 3. Таблицы

### `users`

| Колонка | PostgreSQL | Null | Ограничения |
|---|---|:---:|---|
| `id` | `uuid` | нет | PK, `gen_random_uuid()` или uuid из приложения |
| `name` | `varchar(40)` | нет | длина 2–40 после `trim` |
| `email` | `varchar(254)` | нет | unique, хранится как `trim().toLowerCase()` |
| `password_hash` | `text` | нет | Argon2id |
| `created_at` | `timestamptz(3)` | нет | default `now()` |

Удаление аккаунта вне MVP, поэтому FK к пользователю используют `ON DELETE RESTRICT`.

### `campaigns`

| Колонка | PostgreSQL | Null | Ограничения |
|---|---|:---:|---|
| `id` | `uuid` | нет | PK |
| `title` | `varchar(60)` | нет | 2–60 после `trim` |
| `synopsis` | `varchar(500)` | нет | default `''` |
| `cover_key` | `varchar(16)` | нет | одно из `forest`, `dungeon`, `tavern`, `sea`, `mountains`, `city` |
| `invite_token` | `char(12)` | нет | unique, url-safe |
| `next_session_at` | `date` | да | календарная дата без timezone conversion |
| `owner_id` | `uuid` | нет | FK → `users.id`, `ON DELETE RESTRICT` |
| `created_at` | `timestamptz(3)` | нет | default `now()` |

Инварианты:

- `owner_id` — единственный источник истины о мастере;
- у владельца всегда есть активный membership этой кампании;
- загрузки файлов нет, `cover_key` всегда один из пресетов.

### `memberships`

| Колонка | PostgreSQL | Null | Ограничения |
|---|---|:---:|---|
| `id` | `uuid` | нет | PK |
| `user_id` | `uuid` | нет | FK → `users.id`, `ON DELETE RESTRICT` |
| `campaign_id` | `uuid` | нет | FK → `campaigns.id`, `ON DELETE CASCADE` |
| `character_name` | `varchar(40)` | да | для игрока обязательно, для мастера допустим `null` |
| `character_class` | `varchar(60)` | да | пустое значение нормализуется в `null` |
| `character_info` | `varchar(300)` | да | пустое значение нормализуется в `null` |
| `joined_at` | `timestamptz(3)` | нет | default `now()` |
| `left_at` | `timestamptz(3)` | да | `null` означает активное участие |

Инварианты:

- одновременно существует не более одного активного membership на пару `user_id + campaign_id`;
- исторический membership не переиспользуется при повторном вступлении;
- membership владельца не может стать неактивным отдельно от удаления кампании.

### `notes`

| Колонка | PostgreSQL | Null | Ограничения |
|---|---|:---:|---|
| `id` | `uuid` | нет | PK |
| `campaign_id` | `uuid` | нет | FK → `campaigns.id`, `ON DELETE CASCADE` |
| `author_id` | `uuid` | нет | FK → `memberships.id`, `ON DELETE RESTRICT` |
| `body` | `text` | нет | 1–5000 после проверки `trim` |
| `session_date` | `date` | да | календарная дата без времени |
| `created_at` | `timestamptz(3)` | нет | default `now()` |
| `updated_at` | `timestamptz(3)` | нет | default `now()`, обновляется Prisma |

Инварианты:

- `author_id` ссылается на membership, а не на user;
- заметка не удаляется при выходе автора из кампании;
- `updated_at > created_at` используется только для пометки «изменено».

### `npcs`

| Колонка | PostgreSQL | Null | Ограничения |
|---|---|:---:|---|
| `id` | `uuid` | нет | PK |
| `campaign_id` | `uuid` | нет | FK → `campaigns.id`, `ON DELETE CASCADE` |
| `created_by_id` | `uuid` | нет | FK → `memberships.id`, `ON DELETE RESTRICT` |
| `name` | `varchar(60)` | нет | 1–60 после `trim` |
| `title` | `varchar(60)` | нет | default `''` |
| `attitude` | `npc_attitude` | нет | `ally`, `neutral`, `enemy`, `unknown`; default `unknown` |
| `tags` | `text[]` | нет | default `{}`, максимум 5 элементов |
| `notes` | `varchar(1000)` | нет | default `''` |
| `created_at` | `timestamptz(3)` | нет | default `now()` |
| `updated_at` | `timestamptz(3)` | нет | default `now()`, обновляется Prisma |

Инварианты:

- `created_by_id` хранит авторство, но не ограничивает редактирование;
- тегов не больше 5, каждый тег длиной 1–24 после `trim`;
- отношение строго из enum.

### `npc_relations`

| Колонка | PostgreSQL | Null | Ограничения |
|---|---|:---:|---|
| `id` | `uuid` | нет | PK |
| `from_npc_id` | `uuid` | нет | FK → `npcs.id`, `ON DELETE CASCADE` |
| `to_npc_id` | `uuid` | нет | FK → `npcs.id`, `ON DELETE CASCADE` |
| `label` | `varchar(60)` | нет | 1–60 после `trim` |

Инварианты:

- `from_npc_id <> to_npc_id`;
- оба NPC принадлежат одной кампании;
- у одного `from_npc_id` не более 5 исходящих связей.

Unique constraint на пару `from_npc_id + to_npc_id` не нужен: разные labels между теми же NPC разрешены.

## 4. Индексы и ограничения

### Обязательные индексы

```sql
CREATE UNIQUE INDEX users_email_uk
  ON users (email);

CREATE UNIQUE INDEX campaigns_invite_token_uk
  ON campaigns (invite_token);

CREATE INDEX campaigns_owner_idx
  ON campaigns (owner_id);

CREATE INDEX notes_campaign_session_created_idx
  ON notes (campaign_id, session_date DESC, created_at DESC);

CREATE INDEX npcs_campaign_updated_idx
  ON npcs (campaign_id, updated_at DESC);

CREATE INDEX npc_relations_from_idx
  ON npc_relations (from_npc_id);

CREATE INDEX npc_relations_to_idx
  ON npc_relations (to_npc_id);
```

### Активные memberships

```sql
CREATE INDEX memberships_campaign_active_idx
  ON memberships (campaign_id)
  WHERE left_at IS NULL;

CREATE INDEX memberships_user_active_idx
  ON memberships (user_id)
  WHERE left_at IS NULL;

CREATE UNIQUE INDEX memberships_user_campaign_active_uk
  ON memberships (user_id, campaign_id)
  WHERE left_at IS NULL;
```

Это критичное ограничение MVP: Prisma schema не выражает partial unique index нативно, поэтому индекс должен жить в ручном SQL-фрагменте migration и дублироваться проверкой в сервисе.

### Рекомендуемые check constraints

```sql
ALTER TABLE campaigns
  ADD CONSTRAINT campaigns_cover_key_check
  CHECK (cover_key IN ('forest', 'dungeon', 'tavern', 'sea', 'mountains', 'city'));

ALTER TABLE campaigns
  ADD CONSTRAINT campaigns_invite_token_len_check
  CHECK (char_length(invite_token) = 12);

ALTER TABLE npc_relations
  ADD CONSTRAINT npc_relations_self_check
  CHECK (from_npc_id <> to_npc_id);
```

Остальные ограничения длины и trim удобнее валидировать на уровне общих Zod-схем из `packages/contracts`, а SQL использовать как вторую линию защиты только для критичных инвариантов.

## 5. Историчность и удаление

### Soft-like поведение участия

`memberships` не удаляются при выходе или исключении. Вместо этого у активной записи выставляется `left_at`.

Причины:

- заметки и NPC должны хранить историческое авторство;
- повторное вступление создаёт новый membership без перезаписи старых данных персонажа.

Все списки участников и все authorization-запросы должны фильтровать только `left_at IS NULL`.

### Hard delete кампании

При удалении кампании каскадно удаляются:

- `memberships`
- `notes`
- `npcs`
- `npc_relations`

`users` не удаляются.

## 6. Ключевые транзакции

### Создание кампании

В одной транзакции:

1. Проверить лимит 20 кампаний пользователя.
2. Создать `campaign`.
3. Создать активный owner membership с nullable character fields.

Кампания без owner membership не должна быть наблюдаема.

### Вступление по приглашению

В одной транзакции:

1. Найти campaign по актуальному `invite_token`.
2. Проверить отсутствие активного membership пользователя.
3. Посчитать активных участников и остановиться на лимите 20.
4. Создать новый membership.

Partial unique index остаётся последней защитой от race condition при double submit.

### Выход и исключение

Изменяется только активный membership: `left_at = now()`.

Нельзя:

- выключать membership владельца;
- физически удалять membership отдельно от кампании;
- перепривязывать старые notes или NPC к новому membership.

### Сохранение NPC со связями

Create/update NPC и полную замену исходящих relations нужно выполнять в одной транзакции:

1. Проверить активный membership пользователя.
2. Проверить лимиты: до 5 тегов и до 5 relations.
3. Проверить `from != to` и принадлежность всех target NPC той же campaign.
4. Сохранить NPC.
5. Удалить старые исходящие relations и создать новый набор.

Отсутствие relation в payload на update означает её удаление. Входящие relations не меняются.

## 7. Prisma-решения

- Все Prisma-модели и enum должны использовать `@@map` и `@map` в `snake_case`.
- Доменный API остаётся в `camelCase`; трансформация происходит на слое repository/mapper.
- `nextSessionAt` и `sessionDate` задаются как `DateTime @db.Date`, но на API-границе сериализуются строго как `YYYY-MM-DD`.
- Нельзя формировать пользовательскую дату через `toISOString().slice(0, 10)`, потому что это зависит от timezone.
- Частичный уникальный индекс активного membership добавляется ручным SQL в migration после генерации Prisma.
- Миграции только forward; destructive changes до дедлайна запрещены.

### Prisma sketch

```prisma
model User {
  id           String       @id @default(uuid()) @db.Uuid
  name         String       @db.VarChar(40)
  email        String       @unique @db.VarChar(254)
  passwordHash String       @map("password_hash")
  createdAt    DateTime     @default(now()) @map("created_at")
  campaigns    Campaign[]   @relation("CampaignOwner")
  memberships  Membership[]

  @@map("users")
}

model Campaign {
  id            String       @id @default(uuid()) @db.Uuid
  title         String       @db.VarChar(60)
  synopsis      String       @default("") @db.VarChar(500)
  coverKey      String       @map("cover_key") @db.VarChar(16)
  inviteToken   String       @unique @map("invite_token") @db.Char(12)
  nextSessionAt DateTime?    @db.Date @map("next_session_at")
  ownerId       String       @map("owner_id") @db.Uuid
  createdAt     DateTime     @default(now()) @map("created_at")
  owner         User         @relation("CampaignOwner", fields: [ownerId], references: [id])
  memberships   Membership[]
  notes         Note[]
  npcs          Npc[]

  @@map("campaigns")
}

model Membership {
  id             String      @id @default(uuid()) @db.Uuid
  userId         String      @map("user_id") @db.Uuid
  campaignId     String      @map("campaign_id") @db.Uuid
  characterName  String?     @map("character_name") @db.VarChar(40)
  characterClass String?     @map("character_class") @db.VarChar(60)
  characterInfo  String?     @map("character_info") @db.VarChar(300)
  joinedAt       DateTime    @default(now()) @map("joined_at")
  leftAt         DateTime?   @map("left_at")
  user           User        @relation(fields: [userId], references: [id])
  campaign       Campaign    @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  notes          Note[]
  createdNpcs    Npc[]

  @@map("memberships")
}

model Note {
  id          String      @id @default(uuid()) @db.Uuid
  campaignId  String      @map("campaign_id") @db.Uuid
  authorId    String      @map("author_id") @db.Uuid
  body        String
  sessionDate DateTime?   @db.Date @map("session_date")
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")
  campaign    Campaign    @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  author      Membership  @relation(fields: [authorId], references: [id])

  @@map("notes")
}

model Npc {
  id          String        @id @default(uuid()) @db.Uuid
  campaignId  String        @map("campaign_id") @db.Uuid
  createdById String        @map("created_by_id") @db.Uuid
  name        String        @db.VarChar(60)
  title       String        @default("") @db.VarChar(60)
  attitude    NpcAttitude   @default(unknown)
  tags        String[]      @default([])
  notes       String        @default("") @db.VarChar(1000)
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")
  campaign    Campaign      @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  createdBy   Membership    @relation(fields: [createdById], references: [id])
  outgoing    NpcRelation[] @relation("NpcRelationFrom")
  incoming    NpcRelation[] @relation("NpcRelationTo")

  @@map("npcs")
}

model NpcRelation {
  id        String @id @default(uuid()) @db.Uuid
  fromNpcId String @map("from_npc_id") @db.Uuid
  toNpcId   String @map("to_npc_id") @db.Uuid
  label     String @db.VarChar(60)
  fromNpc   Npc    @relation("NpcRelationFrom", fields: [fromNpcId], references: [id], onDelete: Cascade)
  toNpc     Npc    @relation("NpcRelationTo", fields: [toNpcId], references: [id], onDelete: Cascade)

  @@map("npc_relations")
}

enum NpcAttitude {
  ally
  neutral
  enemy
  unknown
}
```

## 8. Read models и seed-риски

Для API лучше собирать подготовленные read models, а не отдавать raw DB records:

- `CampaignSummaryDto`
- `CampaignDetailDto`
- `InvitePreviewDto`
- `NoteDto`
- `NpcDto`

Seed должен быть идемпотентным по стабильному demo email и стабильным campaign titles. Он не должен переиспользовать исторические memberships и не должен хардкодить пароль в git: пароль приходит через env.

Самые рискованные места модели:

- исторические authors через `memberships.id`;
- проверка «оба NPC в одной campaign» не выражается обычным FK;
- лимит участников и race на join закрываются только транзакцией плюс partial unique index.
