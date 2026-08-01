import type {NpcDto} from '@taverna/contracts';

export function npcFixture(overrides: Partial<NpcDto> = {}): NpcDto {
  return {
    id: '00000000-0000-4000-8000-000000000101',
    campaignId: '00000000-0000-4000-8000-000000000010',
    createdBy: {
      membershipId: '00000000-0000-4000-8000-000000000011',
      userName: 'Полина',
      characterName: 'Лорас',
      isActive: true,
    },
    name: 'Борден',
    title: 'Трактирщик',
    attitude: 'neutral',
    tags: ['таверна', 'демо'],
    notes: 'Хозяин таверны и основной источник слухов.',
    relations: [{
      id: '00000000-0000-4000-8000-000000000102',
      toNpc: {id: '00000000-0000-4000-8000-000000000103', name: 'Иреена'},
      label: 'защищает',
    }],
    createdAt: '2026-08-02T10:00:00.000Z',
    updatedAt: '2026-08-02T10:00:00.000Z',
    ...overrides,
  };
}
