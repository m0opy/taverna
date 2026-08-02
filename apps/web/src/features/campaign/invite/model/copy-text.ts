export async function copyText(text: string): Promise<boolean> {
  const clipboard = globalThis.navigator?.clipboard;
  if (clipboard) {
    try {
      await clipboard.writeText(text);
      return true;
    } catch {
      // Clipboard API is unavailable on HTTP origins; use the browser fallback below.
    }
  }

  if (typeof document === 'undefined') return false;

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.opacity = '0';
  textarea.style.position = 'fixed';
  textarea.style.pointerEvents = 'none';

  let isAttached = false;
  try {
    document.body.appendChild(textarea);
    isAttached = true;
    textarea.focus();
    textarea.select();
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    if (isAttached) document.body.removeChild(textarea);
  }
}
