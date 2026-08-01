import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import {describe, expect, it} from 'vitest';

import {CampaignOverview} from '../../src/widgets/campaign-detail/ui/CampaignOverview';
import {NextSessionEditor} from '../../src/widgets/campaign-settings/ui/NextSessionEditor';

function render(ui: React.ReactNode) {
  return renderToStaticMarkup(<QueryClientProvider client={new QueryClient()}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>);
}

describe('campaign next-session controls', () => {
  it('shows owner assignment control and readable scheduled date', () => {
    const markup = render(<CampaignOverview campaignId="campaign-1" coverKey="tavern" isOwner nextSessionAt="2026-08-12" synopsis="" />);

    expect(markup).toContain('12 августа 2026');
    expect(markup).toContain('Изменить');
    expect(markup).toContain('среда');
  });

  it('keeps date controls read-only for a player and supports clearing for an owner editor', () => {
    const player = render(<CampaignOverview campaignId="campaign-1" coverKey="tavern" isOwner={false} nextSessionAt={null} synopsis="" />);
    const ownerEditor = render(<NextSessionEditor campaignId="campaign-1" nextSessionAt="2026-08-12" />);

    expect(player).toContain('Дата не назначена');
    expect(player).not.toContain('Назначить');
    expect(ownerEditor).toContain('Очистить дату');
    expect(ownerEditor).toContain('type="date"');
  });
});
