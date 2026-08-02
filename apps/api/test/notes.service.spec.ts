import {Prisma} from '@prisma/client';
import {describe, expect, it, vi} from 'vitest';

import {createCampaignNote, updateCampaignNote} from '../src/modules/notes/service.js';

function serializationError() {
  return new Prisma.PrismaClientKnownRequestError('Serialization failure', {
    code: 'P2034',
    clientVersion: 'test',
  });
}

describe('notes service', () => {
  it('retries serializable note writes before succeeding', async () => {
    const tx = {
      note: {
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn().mockResolvedValue({
          id: 'note-1',
          campaignId: 'campaign-1',
          body: 'Герои ушли на север',
          sessionDate: new Date(Date.UTC(2026, 7, 2)),
          createdAt: new Date('2026-08-02T18:00:00.000Z'),
          updatedAt: new Date('2026-08-02T18:00:00.000Z'),
          author: {
            id: 'membership-1',
            userId: 'user-1',
            characterName: 'Мира',
            leftAt: null,
            user: {name: 'Игрок'},
          },
        }),
      },
    };

    const db = {
      campaign: {
        findUnique: vi.fn().mockResolvedValue({id: 'campaign-1', ownerId: 'user-1'}),
      },
      membership: {
        findFirst: vi.fn().mockResolvedValue({id: 'membership-1'}),
      },
      $transaction: vi.fn()
        .mockRejectedValueOnce(serializationError())
        .mockRejectedValueOnce(serializationError())
        .mockImplementation(async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx)),
    };

    const note = await createCampaignNote(
      db as never,
      'campaign-1',
      'user-1',
      {body: 'Герои ушли на север', sessionDate: '2026-08-02'},
    );

    expect(db.$transaction).toHaveBeenCalledTimes(3);
    expect(tx.note.count).toHaveBeenCalledTimes(1);
    expect(tx.note.create).toHaveBeenCalledTimes(1);
    expect(note).toMatchObject({
      id: 'note-1',
      body: 'Герои ушли на север',
      sessionDate: '2026-08-02',
    });
  });

  it('does not let the campaign master edit another member\'s note', async () => {
    const update = vi.fn();
    const tx = {
      campaign: {
        findUnique: vi.fn().mockResolvedValue({id: 'campaign-1', ownerId: 'master-id'}),
      },
      membership: {
        findFirst: vi.fn().mockResolvedValue({id: 'master-membership'}),
      },
      note: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'note-1',
          campaignId: 'campaign-1',
          body: 'Заметка игрока',
          sessionDate: null,
          createdAt: new Date('2026-08-02T18:00:00.000Z'),
          updatedAt: new Date('2026-08-02T18:00:00.000Z'),
          author: {
            id: 'player-membership',
            userId: 'player-id',
            characterName: 'Мира',
            leftAt: null,
            user: {name: 'Игрок'},
          },
        }),
        update,
      },
    };
    const db = {
      $transaction: vi.fn().mockImplementation(
        async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx),
      ),
    };

    await expect(
      updateCampaignNote(db as never, 'campaign-1', 'note-1', 'master-id', {
        body: 'Попытка изменить чужую заметку',
        sessionDate: null,
      }),
    ).rejects.toMatchObject({statusCode: 403, code: 'FORBIDDEN'});
    expect(update).not.toHaveBeenCalled();
  });
});
