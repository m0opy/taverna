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

suite('NPC integration', () => {
  let database: DatabaseContext;
  let app: Awaited<ReturnType<typeof buildApp>>;
  let userNumber = 0;
  let registeredUserIds: string[] = [];

  beforeAll(async () => {
    const env: AppEnv = {
      APP_ORIGIN: 'http://localhost:5173',
      APP_VERSION: 'npc-test',
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
      payload: {name, email: `npc-user-${userNumber}@example.com`, password: 'strong-password'},
    });
    expect(response.statusCode).toBe(201);
    const body = response.json();
    registeredUserIds.push(body.id);
    return {body, cookie: cookieFrom(response.headers)};
  }

  async function createCampaign(cookie: string, title = `NPC campaign ${userNumber}`) {
    const response = await app.inject({
      method: 'POST',
      url: '/api/campaigns',
      headers: {cookie},
      payload: {title, coverKey: 'tavern'},
    });
    expect(response.statusCode).toBe(201);
    return response.json();
  }

  async function joinCampaign(cookie: string, inviteUrl: string, characterName = 'Мира') {
    const token = new URL(inviteUrl).pathname.split('/').pop()!;
    const response = await app.inject({
      method: 'POST',
      url: `/api/invites/${token}/join`,
      headers: {cookie},
      payload: {characterName, characterClass: 'Следопыт'},
    });
    expect(response.statusCode).toBe(201);
    return response.json();
  }

  async function createNpc(cookie: string, campaignId: string, payload: Record<string, unknown>) {
    const response = await app.inject({
      method: 'POST',
      url: `/api/campaigns/${campaignId}/npcs`,
      headers: {cookie},
      payload,
    });
    expect(response.statusCode).toBe(201);
    return response.json();
  }

  it('supports member CRUD, tag filtering and denies outsiders', async () => {
    const owner = await register('Мастер');
    const campaign = await createCampaign(owner.cookie);
    const player = await register('Игрок');
    await joinCampaign(player.cookie, campaign.inviteUrl);
    const outsider = await register('Чужак');

    const created = await createNpc(player.cookie, campaign.id, {
      name: 'Борден',
      title: 'Трактирщик',
      attitude: 'neutral',
      tags: ['Таверна', 'демо'],
      notes: 'Знает больше, чем говорит.',
    });
    expect(created).toMatchObject({
      campaignId: campaign.id,
      name: 'Борден',
      tags: ['Таверна', 'демо'],
      createdBy: {userName: 'Игрок', characterName: 'Мира'},
    });

    const listed = await app.inject({
      method: 'GET',
      url: `/api/campaigns/${campaign.id}/npcs`,
      headers: {cookie: owner.cookie},
    });
    expect(listed.statusCode).toBe(200);
    expect(listed.json().availableTags).toEqual(['Таверна', 'демо']);
    expect(listed.json().items).toHaveLength(1);

    const filtered = await app.inject({
      method: 'GET',
      url: `/api/campaigns/${campaign.id}/npcs?tag=ТАВЕРНА`,
      headers: {cookie: owner.cookie},
    });
    expect(filtered.statusCode).toBe(200);
    expect(filtered.json().items).toHaveLength(1);

    const edited = await app.inject({
      method: 'PATCH',
      url: `/api/campaigns/${campaign.id}/npcs/${created.id}`,
      headers: {cookie: owner.cookie},
      payload: {name: 'Борден Старший', tags: ['фракция'], notes: 'Обновлённые сведения.'},
    });
    expect(edited.statusCode).toBe(200);
    expect(edited.json()).toMatchObject({name: 'Борден Старший', tags: ['фракция']});

    const forbidden = await app.inject({
      method: 'GET',
      url: `/api/campaigns/${campaign.id}/npcs`,
      headers: {cookie: outsider.cookie},
    });
    expect(forbidden.statusCode).toBe(403);
    expect(forbidden.json().error.code).toBe('CAMPAIGN_FORBIDDEN');

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/api/campaigns/${campaign.id}/npcs/${created.id}`,
      headers: {cookie: player.cookie},
    });
    expect(deleted.statusCode).toBe(204);
  });

  it('rejects self/cross-campaign relations and cascades valid relations', async () => {
    const owner = await register('Мастер');
    const firstCampaign = await createCampaign(owner.cookie, 'NPC first campaign');
    const secondCampaign = await createCampaign(owner.cookie, 'NPC second campaign');
    const fromNpc = await createNpc(owner.cookie, firstCampaign.id, {name: 'Герой'});
    const targetNpc = await createNpc(owner.cookie, firstCampaign.id, {name: 'Союзник'});
    const foreignNpc = await createNpc(owner.cookie, secondCampaign.id, {name: 'Чужой'});

    const selfRelation = await app.inject({
      method: 'PATCH',
      url: `/api/campaigns/${firstCampaign.id}/npcs/${fromNpc.id}`,
      headers: {cookie: owner.cookie},
      payload: {name: 'Герой', relations: [{toNpcId: fromNpc.id, label: 'сам себе'}]},
    });
    expect(selfRelation.statusCode).toBe(400);
    expect(selfRelation.json().error.code).toBe('NPC_SELF_RELATION');

    const crossCampaign = await app.inject({
      method: 'PATCH',
      url: `/api/campaigns/${firstCampaign.id}/npcs/${fromNpc.id}`,
      headers: {cookie: owner.cookie},
      payload: {name: 'Герой', relations: [{toNpcId: foreignNpc.id, label: 'из другого мира'}]},
    });
    expect(crossCampaign.statusCode).toBe(404);
    expect(crossCampaign.json().error.code).toBe('RELATED_NPC_NOT_FOUND');

    const validRelation = await app.inject({
      method: 'PATCH',
      url: `/api/campaigns/${firstCampaign.id}/npcs/${fromNpc.id}`,
      headers: {cookie: owner.cookie},
      payload: {name: 'Герой', relations: [{toNpcId: targetNpc.id, label: 'ищет помощи'}]},
    });
    expect(validRelation.statusCode).toBe(200);
    expect(validRelation.json().relations).toEqual([
      {id: expect.any(String), toNpc: {id: targetNpc.id, name: 'Союзник'}, label: 'ищет помощи'},
    ]);

    await app.inject({
      method: 'DELETE',
      url: `/api/campaigns/${firstCampaign.id}/npcs/${targetNpc.id}`,
      headers: {cookie: owner.cookie},
    });
    expect(await database.prisma.npcRelation.count({where: {fromNpcId: fromNpc.id}})).toBe(0);
  });
});
