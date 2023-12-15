import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Accessor } from 'tokyo-api';
import * as Comlink from 'comlink';

/**
 * Accessor React hook that will return the data, error and pending state of the accessor.
 * @param accessorFn Function that builds the accessor instance.
 * @param params The params that will be used to fetch and filter the data.
 */
export function useAccessor<T extends Accessor<any, any, any>>(
  accessorFn: () => T,
  params: T['params']
) {
  const accessor = useMemo(() => accessorFn(), []);
  const [data, setData] = useState<ReturnType<(typeof accessor)['processData']>>();

  const error = useSyncExternalStore(
    (callback) => accessor.on('error', callback),
    () => accessor.error
  );
  const pending = useSyncExternalStore(
    (callback) => accessor.on('pending', callback),
    () => accessor.pending
  );

  useEffect(
    () =>
      accessor.on('data', (data) => {
        setData(data);
      }),
    []
  );

  useEffect(() => {
    accessor.setParams(params);
  }, [params]);

  return { data, error, pending };
}

/**
 * Same as "useAccessor" but accessorFn should return a worker.
 */
export function useAccessorWorker<T extends Accessor<any, any, any>>(
  accessorFn: () => Worker,
  params: T['params']
) {
  // main thread
  const accessor = useMemo(() => Comlink.wrap<T>(accessorFn()), []);

  const [data, setData] = useState<ReturnType<T['processData']>>();
  const [error, setError] = useState<T['error']>();
  const [pending, setPending] = useState<T['pending']>();

  // TODO: try to interface with the accessor channel directly.

  useEffect(() => {
    const listeners: (() => void)[] = [];

    accessor
      .on(
        'error',
        Comlink.proxy(() => {
          accessor.error?.then(setError);
        })
      )
      .then((r) => {
        listeners.push(r);
      });

    accessor
      .on(
        'pending',
        Comlink.proxy(() => {
          accessor.pending.then(setPending);
        })
      )
      .then((r) => {
        listeners.push(r);
      });

    accessor
      .on(
        'data',
        Comlink.proxy((data) => {
          setData(data);
        })
      )
      .then((r) => {
        listeners.push(r);
      });

    return () => {
      // unsubscribe all listeners
      for (const unsubscribe of listeners) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    accessor.setParams(params);
  }, [params]);

  return { data, error, pending };
}
