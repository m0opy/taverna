import {useState} from 'react';

import {copyText} from './copy-text';

type CopyState = 'idle' | 'copied' | 'error';

export function useCopyInvite(inviteUrl: string | null) {
  const [copyState, setCopyState] = useState<CopyState>('idle');

  const copyInvite = async () => {
    if (!inviteUrl) return;
    if (await copyText(inviteUrl)) {
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1800);
    } else {
      setCopyState('error');
    }
  };

  return {copyInvite, copyState};
}
