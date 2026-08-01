import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import {describe, expect, it, vi} from 'vitest';

vi.mock('@gravity-ui/uikit', async () => {
  const {createElement} = await import('react');
  return {
    Button: ({children, ...props}: Record<string, unknown>) => createElement('button', props, String(children ?? '')),
  };
});

import {CampaignListView} from '../../src/widgets/campaign-list/ui/CampaignList';

describe('campaign list', () => {
  it('renders a campaign card from the API summary', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <CampaignListView items={[{
          id: 'campaign-1',
          title: 'Пепел Северной башни',
          coverKey: 'tavern',
          nextSessionAt: null,
          membersCount: 1,
          myRole: 'master',
        }]} />
      </MemoryRouter>,
    );

    expect(markup).toContain('Пепел Северной башни');
    expect(markup).toContain('href="/c/campaign-1"');
    expect(markup).toContain('Мастер · 1 участников');
  });

  it('renders the empty state without campaign cards', () => {
    const markup = renderToStaticMarkup(<MemoryRouter><CampaignListView items={[]} /></MemoryRouter>);

    expect(markup).toContain('Здесь начнётся первая история');
    expect(markup).not.toContain('campaign-card');
  });
});
