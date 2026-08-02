import {renderToStaticMarkup} from 'react-dom/server';
import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@gravity-ui/uikit', async () => {
  const {createElement} = await import('react');
  return {
    Button: ({children, ...props}: Record<string, unknown>) => createElement('button', props, String(children ?? '')),
  };
});

vi.mock('../../src/features/note/create/model/use-create-note', () => ({useCreateNote: vi.fn()}));
vi.mock('../../src/features/note/edit/model/use-edit-note', () => ({useEditNote: vi.fn()}));

import {useCreateNote} from '../../src/features/note/create/model/use-create-note';
import {useEditNote} from '../../src/features/note/edit/model/use-edit-note';
import {NoteEditor} from '../../src/widgets/note-editor/ui/NoteEditor';
import {NotesList} from '../../src/widgets/notes-list/ui/NotesList';
import {NotesErrorState} from '../../src/pages/campaign-notes/ui/CampaignNotesPage';
import {ApiError} from '../../src/shared/api/client';
import {noteFixture} from '../test-data/notes';

function mutationState(error: unknown = null) {
  return {
    error,
    isPending: false,
    mutate: vi.fn(),
  };
}

beforeEach(() => {
  vi.mocked(useCreateNote).mockReturnValue(mutationState() as unknown as ReturnType<typeof useCreateNote>);
  vi.mocked(useEditNote).mockReturnValue(mutationState() as unknown as ReturnType<typeof useEditNote>);
});

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

  it('collapses long notes behind an explicit disclosure control', () => {
    const markup = renderToStaticMarkup(
      <NotesList
        items={[noteFixture({body: 'Длинная запись о событиях сессии. '.repeat(20)})]}
        onCreate={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(markup).toContain('Показать полностью');
    expect(markup).toContain('aria-expanded="false"');
  });

  it('renders create and edit editors and the default empty state', () => {
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

  it('renders a filtered empty state and can suppress it while the editor is open', () => {
    const filtered = renderToStaticMarkup(
      <NotesList items={[]} onCreate={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} search="мира" />,
    );
    const hidden = renderToStaticMarkup(
      <NotesList items={[]} onCreate={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} showEmptyState={false} />,
    );

    expect(filtered).toContain('Ничего не найдено');
    expect(filtered).toContain('Попробуйте изменить запрос');
    expect(hidden).toBe('');
  });

  it('renders field-level and generic note save errors as alerts', () => {
    vi.mocked(useEditNote).mockReturnValue(
      mutationState(new ApiError(400, 'Проверьте поля', 'VALIDATION_ERROR', {
        body: 'Добавьте текст заметки',
        sessionDate: 'Укажите корректную дату',
      })) as unknown as ReturnType<typeof useEditNote>,
    );

    const validationMarkup = renderToStaticMarkup(
      <NoteEditor campaignId={noteFixture().campaignId} note={noteFixture()} onCancel={vi.fn()} onSaved={vi.fn()} />,
    );

    expect(validationMarkup).toContain('Добавьте текст заметки');
    expect(validationMarkup).toContain('Укажите корректную дату');
    expect((validationMarkup.match(/role="alert"/g) ?? [])).toHaveLength(2);

    vi.mocked(useCreateNote).mockReturnValue(
      mutationState(new Error('Failed to fetch')) as unknown as ReturnType<typeof useCreateNote>,
    );

    const networkMarkup = renderToStaticMarkup(
      <NoteEditor campaignId={noteFixture().campaignId} onCancel={vi.fn()} onSaved={vi.fn()} />,
    );

    expect(networkMarkup).toContain('Не удалось сохранить заметку. Проверьте соединение и попробуйте ещё раз.');
    expect(networkMarkup).toContain('role="alert"');
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
