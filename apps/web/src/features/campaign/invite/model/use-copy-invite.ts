import {useState} from 'react';

type CopyState = 'idle' | 'copied' | 'error';

export function useCopyInvite(inviteUrl: string | null) {
  const [copyState, setCopyState] = useState<CopyState>('idle');

  const copyInvite = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1800);
    } catch {
      setCopyState('error');
    }
  };

  return {copyInvite, copyState};
}
