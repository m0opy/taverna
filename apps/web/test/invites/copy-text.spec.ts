import {afterEach, describe, expect, it, vi} from 'vitest';

import {copyText} from '../../src/features/campaign/invite/model/copy-text';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('copyText', () => {
  it('uses the Clipboard API when it is available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {clipboard: {writeText}});

    await expect(copyText('http://92.118.114.232/join/token')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('http://92.118.114.232/join/token');
  });

  it('falls back to a selected textarea when Clipboard API is unavailable or rejects', async () => {
    const textarea = {
      focus: vi.fn(),
      select: vi.fn(),
      setAttribute: vi.fn(),
      style: {},
      value: '',
    };
    const appendChild = vi.fn();
    const removeChild = vi.fn();
    const execCommand = vi.fn().mockReturnValue(true);

    vi.stubGlobal('navigator', {clipboard: {writeText: vi.fn().mockRejectedValue(new Error('Insecure context'))}});
    vi.stubGlobal('document', {
      body: {appendChild, removeChild},
      createElement: vi.fn().mockReturnValue(textarea),
      execCommand,
    });

    await expect(copyText('http://92.118.114.232/join/token')).resolves.toBe(true);
    expect(textarea.value).toBe('http://92.118.114.232/join/token');
    expect(textarea.select).toHaveBeenCalledOnce();
    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(removeChild).toHaveBeenCalledWith(textarea);
  });

  it('falls back when Clipboard API is unavailable', async () => {
    const textarea = {focus: vi.fn(), select: vi.fn(), setAttribute: vi.fn(), style: {}, value: ''};
    const execCommand = vi.fn().mockReturnValue(true);

    vi.stubGlobal('navigator', {});
    vi.stubGlobal('document', {
      body: {appendChild: vi.fn(), removeChild: vi.fn()},
      createElement: vi.fn().mockReturnValue(textarea),
      execCommand,
    });

    await expect(copyText('http://92.118.114.232/join/token')).resolves.toBe(true);
    expect(execCommand).toHaveBeenCalledWith('copy');
  });

  it('reports failure only after the fallback also fails', async () => {
    vi.stubGlobal('navigator', {clipboard: {writeText: vi.fn().mockRejectedValue(new Error('Insecure context'))}});
    vi.stubGlobal('document', {
      body: {appendChild: vi.fn(), removeChild: vi.fn()},
      createElement: vi.fn().mockReturnValue({focus: vi.fn(), select: vi.fn(), setAttribute: vi.fn(), style: {}}),
      execCommand: vi.fn().mockReturnValue(false),
    });

    await expect(copyText('http://92.118.114.232/join/token')).resolves.toBe(false);
  });
});
