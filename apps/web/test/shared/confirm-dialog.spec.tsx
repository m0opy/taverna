import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it, vi} from 'vitest';

import {ConfirmDialog} from '../../src/shared/ui/ConfirmDialog';

describe('ConfirmDialog', () => {
  it('renders a clear destructive confirmation surface', () => {
    const markup = renderToStaticMarkup(
      <ConfirmDialog
        description="Связи с этим NPC тоже будут удалены."
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        title="Удалить NPC «Фва»?"
      />,
    );

    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('Удалить NPC «Фва»?');
    expect(markup).toContain('Связи с этим NPC тоже будут удалены.');
    expect(markup).toContain('Отмена');
    expect(markup).toContain('Удалить');
  });

  it('supports a custom pending label for non-destructive confirmations', () => {
    const markup = renderToStaticMarkup(
      <ConfirmDialog
        confirmLabel="Обновить ссылку"
        description="Старая ссылка перестанет работать."
        isPending
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        pendingLabel="Обновляем…"
        title="Обновить приглашение?"
      />,
    );

    expect(markup).toContain('Обновить приглашение?');
    expect(markup).toContain('Обновляем…');
  });
});
