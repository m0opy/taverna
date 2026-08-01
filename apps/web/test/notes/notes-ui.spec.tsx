import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it, vi} from 'vitest';

vi.mock('@gravity-ui/uikit', async () => {
  const {createElement} = await import('react');
  return {
    Button: ({children, ...props}: Record<string, unknown>) => createElement('button', props, String(children ?? '')),
  };
});

vi.mock('../../src/features/note/create/model/use-create-note', () => ({
  useCreateNote: () => ({error: null, isPending: false, mutate: vi.fn()}),
}));

vi.mock('../../src/features/note/edit/model/use-edit-note', () => ({
  useEditNote: () => ({error: null, isPending: false, mutate: vi.fn()}),
}));

import {NoteEditor} from '../../src/widgets/note-editor/ui/NoteEditor';
import {NotesList} from '../../src/widgets/notes-list/ui/NotesList';
import {NotesErrorState} from '../../src/pages/campaign-notes/ui/CampaignNotesPage';
import {ApiError} from '../../src/shared/api/client';
import {noteFixture} from '../test-data/notes';

describe('notes UI', () => {
  it('renders grouped notes, authors and preserved line breaks', () => {
    const markup = renderToStaticMarkup(
      <NotesList
        items={[noteFixture({body: 'Первая строка\n\nВторая строка'}), noteFixture({id: 'note-2', sessionDate: null, canEdit: false, canDelete: false})]}
        onCreate={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(markup).toContain('Сессия 3 августа 2026 г.');
    expect(markup).toContain('Без привязки к сессии');
    expect(markup).toContain('Лорас');
    expect(markup).toContain('Первая строка\n\nВторая строка');
    expect(markup).toContain('Изменить');
  });

  it('renders an empty state and an editor for create and edit modes', () => {
    const empty = renderToStaticMarkup(
      <NotesList items={[]} onCreate={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />,
    );
    const create = renderToStaticMarkup(
      <NoteEditor campaignId={noteFixture().campaignId} onCancel={vi.fn()} onSaved={vi.fn()} />,
    );
    const edit = renderToStaticMarkup(
      <NoteEditor campaignId={noteFixture().campaignId} note={noteFixture({body: 'Текст для правки'})} onCancel={vi.fn()} onSaved={vi.fn()} />,
    );

    expect(empty).toContain('Пока нет ни одной заметки');
    expect(empty).toContain('Написать заметку');
    expect(create).toContain('Опубликовать');
    expect(edit).toContain('Изменить заметку');
    expect(edit).toContain('Текст для правки');
    expect(edit).toContain('Сохранить');
  });

  it('renders forbidden API errors as an actionable state', () => {
    const markup = renderToStaticMarkup(
      <NotesErrorState error={new ApiError(403, 'Forbidden', 'CAMPAIGN_FORBIDDEN')} onRetry={vi.fn()} />,
    );

    expect(markup).toContain('Нет доступа к заметкам');
    expect(markup).toContain('Только активные участники');
    expect(markup).toContain('Повторить');
  });
});
