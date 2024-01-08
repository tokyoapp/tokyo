import { type Accessor } from './lib.ts';
import { createEffect, createSignal } from 'solid-js';

/**
 * Accessor React hook that will return the data, error and pending state of the accessor.
 * @param accessorFn Function that builds the accessor instance.
 * @param params The params as a signal, that will be used to fetch and filter the data.
 */

export function useAccessor<T extends Accessor>(accessorFn: () => T) {
  const accessor = accessorFn();
  const [data, setData] = createSignal<Awaited<ReturnType<T['compute']>> | undefined>();

  type Query = Partial<T['query']>;
  type Params = Partial<T['params']>;

  const [pending, setPending] = createSignal<boolean>();
  const [params, setParams] = createSignal<Params>();
  const [query, setQuery] = createSignal<Query>();

  accessor.on('data', (data) => setData(data));
  accessor.on('pending', (pending) => setPending(pending));

  createEffect(() => {
    accessor.params = params();
  });

  createEffect(() => {
    accessor.query = query();
  });

  return {
    data,
    pending,
    query(value?: Query) {
      if (value) {
        setQuery(value);
      }
      return query();
    },
    params(value?: Params) {
      if (value) {
        setParams(value);
      }
      return params();
    },
  };
}
