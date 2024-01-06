import { Accessor } from 'tokyo-api';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';

/**
 * Accessor React hook that will return the data, error and pending state of the accessor.
 * @param accessorFn Function that builds the accessor instance.
 * @param params The params that will be used to fetch and filter the data.
 */
export function useAccessor<T extends Accessor>(
  accessorFn: () => T,
  params: Partial<T['params']>,
  query: Partial<T['query']>
) {
  const accessor = useMemo(() => accessorFn(), [accessorFn]);
  const [data, setData] = useState<Awaited<ReturnType<(typeof accessor)['compute']>> | undefined>();

  const pending = useSyncExternalStore(
    (callback) => accessor.on('pending', callback),
    () => accessor.pending
  );

  useEffect(
    () =>
      accessor.on('data', (data) => {
        setData(data);
      }),
    [accessor]
  );

  useEffect(() => {
    accessor.params = params;
  }, [accessor, params]);

  useEffect(() => {
    accessor.query = query;
  }, [accessor, query]);

  return { data, pending };
}
