import type {NoteDto} from '@taverna/contracts';

export type NoteGroup = {
  key: string;
  label: string;
  notes: NoteDto[];
};

export function noteAuthorLabel(note: NoteDto): string {
  return note.author.characterName || note.author.userName;
}

export function formatNoteTimestamp(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
