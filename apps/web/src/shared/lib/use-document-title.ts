import {useEffect} from 'react';

import {buildDocumentTitle} from './title';

export function useDocumentTitle(...parts: Array<string | false | null | undefined>) {
  const title = buildDocumentTitle(...parts);

  useEffect(() => {
    document.title = title;
  }, [title]);
}
