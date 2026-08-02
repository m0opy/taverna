import {renderToStaticMarkup} from 'react-dom/server';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@gravity-ui/uikit', async () => {
  const {createElement} = await import('react');
  return {
    Button: ({children, ...props}: Record<string, unknown>) => createElement('button', props, String(children ?? '')),
  };
});

vi.mock('@daypicker/react', async () => {
  const {createElement} = await import('react');
  return {
    DayPicker: ({footer}: {footer: string}) => createElement('div', {className: 'day-picker-mock'}, footer),
  };
});

vi.mock('@daypicker/react/locale/ru', () => ({ru: {labels: {labelDayButton: () => 'Дата'}}}));

vi.mock('../../src/entities/game/api/use-games', () => ({useGames: vi.fn()}));
vi.mock('../../src/features/game/create/model/use-create-game', () => ({useCreateGame: vi.fn()}));
vi.mock('../../src/features/game/delete/model/use-delete-game', () => ({useDeleteGame: vi.fn()}));
vi.mock('../../src/features/game/update/model/use-update-game', () => ({useUpdateGame: vi.fn()}));

import {useGames} from '../../src/entities/game/api/use-games';
import {useCreateGame} from '../../src/features/game/create/model/use-create-game';
import {useDeleteGame} from '../../src/features/game/delete/model/use-delete-game';
import {useUpdateGame} from '../../src/features/game/update/model/use-update-game';
import {ApiError} from '../../src/shared/api/client';
import {CampaignGamesCalendar} from '../../src/widgets/campaign-games-calendar/ui/CampaignGamesCalendar';
import {GameEditor} from '../../src/widgets/game-editor/ui/GameEditor';

const game = {
  id: '00000000-0000-4000-8000-000000000201',
  campaignId: '00000000-0000-4000-8000-000000000202',
  scheduledFor: '2026-12-31',
  scheduledTime: '19:30',
  title: 'Праздник в трактире',
  description: 'Зимний ваншот.',
  createdAt: '2026-08-02T00:00:00.000Z',
  updatedAt: '2026-08-02T00:00:00.000Z',
};

function mutationState(error: unknown = null) {
  return {error, isPending: false, mutate: vi.fn()};
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-12-31T12:00:00.000Z'));
  vi.mocked(useGames).mockReturnValue({
    data: {items: [game]},
    isError: false,
    isPending: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useGames>);
  vi.mocked(useCreateGame).mockReturnValue(mutationState() as unknown as ReturnType<typeof useCreateGame>);
  vi.mocked(useDeleteGame).mockReturnValue(mutationState() as unknown as ReturnType<typeof useDeleteGame>);
  vi.mocked(useUpdateGame).mockReturnValue(mutationState() as unknown as ReturnType<typeof useUpdateGame>);
});

afterEach(() => vi.useRealTimers());

describe('campaign games calendar UI', () => {
  it('shows the month schedule without exposing the game title and keeps the owner action', () => {
    const markup = renderToStaticMarkup(
      <CampaignGamesCalendar campaignId={game.campaignId} isOwner />,
    );

    expect(markup).toContain('Расписание кампании');
    expect(markup).not.toContain('Праздник в трактире');
    expect(markup).toContain('19:30');
    expect(markup).toContain('Зимний ваншот.');
    expect(markup).toContain('Запланировать');
    expect(markup).toContain('1 игра');
    expect(markup).toContain('title="Изменить игру"');
    expect(markup).toContain('title="Удалить игру"');
  });

  it('does not expose planning or editing actions to players', () => {
    const markup = renderToStaticMarkup(
      <CampaignGamesCalendar campaignId={game.campaignId} isOwner={false} />,
    );

    expect(markup).not.toContain('Запланировать');
    expect(markup).not.toContain('Изменить');
  });

  it('keeps a readable error state when the monthly request fails', () => {
    vi.mocked(useGames).mockReturnValue({
      data: undefined,
      isError: true,
      isPending: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useGames>);

    const markup = renderToStaticMarkup(<CampaignGamesCalendar campaignId={game.campaignId} isOwner={false} />);
    expect(markup).toContain('Не удалось загрузить расписание за этот месяц.');
    expect(markup).toContain('Повторить');
  });

  it('reopens an editor with the persisted date, time and description', () => {
    const markup = renderToStaticMarkup(
      <GameEditor campaignId={game.campaignId} defaultDate="2026-12-01" game={game} onCancel={vi.fn()} onSaved={vi.fn()} />,
    );

    expect(markup).toContain('Изменить игру');
    expect(markup).toContain('value="2026-12-31"');
    expect(markup).toContain('value="19:30"');
    expect(markup).toContain('Зимний ваншот.');
    expect(markup).not.toContain('Название игры');
    expect(markup).toContain('Что подготовить к сессии');
  });

  it('keeps field-specific save errors visible in the editor', () => {
    vi.mocked(useCreateGame).mockReturnValue(
      mutationState(new ApiError(400, 'Проверьте поля', 'VALIDATION_ERROR', {
        scheduledFor: 'Выберите дату игры',
        scheduledTime: 'Выберите корректное время',
      })) as unknown as ReturnType<typeof useCreateGame>,
    );

    const markup = renderToStaticMarkup(
      <GameEditor campaignId={game.campaignId} defaultDate="2026-12-01" onCancel={vi.fn()} onSaved={vi.fn()} />,
    );

    expect(markup).toContain('Выберите дату игры');
    expect(markup).toContain('Выберите корректное время');
    expect(markup).toContain('aria-invalid="true"');
  });
});
