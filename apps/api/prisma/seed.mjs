import argon2 from 'argon2';
import {PrismaPg} from '@prisma/adapter-pg';
import {PrismaClient} from '@prisma/client';

const defaultDemoEmail = 'demo@tavern.app';
const demoCampaigns = [
  {
    coverKey: 'dungeon',
    inviteToken: 'demoStrahd01',
    nextSessionAt: '2026-08-15T00:00:00.000Z',
    synopsis: 'Туман сгущается над Баровией, а древнее проклятие уже коснулось каждого героя.',
    title: 'Проклятие Штрада',
  },
  {
    coverKey: 'forest',
    inviteToken: 'demoRavens02',
    nextSessionAt: '2026-08-22T00:00:00.000Z',
    synopsis: 'Следы пропавшего каравана ведут в лес, где деревья помнят слишком много.',
    title: 'Шёпот Чащи',
  },
];

const demoUsers = {
  demo: {email: defaultDemoEmail, name: 'Элиан Ворон'},
  master: {email: 'master@tavern.app', name: 'Ирина Стражница'},
  playerTwo: {email: 'player-two@tavern.app', name: 'Лука Фонарщик'},
  playerThree: {email: 'player-three@tavern.app', name: 'Марта Травница'},
  forestPlayer: {email: 'forest-player@tavern.app', name: 'Рен Следопыт'},
};

const strahdNotes = [
  ['Туман встретил отряд у старого моста.', '2026-07-18'],
  ['В таверне «Синяя вода» бармен отказался говорить о замке.', '2026-07-18'],
  ['Иреена оставила на карте отметку у мельницы.', '2026-07-18'],
  ['Вороны следили за отрядом весь путь до деревни.', '2026-07-25'],
  ['На кладбище нашли серебряную пряжку с гербом Штрада.', '2026-07-25'],
  ['Элиан услышал имя Татьяны в старой песне.', '2026-07-25'],
  ['В замке погасли факелы, хотя ветра не было.', '2026-08-01'],
  ['Отряд договорился с хранителем ворот о следующей встрече.', '2026-08-01'],
];

const strahdNpcs = [
  ['Страд фон Зарович', 'Владыка Баровии', 'enemy', ['замок', 'враг'], 'Хозяин замка, который знает истинную цену каждой клятвы.'],
  ['Иреена Кольяна', 'Наследница', 'ally', ['деревня', 'союзник'], 'Ищет защиту и способ освободить свой народ.'],
  ['Рахадин', 'Правая рука Штрада', 'enemy', ['замок', 'враг'], 'Охотник, который оставляет после себя только тишину.'],
  ['Измарка', 'Владелица таверны', 'neutral', ['деревня', 'нейтрал'], 'Собирает слухи и прячет запасной ключ под стойкой.'],
  ['Элиан Ворон', 'Следопыт', 'ally', ['деревня', 'партия'], 'Демо-персонаж игрока, слишком часто слышит зов воронов.'],
  ['Лука Фонарщик', 'Плут', 'ally', ['партия', 'деревня'], 'Умеет открывать замки и закрывать неприятные разговоры.'],
  ['Марта Травница', 'Целительница', 'ally', ['партия', 'лес'], 'Помнит названия всех трав, кроме той, что растёт у замка.'],
  ['Мадам Ева', 'Провидица', 'unknown', ['лес', 'тайна'], 'Говорит загадками, но её карты всегда оказываются точными.'],
  ['Василика', 'Мельница', 'enemy', ['лес', 'враг'], 'Скрывает старые договоры в подвале мельницы.'],
  ['Смотритель ворот', 'Страж', 'neutral', ['замок', 'нейтрал'], 'Не пропускает никого без ответа на вопрос о прошлом.'],
];

const strahdRelations = [
  ['Иреена Кольяна', 'Страд фон Зарович', 'одержим'],
  ['Рахадин', 'Страд фон Зарович', 'служит'],
  ['Измарка', 'Иреена Кольяна', 'защищает'],
  ['Мадам Ева', 'Василика', 'предупреждает о'],
];

async function ensureUser(prisma, user, passwordHash) {
  return prisma.user.upsert({
    where: {email: user.email},
    update: {name: user.name, passwordHash},
    create: {...user, passwordHash},
  });
}

async function ensureMembership(prisma, campaignId, userId, character) {
  const current = await prisma.membership.findFirst({
    where: {campaignId, userId, leftAt: null},
  });

  if (current) {
    return prisma.membership.update({
      where: {id: current.id},
      data: character,
    });
  }

  return prisma.membership.create({
    data: {campaignId, userId, ...character},
  });
}

async function ensureCampaign(prisma, input, ownerId) {
  return prisma.campaign.upsert({
    where: {inviteToken: input.inviteToken},
    update: {
      coverKey: input.coverKey,
      nextSessionAt: new Date(input.nextSessionAt),
      ownerId,
      synopsis: input.synopsis,
      title: input.title,
    },
    create: {
      coverKey: input.coverKey,
      inviteToken: input.inviteToken,
      nextSessionAt: new Date(input.nextSessionAt),
      ownerId,
      synopsis: input.synopsis,
      title: input.title,
    },
  });
}

