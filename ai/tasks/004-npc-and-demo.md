# Task 004: NPC And Demo

Цель: добавить отличительный DnD-сценарий и сделать непустое демо, понятное судье без регистрации.

## Scope

- NPC CRUD в кампании, теги и фильтр по одному тегу;
- исходящие `NpcRelation` с проверками self/cross-campaign и транзакционной заменой списка;
- страница `/c/:id/npc`, формы создания/редактирования, пустые и ошибочные состояния;
- идемпотентный seed: две кампании, роли master/player, заметки, NPC и связи;
- «Войти как гость» с видимыми demo credentials из окружения.

## Acceptance criteria

- активный участник создаёт, редактирует и удаляет NPC, а неучастник не получает доступ;
- нельзя создать связь NPC с собой или NPC другой кампании;
- удаление NPC удаляет его связи;
- фильтр возвращает только NPC с выбранным тегом;
- повторный seed не создаёт дубликаты;
- гость за один клик открывает две наполненные кампании и видит owner/player состояния.

## Verification

1. API integration tests: права, self/cross-campaign relation, cascade delete, tag filter.
2. Ручной guest smoke: landing → guest login → campaigns → notes → NPC.
3. `pnpm check` и Docker health smoke.

## Scope cut order

Сначала убрать autocomplete тегов и сложный editor связей. Базовый NPC CRUD и наполненное демо не сокращать.

## Exit condition

Судья видит работающий DnD-хаб с данными сразу после открытия приложения.
