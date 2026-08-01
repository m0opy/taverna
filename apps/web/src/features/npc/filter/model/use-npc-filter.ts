import {useSearchParams} from 'react-router-dom';

export function useNpcFilter() {
  const [params, setParams] = useSearchParams();
  const tag = params.get('tag') ?? undefined;

  return {
    tag,
    setTag: (nextTag?: string) => {
      const next = new URLSearchParams(params);
      if (nextTag) next.set('tag', nextTag);
      else next.delete('tag');
      setParams(next, {replace: true});
    },
  };
}
