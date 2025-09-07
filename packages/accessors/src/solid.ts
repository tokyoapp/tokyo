import { createSignal } from "solid-js";
import { type Accessor } from "./lib.js";

const log = console;

/**
 * Accessor React hook that will return the data, error and pending state of the accessor.
 * @param accessorFn Function that builds the accessor instance.
 * @param params The params as a signal, that will be used to fetch and filter the data.
 */

export function useAccessor<T extends Accessor<any, any, any, any, any, any>>(
  accessorFn: () => T
) {
  const accessor = accessorFn();

  const [data, setData] = createSignal<
    Awaited<ReturnType<T["compute"]>> | undefined
  >();
  const [error, setError] = createSignal<Error | string>();
  const [state, setState] = createSignal<T["state"]>();

  type Query = Partial<T["query"]>;
  type Params = Partial<T["params"]>;

  const [pending, setPending] = createSignal<boolean>();

  accessor.on("error", (error) => {
    log.error("Error in accessor", "error", error);
    setError(error);
  });
  accessor.on("state", (state) => setState(state));
  accessor.on("data", (data) => setData(data));
  accessor.on("pending", (pending) => setPending(pending));

  return {
    error,
    state,
    data,
    pending,
    query(value?: Query) {
      if (value) {
        accessor.query = value;
      }
      return accessor.query;
    },
    params(value?: Params) {
      if (value) {
        accessor.params = value;
      }
      return accessor.params;
    },
  };
}
