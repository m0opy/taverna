import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import {describe, expect, it, vi} from 'vitest';

vi.mock('@gravity-ui/uikit', async () => {
  const {createElement} = await import('react');
  return {
    Badge: ({children}: {children: string}) => createElement('span', null, children),
    Button: ({children, ...props}: Record<string, unknown>) => createElement('button', props, String(children ?? '')),
  };
});

import {CampaignDetailErrorState, CampaignDetailLoadingState, CampaignDetailView} from '../../src/widgets/campaign-detail/ui/CampaignDetail';

const campaign = {
  id: 'campaign-1',
  title: 'Пепел Северной башни',
  coverKey: 'tavern' as const,
  nextSessionAt: null,
  membersCount: 2,
  myRole: 'master' as const,
  synopsis: 'История у старого костра.',
  ownerId: 'user-1',
  inviteUrl: 'https://example.test/join/token',
  myMembershipId: 'membership-1',
  createdAt: '2026-08-01T00:00:00.000Z',
  members: [
    {
      id: 'membership-1',
      user: {id: 'user-1', name: 'Полина'},
      characterName: null,
      characterClass: null,
      characterInfo: null,
      joinedAt: '2026-08-01T00:00:00.000Z',
      isOwner: true,
    },
    {
      id: 'membership-2',
      user: {id: 'user-2', name: 'Алексей'},
      characterName: 'Лорас',
      characterClass: 'Бард',
      characterInfo: null,
      joinedAt: '2026-08-01T00:00:00.000Z',
      isOwner: false,
    },
  ],
};

describe('campaign detail', () => {
  it('shows the current role and owner/player membership rows', () => {
    const markup = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <CampaignDetailView campaign={campaign} id="campaign-1" notice="Вы вступили в кампанию." section="home" />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(markup).toContain('Мастер');
    expect(markup).toContain('Полина');
    expect(markup).toContain('Лорас');
    expect(markup).toContain('Бард · Алексей');
    expect(markup).toContain('Вы вступили в кампанию.');
    expect(markup).toContain('aria-current="page"');
    expect(markup).not.toContain('Раскрыть предысторию');
    expect(markup).not.toContain('Показать предысторию');
  });

  it('keeps forbidden and not-found states distinct', () => {
    const forbidden = renderToStaticMarkup(<CampaignDetailErrorState status={403} />);
    const notFound = renderToStaticMarkup(<CampaignDetailErrorState status={404} />);

    expect(forbidden).toContain('Нет доступа к кампании');
    expect(forbidden).toContain('403');
    expect(notFound).toContain('Кампания не найдена');
    expect(notFound).toContain('404');
  });

  it('renders the loading state while detail data is pending', () => {
    expect(renderToStaticMarkup(<CampaignDetailLoadingState />)).toContain('Открываем хронику');
  });
});
