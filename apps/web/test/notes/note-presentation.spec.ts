import {describe, expect, it} from 'vitest';

import {groupNotesBySession, formatSessionLabel} from '../../src/entities/note/lib/group-notes';
import {noteFixture} from '../test-data/notes';

describe('note presentation', () => {
  it('groups the already sorted API list and keeps the no-session group last', () => {
    const groups = groupNotesBySession([
      noteFixture({id: 'note-1', sessionDate: '2026-08-04'}),
      noteFixture({id: 'note-2', sessionDate: '2026-08-03'}),
      noteFixture({id: 'note-3', sessionDate: null}),
    ]);

    expect(groups.map((group) => group.label)).toEqual([
      'Сессия 4 августа 2026 г.',
      'Сессия 3 августа 2026 г.',
      'Без привязки к сессии',
    ]);
    expect(groups[2]?.notes[0]?.id).toBe('note-3');
  });

  it('formats an unlinked session explicitly', () => {
    expect(formatSessionLabel(null)).toBe('Без привязки к сессии');
  });
});
