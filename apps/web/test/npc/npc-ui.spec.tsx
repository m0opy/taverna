import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it, vi} from 'vitest';

vi.mock('@gravity-ui/uikit', async () => {
  const {createElement} = await import('react');
  return {
    Button: ({children, ...props}: Record<string, unknown>) => createElement('button', props, String(children ?? '')),
  };
});

vi.mock('../../src/features/npc/create/model/use-create-npc', () => ({
  useCreateNpc: () => ({error: null, isPending: false, mutate: vi.fn()}),
}));

vi.mock('../../src/features/npc/edit/model/use-edit-npc', () => ({
  useEditNpc: () => ({error: null, isPending: false, mutate: vi.fn()}),
}));

import {NpcEditor} from '../../src/widgets/npc-editor/ui/NpcEditor';
import {NpcList} from '../../src/widgets/npc-list/ui/NpcList';
import {npcFixture} from '../test-data/npcs';

describe('NPC UI', () => {
  it('renders cards, tags, relations and the active filter', () => {
    const markup = renderToStaticMarkup(
      <NpcList
        availableTags={['таверна', 'демо']}
        items={[npcFixture()]}
        selectedTag="таверна"
        onCreate={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onTagChange={vi.fn()}
      />,
    );

    expect(markup).toContain('Борден');
    expect(markup).toContain('Трактирщик');
    expect(markup).toContain('таверна');
    expect(markup).toContain('Иреена');
    expect(markup).toContain('защищает');
    expect(markup).toContain('Нейтральный');
  });

  it('renders the empty state for a tag with no matches', () => {
    const markup = renderToStaticMarkup(
      <NpcList
        availableTags={['таверна']}
        items={[]}
        selectedTag="замок"
        onCreate={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onTagChange={vi.fn()}
      />,
    );

    expect(markup).toContain('По этому тегу NPC не найдены');
    expect(markup).toContain('Добавить NPC');
  });

  it('does not render the all-NPC filter on an empty campaign', () => {
    const markup = renderToStaticMarkup(
      <NpcList
        availableTags={[]}
        items={[]}
        onCreate={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onTagChange={vi.fn()}
      />,
    );

    expect(markup).not.toContain('Фильтр NPC по тегам');
    expect(markup).not.toContain('>Все</button>');
  });

  it('keeps editor fields and relation controls in the FSD widget', () => {
    const markup = renderToStaticMarkup(
      <NpcEditor
        campaignId={npcFixture().campaignId}
        items={[npcFixture({relations: []}), npcFixture({id: '00000000-0000-4000-8000-000000000104', name: 'Иреена', relations: []})]}
        npc={npcFixture()}
        onCancel={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(markup).toContain('Изменить NPC');
    expect(markup).toContain('Борден');
    expect(markup).toContain('Теги');
    expect(markup).toContain('Связи');
    expect(markup).toContain('Иреена');
  });
});
