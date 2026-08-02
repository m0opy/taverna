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
    expect(markup).toContain('Среда');
  });

  it('keeps date controls read-only for a player and connects the owner editor to the calendar', () => {
    const player = render(<CampaignOverview campaignId="campaign-1" coverKey="tavern" isOwner={false} nextSessionAt={null} synopsis="" />);
    const ownerEditor = render(<NextSessionEditor campaignId="campaign-1" nextSessionAt="2026-08-12" />);

    expect(player).toContain('Дата не назначена');
    expect(player).not.toContain('Назначить');
    expect(ownerEditor).toContain('изменение перенесёт её в календаре');
    expect(ownerEditor).not.toContain('Очистить дату');
    expect(ownerEditor).toContain('type="date"');
  });

  it('treats August 2, 2026 as the first allowed date and autofocuses the modal editor input', () => {
    const modalEditor = render(<NextSessionEditor campaignId="campaign-1" nextSessionAt={null} onClose={() => undefined} />);

    expect(modalEditor).toContain('role="dialog"');
    expect(modalEditor).toContain('min="2026-08-02"');
    expect(modalEditor).toContain('autofocus=""');
  });
});
