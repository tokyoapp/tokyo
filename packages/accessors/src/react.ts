import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { type Accessor } from "./lib.js";

const log = console;

/**
 * Accessor React hook that will return the data, error and pending state of the accessor.
 * @param accessorFn Function that builds the accessor instance.
 * @param query
 * @param params
 */
export function useAccessor<T extends Accessor<any, any, any, any, any, any>>(
  accessorFn: () => T,
  query: Partial<T["query"]>,
  params?: Partial<T["params"]>
) {
  const accessor = useMemo(() => accessorFn(), [accessorFn]);
  const [data, setData] = useState<ReturnType<T["_strategy"]["compute"]>>();
  const [error, setError] = useState<Error | string>();
  const [state, setState] = useState<T["state"]>();

  const pending = useSyncExternalStore(
    (callback) => accessor.on("pending", callback),
    () => accessor.pending
  );

  useEffect(
    () =>
      accessor.on("error", (error) => {
        log.error("Error in accessor", error);
        setError(error);
      }),
    [accessor]
  );

  useEffect(
    () =>
      accessor.on("state", (state) => {
        setState(state);
      }),
    [accessor]
  );

  useEffect(
    () =>
      accessor.on("data", (data) => {
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

  return { data, pending, error, state };
}
