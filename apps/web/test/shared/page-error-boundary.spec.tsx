import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it, vi} from 'vitest';

vi.mock('@gravity-ui/uikit', async () => {
  const {createElement} = await import('react');
  return {
    Button: ({children, href, ...props}: Record<string, unknown>) => createElement(
      typeof href === 'string' ? 'a' : 'button',
      href ? {href, ...props} : props,
      String(children ?? ''),
    ),
  };
});

import {PageErrorBoundary} from '../../src/app/ui/PageErrorBoundary/PageErrorBoundary';
import {ApiError} from '../../src/shared/api/client';

function renderBoundaryFallback(pathname: string, error: Error) {
  const boundary = new PageErrorBoundary({children: null, pathname});
  boundary.state = {hasError: true, error};
  return renderToStaticMarkup(boundary.render());
}

describe('page error boundary fallback', () => {
  it('shows access guidance for 403 failures on protected routes', () => {
    const markup = renderBoundaryFallback('/c/campaign-1', new ApiError(403, 'Нет доступа'));

    expect(markup).toContain('Нет доступа к разделу');
    expect(markup).toContain('Вернуться назад');
    expect(markup).toContain('К кампаниям');
  });

  it('uses the public fallback action outside protected routes', () => {
    const markup = renderBoundaryFallback('/mystery-path', new Error('boom'));

    expect(markup).toContain('Страница не открылась');
    expect(markup).toContain('Повторить');
    expect(markup).toContain('На главную');
  });
});
