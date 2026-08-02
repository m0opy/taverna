import type {NoteDto} from '@taverna/contracts';

import type {NoteGroup} from '../model/presentation';

export function formatSessionLabel(sessionDate: string | null): string {
  if (!sessionDate) {
    return 'Без привязки к сессии';
  }

  const [year = 0, month = 0, day = 0] = sessionDate.split('-').map(Number);
  const formatted = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
  return `Сессия ${formatted}`;
}

export function groupNotesBySession(notes: NoteDto[]): NoteGroup[] {
  const groups = new Map<string, NoteGroup>();

  for (const note of notes) {
    const key = note.sessionDate ?? 'without-session';
    const group = groups.get(key);
    if (group) {
      group.notes.push(note);
      continue;
    }

    groups.set(key, {
      key,
      label: formatSessionLabel(note.sessionDate),
      notes: [note],
    });
  }

  return [...groups.values()];
}
