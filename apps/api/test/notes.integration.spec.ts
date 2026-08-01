import {afterAll, afterEach, beforeAll, describe, expect, it} from 'vitest';

import {buildApp} from '../src/app.js';
import {createDatabaseContext, type DatabaseContext} from '../src/lib/database.js';
import type {AppEnv} from '../src/lib/env.js';

const databaseUrl = process.env.TEST_DATABASE_URL;
const suite = describe.skipIf(!databaseUrl);

function cookieFrom(headers: Record<string, string | string[] | undefined>): string {
  const value = headers['set-cookie'];
  const cookie = Array.isArray(value) ? value[0] : value;
  if (!cookie) throw new Error('Expected Set-Cookie header');
  return cookie.split(';', 1)[0]!;
}

suite('Notes integration', () => {
  let database: DatabaseContext;
  let app: Awaited<ReturnType<typeof buildApp>>;
  let userNumber = 0;
  let registeredUserIds: string[] = [];

  beforeAll(async () => {
    const env: AppEnv = {
      APP_ORIGIN: 'http://localhost:5173',
      APP_VERSION: 'notes-test',
      DATABASE_URL: databaseUrl!,
      ENABLE_DEMO_SEED: false,
      HOST: '127.0.0.1',
      JWT_SECRET: 'integration-secret-integration-secret-123',
      NODE_ENV: 'test',
      PORT: 3001,
      SESSION_COOKIE_NAME: 'taverna_session',
    };
    database = createDatabaseContext(env);
    app = await buildApp({env, logger: false, prisma: database.prisma});
  });

  afterEach(async () => {
    if (registeredUserIds.length > 0) {
      await database.prisma.campaign.deleteMany({where: {ownerId: {in: registeredUserIds}}});
      await database.prisma.user.deleteMany({where: {id: {in: registeredUserIds}}});
      registeredUserIds = [];
    }
  });

  afterAll(async () => {
    await app.close();
    await database.close();
  });

  async function register(name: string) {
    userNumber += 1;
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {name, email: `notes-user-${userNumber}@example.com`, password: 'strong-password'},
    });
    expect(response.statusCode).toBe(201);
    const body = response.json();
    registeredUserIds.push(body.id);
    return {body, cookie: cookieFrom(response.headers)};
  }

  async function createCampaign(cookie: string) {
    const response = await app.inject({
      method: 'POST',
      url: '/api/campaigns',
      headers: {cookie},
      payload: {title: 'Заметки у костра', coverKey: 'tavern'},
    });
    expect(response.statusCode).toBe(201);
    return response.json();
  }

  async function joinCampaign(cookie: string, inviteUrl: string) {
    const token = new URL(inviteUrl).pathname.split('/').pop()!;
    const response = await app.inject({
      method: 'POST',
      url: `/api/invites/${token}/join`,
      headers: {cookie},
      payload: {characterName: 'Мира', characterClass: 'Следопыт'},
    });
    expect(response.statusCode).toBe(201);
    return response.json();
  }

  it('creates and lists notes in session order while preserving author snapshots', async () => {
    const owner = await register('Мастер');
    const campaign = await createCampaign(owner.cookie);
    const player = await register('Игрок');
    await joinCampaign(player.cookie, campaign.inviteUrl);

    const dated = await app.inject({
      method: 'POST',
      url: `/api/campaigns/${campaign.id}/notes`,
      headers: {cookie: player.cookie},
      payload: {body: '  Первая строка\n\nВторая строка  ', sessionDate: '2026-08-03'},
    });
    expect(dated.statusCode).toBe(201);
    expect(dated.json()).toMatchObject({
      campaignId: campaign.id,
      body: 'Первая строка\n\nВторая строка',
      sessionDate: '2026-08-03',
      author: {userName: 'Игрок', characterName: 'Мира', isActive: true},
      canEdit: true,
      canDelete: true,
    });

    const undated = await app.inject({
      method: 'POST',
      url: `/api/campaigns/${campaign.id}/notes`,
      headers: {cookie: owner.cookie},
      payload: {body: 'Запись без даты', sessionDate: null},
    });
    expect(undated.statusCode).toBe(201);

    const listed = await app.inject({
      method: 'GET',
      url: `/api/campaigns/${campaign.id}/notes`,
      headers: {cookie: player.cookie},
    });
    expect(listed.statusCode).toBe(200);
    expect(listed.json().items.map((note: {sessionDate: string | null}) => note.sessionDate)).toEqual([
      '2026-08-03',
      null,
    ]);

    const playerMembership = await database.prisma.membership.findFirstOrThrow({
      where: {campaignId: campaign.id, user: {name: 'Игрок'}},
    });
    await database.prisma.membership.update({
      where: {id: playerMembership.id},
      data: {leftAt: new Date('2026-08-04T12:00:00.000Z')},
    });

    const historical = await app.inject({
      method: 'GET',
      url: `/api/campaigns/${campaign.id}/notes`,
      headers: {cookie: owner.cookie},
    });
    expect(historical.statusCode).toBe(200);
    expect(historical.json().items[0]).toMatchObject({
      author: {userName: 'Игрок', characterName: 'Мира', isActive: false},
    });
  });

  it('allows authors and owners to edit/delete and rejects a foreign player', async () => {
    const owner = await register('Мастер');
    const campaign = await createCampaign(owner.cookie);
    const player = await register('Игрок');
    await joinCampaign(player.cookie, campaign.inviteUrl);

    const playerNote = await app.inject({
      method: 'POST',
      url: `/api/campaigns/${campaign.id}/notes`,
      headers: {cookie: player.cookie},
      payload: {body: 'Заметка игрока', sessionDate: '2026-08-05'},
    });
    const playerNoteId = playerNote.json().id as string;
    const authorEdit = await app.inject({
      method: 'PATCH',
      url: `/api/campaigns/${campaign.id}/notes/${playerNoteId}`,
      headers: {cookie: player.cookie},
      payload: {body: 'Обновлено автором', sessionDate: '2026-08-06'},
    });
    expect(authorEdit.statusCode).toBe(200);
    expect(authorEdit.json()).toMatchObject({body: 'Обновлено автором', sessionDate: '2026-08-06'});

    const ownerNote = await app.inject({
      method: 'POST',
      url: `/api/campaigns/${campaign.id}/notes`,
      headers: {cookie: owner.cookie},
      payload: {body: 'Заметка мастера'},
    });
    const ownerNoteId = ownerNote.json().id as string;
    const playerView = await app.inject({
      method: 'GET',
      url: `/api/campaigns/${campaign.id}/notes`,
      headers: {cookie: player.cookie},
    });
    expect(playerView.statusCode).toBe(200);
    expect(playerView.json().items.find((note: {id: string}) => note.id === ownerNoteId)).toMatchObject({
      canEdit: false,
      canDelete: false,
    });
    const forbiddenEdit = await app.inject({
      method: 'PATCH',
      url: `/api/campaigns/${campaign.id}/notes/${ownerNoteId}`,
      headers: {cookie: player.cookie},
      payload: {body: 'Попытка изменить чужую'},
    });
    expect(forbiddenEdit.statusCode).toBe(403);
    expect(forbiddenEdit.json().error.code).toBe('FORBIDDEN');

    const forbiddenDelete = await app.inject({
      method: 'DELETE',
      url: `/api/campaigns/${campaign.id}/notes/${ownerNoteId}`,
      headers: {cookie: player.cookie},
    });
    expect(forbiddenDelete.statusCode).toBe(403);
    expect(forbiddenDelete.json().error.code).toBe('FORBIDDEN');

    const ownerEdit = await app.inject({
      method: 'PATCH',
      url: `/api/campaigns/${campaign.id}/notes/${playerNoteId}`,
      headers: {cookie: owner.cookie},
      payload: {body: 'Обновлено мастером', sessionDate: null},
    });
    expect(ownerEdit.statusCode).toBe(200);
    expect(ownerEdit.json()).toMatchObject({body: 'Обновлено мастером', canEdit: true, canDelete: true});

    const ownerDelete = await app.inject({
      method: 'DELETE',
      url: `/api/campaigns/${campaign.id}/notes/${playerNoteId}`,
      headers: {cookie: owner.cookie},
    });
    expect(ownerDelete.statusCode).toBe(204);

    const unknownNote = await app.inject({
      method: 'PATCH',
      url: `/api/campaigns/${campaign.id}/notes/00000000-0000-4000-8000-000000000000`,
      headers: {cookie: owner.cookie},
      payload: {body: 'Нет такой заметки'},
    });
    expect(unknownNote.statusCode).toBe(404);
    expect(unknownNote.json().error.code).toBe('NOT_FOUND');
  });

  it('returns 403 to a non-member and 404 for an unknown campaign', async () => {
    const owner = await register('Мастер');
    const campaign = await createCampaign(owner.cookie);
    const outsider = await register('Чужак');

    const forbidden = await app.inject({
      method: 'GET',
      url: `/api/campaigns/${campaign.id}/notes`,
      headers: {cookie: outsider.cookie},
    });
    expect(forbidden.statusCode).toBe(403);
    expect(forbidden.json().error.code).toBe('CAMPAIGN_FORBIDDEN');

    const notFound = await app.inject({
      method: 'GET',
      url: '/api/campaigns/00000000-0000-4000-8000-000000000000/notes',
      headers: {cookie: owner.cookie},
    });
    expect(notFound.statusCode).toBe(404);
    expect(notFound.json().error.code).toBe('NOT_FOUND');
  });
});
