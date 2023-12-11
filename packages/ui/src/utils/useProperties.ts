import { useEffect, useState } from 'react';
import { Model, PropertyModel } from '@tokyo/properties';

export function useProperties<T extends PropertyModel, R>(model: T, result: (model: T) => R) {
  const [value, setValue] = useState(result(model));

  useEffect(() => {
    let unsubscribe = Model.subscribe(model, () => {
      setValue(result(model));
    });

    const resubscribe = () => {
      unsubscribe();
      unsubscribe = Model.subscribe(model, () => {
        setValue(result(model));
      });
    };

    model.addEventListener('resubscribe', resubscribe);

    return () => {
      unsubscribe();
      model.removeEventListener('resubscribe', resubscribe);
    };
  }, [model]);

  return value;
}

export function getBooleanPropertyValues<T extends PropertyModel>(model: T) {
  const values: number[] = [];
  for (const category of Model.properties(model).flatMap(([_, o]) => o.value)) {
    for (const key in category) {
      if (category[key]) {
        values.push(+key);
      }
    }
  }
  return values;
}
