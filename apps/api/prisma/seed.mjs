import argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/index.js';

const enabled = process.env.ENABLE_DEMO_SEED === 'true' || process.env.ENABLE_DEMO_SEED === '1';

if (!enabled) {
  console.info('Skipping demo seed because ENABLE_DEMO_SEED is disabled');
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required for demo seed');
  process.exit(1);
}

if (!process.env.DEMO_PASSWORD || process.env.DEMO_PASSWORD.length < 8) {
  console.error('DEMO_PASSWORD with at least 8 characters is required for demo seed');
  process.exit(1);
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await argon2.hash(process.env.DEMO_PASSWORD);

  const user = await prisma.user.upsert({
    where: { email: 'demo@taverna.local' },
    update: {
      name: 'Demo Master',
      passwordHash,
    },
    create: {
      name: 'Demo Master',
      email: 'demo@taverna.local',
      passwordHash,
    },
  });

  const campaigns = [
    {
      coverKey: 'tavern',
      inviteToken: 'demoTavern01',
      synopsis: 'Демо-мир для smoke-проверок и первого логина.',
      title: 'Демо-таверна',
    },
    {
      coverKey: 'forest',
      inviteToken: 'demoForest02',
      synopsis: 'Вторая наполненная кампания для judge flow.',
      title: 'Лес шепчущих карт',
    },
  ];

  for (const campaignInput of campaigns) {
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        ownerId: user.id,
        title: campaignInput.title,
      },
      select: {
        id: true,
      },
    });

    const campaign =
      existingCampaign ??
      (await prisma.campaign.create({
        data: {
          coverKey: campaignInput.coverKey,
          inviteToken: campaignInput.inviteToken,
          ownerId: user.id,
          synopsis: campaignInput.synopsis,
          title: campaignInput.title,
        },
        select: {
          id: true,
        },
      }));

    const membership = await prisma.membership.findFirst({
      where: {
        campaignId: campaign.id,
        leftAt: null,
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    const ownerMembership =
      membership ??
      (await prisma.membership.create({
        data: {
          campaignId: campaign.id,
          userId: user.id,
        },
        select: {
          id: true,
        },
      }));

    const existingNote = await prisma.note.findFirst({
      where: { campaignId: campaign.id },
      select: { id: true },
    });

    if (!existingNote) {
      await prisma.note.create({
        data: {
          authorId: ownerMembership.id,
          body: 'Демо-заметка для smoke-теста health, auth и списков.',
          campaignId: campaign.id,
        },
      });
    }

    const existingNpc = await prisma.npc.findFirst({
      where: { campaignId: campaign.id },
      select: { id: true },
    });

    if (!existingNpc) {
      await prisma.npc.create({
        data: {
          attitude: 'neutral',
          campaignId: campaign.id,
          createdById: ownerMembership.id,
          name: 'Борден',
          notes: 'Хозяин таверны и основной NPC демо-мира.',
          tags: ['demo', 'keeper'],
          title: 'Трактирщик',
        },
      });
    }
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error('Demo seed failed', error);
    process.exit(1);
  });