async function ensureNote(prisma, campaignId, authorId, body, sessionDate) {
  const current = await prisma.note.findFirst({where: {campaignId, body}});
  if (current) {
    return prisma.note.update({
      where: {id: current.id},
      data: {authorId, sessionDate: new Date(`${sessionDate}T00:00:00.000Z`)},
    });
  }
  return prisma.note.create({
    data: {
      authorId,
      body,
      campaignId,
      sessionDate: new Date(`${sessionDate}T00:00:00.000Z`),
    },
  });
}

async function ensureNpc(prisma, campaignId, createdById, [name, title, attitude, tags, notes]) {
  const current = await prisma.npc.findFirst({where: {campaignId, name}});
  if (current) {
    return prisma.npc.update({
      where: {id: current.id},
      data: {attitude, createdById, name, notes, tags, title},
    });
  }
  return prisma.npc.create({
    data: {attitude, campaignId, createdById, name, notes, tags, title},
  });
}

async function ensureRelation(prisma, fromNpcId, toNpcId, label) {
  const current = await prisma.npcRelation.findFirst({where: {fromNpcId, toNpcId, label}});
  if (current) return current;
  return prisma.npcRelation.create({data: {fromNpcId, toNpcId, label}});
}

export async function seedDemo(prisma, {demoEmail = defaultDemoEmail, demoPassword}) {
  const passwordHash = await argon2.hash(demoPassword);
  const users = {};

  for (const [key, user] of Object.entries(demoUsers)) {
    users[key] = await ensureUser(prisma, key === 'demo' ? {...user, email: demoEmail} : user, passwordHash);
  }

  const strahd = await ensureCampaign(prisma, demoCampaigns[0], users.master.id);
  const strahdMemberships = {
    master: await ensureMembership(prisma, strahd.id, users.master.id, {characterName: 'Капитан Рея', characterClass: 'Воин', characterInfo: 'Ведёт отряд сквозь туман.'}),
    demo: await ensureMembership(prisma, strahd.id, users.demo.id, {characterName: 'Элиан Ворон', characterClass: 'Следопыт', characterInfo: 'Слышит шаги там, где другие слышат тишину.'}),
    playerTwo: await ensureMembership(prisma, strahd.id, users.playerTwo.id, {characterName: 'Лука Фонарщик', characterClass: 'Плут', characterInfo: 'Никогда не признаётся, где был ключ.'}),
    playerThree: await ensureMembership(prisma, strahd.id, users.playerThree.id, {characterName: 'Марта Травница', characterClass: 'Друид', characterInfo: 'Собирает травы и плохие предчувствия.'}),
  };

  for (const [index, [body, sessionDate]] of strahdNotes.entries()) {
    const authorKeys = ['demo', 'playerTwo', 'playerThree', 'master'];
    await ensureNote(prisma, strahd.id, strahdMemberships[authorKeys[index % authorKeys.length]].id, body, sessionDate);
  }

  const npcByName = {};
  for (const npcInput of strahdNpcs) {
    const npc = await ensureNpc(prisma, strahd.id, strahdMemberships.demo.id, npcInput);
    npcByName[npc.name] = npc;
  }
  for (const [fromName, toName, label] of strahdRelations) {
    await ensureRelation(prisma, npcByName[fromName].id, npcByName[toName].id, label);
  }

  const forest = await ensureCampaign(prisma, demoCampaigns[1], users.demo.id);
  const forestMemberships = {
    demo: await ensureMembership(prisma, forest.id, users.demo.id, {characterName: null, characterClass: null, characterInfo: null}),
    player: await ensureMembership(prisma, forest.id, users.forestPlayer.id, {characterName: 'Рен', characterClass: 'Волшебник', characterInfo: 'Ищет источник шёпота.'}),
  };
  await ensureNote(prisma, forest.id, forestMemberships.player.id, 'Караван исчез на северной тропе.', '2026-07-26');
  await ensureNote(prisma, forest.id, forestMemberships.demo.id, 'На коре старого дуба нашли знак ворона.', '2026-08-02');
  await ensureNpc(prisma, forest.id, forestMemberships.demo.id, ['Старая Ива', 'Хранительница тропы', 'neutral', ['лес', 'тайна'], 'Знает дорогу к забытому святилищу.']);
  await ensureNpc(prisma, forest.id, forestMemberships.player.id, ['Кай Речной', 'Купец', 'unknown', ['караван'], 'Последним видел пропавшие повозки.']);

  return {campaignIds: [strahd.id, forest.id], demoUserId: users.demo.id};
}

async function main() {
  if (process.env.ENABLE_DEMO_SEED !== 'true' && process.env.ENABLE_DEMO_SEED !== '1') {
    console.info('Skipping demo seed because ENABLE_DEMO_SEED is disabled');
    return;
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for demo seed');
  }
  if (!process.env.DEMO_PASSWORD || process.env.DEMO_PASSWORD.length < 8) {
    throw new Error('DEMO_PASSWORD with at least 8 characters is required for demo seed');
  }

  const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL});
  const prisma = new PrismaClient({adapter});
  try {
    await seedDemo(prisma, {
      demoEmail: process.env.DEMO_EMAIL ?? defaultDemoEmail,
      demoPassword: process.env.DEMO_PASSWORD,
    });
    console.info('Demo seed completed');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Demo seed failed', error);
  process.exitCode = 1;
});
