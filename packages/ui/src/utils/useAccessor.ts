import { Accessor } from 'tokyo-api';
import { createEffect, createSignal } from 'solid-js';

/**
 * Accessor React hook that will return the data, error and pending state of the accessor.
 * @param accessorFn Function that builds the accessor instance.
 * @param params The params as a signal, that will be used to fetch and filter the data.
 */

export function useAccessor<T extends Accessor<any, any, any, any>>(accessorFn: () => T) {
  const accessor = accessorFn();
  const [data, setData] = createSignal<ReturnType<(typeof accessor)['processData']>>();
  const [error, setError] = createSignal<string>();
  const [pending, setPending] = createSignal<boolean>();
  const [params, setParams] = createSignal<(typeof accessor)['params']>();

  accessor.on('data', (data) => setData(data));
  accessor.on('error', (error) => setError(error));
  accessor.on('pending', (pending) => setPending(pending));

  createEffect(() => {
    if (params) {
      accessor.setParams(params);
    }
  });

  return {
    data,
    error,
    pending,
    params(p: (typeof accessor)['params']) {
      setParams(p);
    },
  };
}
