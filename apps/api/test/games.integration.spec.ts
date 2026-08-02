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

suite('campaign games integration', () => {
  let database: DatabaseContext;
  let app: Awaited<ReturnType<typeof buildApp>>;
  let userNumber = 0;
  let registeredUserIds: string[] = [];

  beforeAll(async () => {
    const env: AppEnv = {
      APP_ORIGIN: 'http://localhost:5173',
      ALLOW_INSECURE_SESSION_COOKIES: false,
      APP_VERSION: 'games-test',
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
      payload: {name, email: `game-user-${userNumber}@example.com`, password: 'strong-password'},
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
      payload: {title: `Игры кампании ${userNumber}`, coverKey: 'tavern'},
    });
    expect(response.statusCode).toBe(201);
    return response.json();
  }

  it('uses the calendar as the source of truth for the next game', async () => {
    const owner = await register('Мастер');
    const campaign = await createCampaign(owner.cookie);
    const player = await register('Игрок');
    const token = new URL(campaign.inviteUrl).pathname.split('/').pop()!;
    await app.inject({
      method: 'POST',
      url: `/api/invites/${token}/join`,
      headers: {cookie: player.cookie},
      payload: {characterName: 'Мира'},
    });

    const first = await app.inject({
      method: 'POST',
      url: `/api/campaigns/${campaign.id}/games`,
      headers: {cookie: owner.cookie},
      payload: {scheduledFor: '2026-12-31', scheduledTime: '19:30', title: 'Праздник в трактире', description: 'Подготовить зимний ваншот.'},
    });
    expect(first.statusCode).toBe(201);
    expect(first.json()).toMatchObject({campaignId: campaign.id, scheduledFor: '2026-12-31', scheduledTime: '19:30'});

    const nextAfterFirstGame = await app.inject({
      method: 'GET',
      url: `/api/campaigns/${campaign.id}`,
      headers: {cookie: owner.cookie},
    });
    expect(nextAfterFirstGame.json().nextSessionAt).toBe('2026-12-31');

    const second = await app.inject({
      method: 'POST',
      url: `/api/campaigns/${campaign.id}/games`,
      headers: {cookie: owner.cookie},
      payload: {scheduledFor: '2026-12-31', title: 'Разбор арок'},
    });
    expect(second.statusCode).toBe(201);
    expect(second.json().scheduledTime).toBeNull();

    const december = await app.inject({
      method: 'GET',
      url: `/api/campaigns/${campaign.id}/games?month=2026-12`,
      headers: {cookie: player.cookie},
    });
    expect(december.statusCode).toBe(200);
    expect(december.json().items).toMatchObject([
      {id: first.json().id, title: 'Праздник в трактире', scheduledTime: '19:30'},
      {id: second.json().id, title: 'Разбор арок', scheduledTime: null},
    ]);

    const forbidden = await app.inject({
      method: 'POST',
      url: `/api/campaigns/${campaign.id}/games`,
      headers: {cookie: player.cookie},
      payload: {scheduledFor: '2026-12-31', title: 'Нельзя'},
    });
    expect(forbidden.statusCode).toBe(403);

    const invalid = await app.inject({
      method: 'POST',
      url: `/api/campaigns/${campaign.id}/games`,
      headers: {cookie: owner.cookie},
      payload: {scheduledFor: '2026-02-30', scheduledTime: '25:00', title: 'Неверная дата'},
    });
    expect(invalid.statusCode).toBe(400);

    const updated = await app.inject({
      method: 'PATCH',
      url: `/api/campaigns/${campaign.id}/games/${first.json().id}`,
      headers: {cookie: owner.cookie},
      payload: {scheduledFor: '2027-01-01', scheduledTime: '20:00', title: 'Новый год в трактире'},
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.json()).toMatchObject({scheduledFor: '2027-01-01', scheduledTime: '20:00', title: 'Новый год в трактире'});

    const nextAfterMove = await app.inject({
      method: 'GET',
      url: `/api/campaigns/${campaign.id}`,
      headers: {cookie: owner.cookie},
    });
    expect(nextAfterMove.json().nextSessionAt).toBe('2026-12-31');

    const moveNextGame = await app.inject({
      method: 'PATCH',
      url: `/api/campaigns/${campaign.id}`,
      headers: {cookie: owner.cookie},
      payload: {nextSessionAt: '2026-12-30'},
    });
    expect(moveNextGame.statusCode).toBe(200);
    expect(moveNextGame.json().nextSessionAt).toBe('2026-12-30');

    const january = await app.inject({
      method: 'GET',
      url: `/api/campaigns/${campaign.id}/games?month=2027-01`,
      headers: {cookie: owner.cookie},
    });
    expect(january.json().items).toMatchObject([{id: first.json().id, scheduledFor: '2027-01-01'}]);
    const decemberAfterMove = await app.inject({
      method: 'GET',
      url: `/api/campaigns/${campaign.id}/games?month=2026-12`,
      headers: {cookie: owner.cookie},
    });
    expect(decemberAfterMove.json().items).toMatchObject([
      {id: second.json().id, scheduledFor: '2026-12-30'},
    ]);

    const forbiddenDelete = await app.inject({
      method: 'DELETE',
      url: `/api/campaigns/${campaign.id}/games/${first.json().id}`,
      headers: {cookie: player.cookie},
    });
    expect(forbiddenDelete.statusCode).toBe(403);

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/api/campaigns/${campaign.id}/games/${first.json().id}`,
      headers: {cookie: owner.cookie},
    });
    expect(deleted.statusCode).toBe(204);

    const januaryAfterDelete = await app.inject({
      method: 'GET',
      url: `/api/campaigns/${campaign.id}/games?month=2027-01`,
      headers: {cookie: owner.cookie},
    });
    expect(januaryAfterDelete.json().items).toHaveLength(0);

    const nextAfterDeletingLaterGame = await app.inject({
      method: 'GET',
      url: `/api/campaigns/${campaign.id}`,
      headers: {cookie: owner.cookie},
    });
    expect(nextAfterDeletingLaterGame.json().nextSessionAt).toBe('2026-12-30');

    const deletedSecond = await app.inject({
      method: 'DELETE',
      url: `/api/campaigns/${campaign.id}/games/${second.json().id}`,
      headers: {cookie: owner.cookie},
    });
    expect(deletedSecond.statusCode).toBe(204);

    const noNextGame = await app.inject({
      method: 'GET',
      url: `/api/campaigns/${campaign.id}`,
      headers: {cookie: owner.cookie},
    });
    expect(noNextGame.json().nextSessionAt).toBeNull();

    const createNextGame = await app.inject({
      method: 'PATCH',
      url: `/api/campaigns/${campaign.id}`,
      headers: {cookie: owner.cookie},
      payload: {nextSessionAt: '2027-01-03'},
    });
    expect(createNextGame.statusCode).toBe(200);
    expect(createNextGame.json().nextSessionAt).toBe('2027-01-03');

    const januaryWithCreatedNextGame = await app.inject({
      method: 'GET',
      url: `/api/campaigns/${campaign.id}/games?month=2027-01`,
      headers: {cookie: owner.cookie},
    });
    expect(januaryWithCreatedNextGame.json().items).toMatchObject([
      {scheduledFor: '2027-01-03', scheduledTime: null, title: 'Игра', description: ''},
    ]);
  });
});
