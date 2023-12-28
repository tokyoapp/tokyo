import { Model, PropertyModel } from 'tokyo-properties';
import { createEffect, createSignal, onCleanup } from 'solid-js';

export function useProperties<T extends PropertyModel, R>(model: T, result: (model: T) => R) {
  const init = result(model);
  const [value, setValue] = createSignal<R>(init);

  createEffect(() => {
    const unsubscribe = Model.subscribe(model, () => {
      const res = result(model);
      setValue(res);
    });

    onCleanup(() => unsubscribe());
  });

  return value;
}
