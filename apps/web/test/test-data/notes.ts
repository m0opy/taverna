import type {NoteDto} from '@taverna/contracts';

export function noteFixture(overrides: Partial<NoteDto> = {}): NoteDto {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    campaignId: '00000000-0000-4000-8000-000000000010',
    author: {
      membershipId: '00000000-0000-4000-8000-000000000011',
      userName: 'Полина',
      characterName: 'Лорас',
      isActive: true,
    },
    body: 'Герои нашли старую карту.',
    sessionDate: '2026-08-03',
    createdAt: '2026-08-03T18:00:00.000Z',
    updatedAt: '2026-08-03T18:00:00.000Z',
    canEdit: true,
    canDelete: true,
    ...overrides,
  };
}
