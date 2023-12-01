import { BaseProperty } from './Property.js';

export type PropertyModel = {
  title: string;
  icon?: string;
  context?: string[] | string;

  // TODO: hidden subscriptions field to handle Model changes? Instead of extending EventTarget
  // _subscriptions?: Array<(property: BaseProperty<any>) => void>;
} & {
  [key: string]: BaseProperty<any>;
};

/**
 * Model utility for working with Property instances.
 */
export class Model {
  /**
   * Resets all properties on a model to their default values.
   */
  static reset<T extends PropertyModel>(model: T) {
    for (const [_, property] of Model.properties(model)) {
      property.reset();
    }
  }

  /**
   * Returns true if any property on the model has changed from the "default" value.
   */
  static isDefault<T extends PropertyModel>(model: T) {
    for (const [_, property] of Model.properties(model)) {
      if (!property.isDefault()) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns all properties on a model.
   */
  static properties<
    T extends {
      [key: string]: BaseProperty<any> | string | string[] | undefined;
    }
  >(model: T) {
    const props = Object.entries(model).filter(([_, value]) => value instanceof BaseProperty);
    return props as [keyof T, T[keyof T]][];
  }

  /**
   * Returns the sum of all property _lastModified values on the Model.
   */
  static hash<T extends PropertyModel>(model: T) {
    let hash = 0;
    for (const [_, property] of Model.properties(model)) {
      hash += property._lastModified;
    }
    return hash;
  }

  /**
   * Subscribe to all properties on a model. Returns an unsubscribe function.
   */
  static subscribe<T extends PropertyModel>(model: T, cb: (property: BaseProperty<any>) => void) {
    const subs: ReturnType<typeof this.subscribe>[] = [];

    for (const [_, property] of Model.properties(model)) {
      subs.push(property.subscribe(cb));
    }

    return () => {
      for (const unsubscribe of subs) {
        unsubscribe();
      }
    };
  }

  /**
   * Create stream from model where every property is mapped to its value.
   */
  static stream<T extends PropertyModel>(model: T) {
    type Chunk = Record<keyof T, string>;

    let controller: ReadableStreamDefaultController<Chunk>;

    const unsubscribe = Model.subscribe(model, () => {
      if (controller) {
        const properties = Model.properties(model);
        const map = Object.fromEntries(properties);
        controller.enqueue(map);
      }
    });

    return new ReadableStream<Chunk>({
      start(ctrler) {
        controller = ctrler;
      },
      cancel() {
        unsubscribe();
      },
    });
  }
}
