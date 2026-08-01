import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it, vi} from 'vitest';

vi.mock('@gravity-ui/uikit', async () => {
  const {createElement} = await import('react');
  return {
    TextInput: ({onUpdate: _onUpdate, size: _size, ...props}: Record<string, unknown>) => createElement('input', props),
  };
});

import {TextAreaField, TextField} from './form-fields';

describe('shared form fields', () => {
  it('renders a dark text field with a separate visible label', () => {
    const markup = renderToStaticMarkup(
      <TextField label="Email" tone="dark" value="hero@example.test" onUpdate={() => undefined} placeholder="name@example.com" />,
    );

    expect(markup).toContain('form-field form-field--dark');
    expect(markup).toContain('form-field__label">Email</span>');
    expect(markup).toContain('placeholder="name@example.com"');
    expect(markup).not.toContain('g-text-input__label');
  });

  it('renders textarea hint and shared control styling', () => {
    const markup = renderToStaticMarkup(
      <TextAreaField label="Синопсис" value="История" onChange={() => undefined} maxLength={500} hint="7/500" />,
    );

    expect(markup).toContain('form-field__textarea');
    expect(markup).toContain('maxLength="500"');
    expect(markup).toContain('form-field__hint">7/500</span>');
  });
});
