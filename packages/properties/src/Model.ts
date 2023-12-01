import { BaseProperty } from './Property.js';

export interface PropertyModel extends EventTarget {
	title: string;
	icon?: string;
	context?: string[] | string;

	// TODO: hidden subscriptions field to handle Model changes? Instead of extending EventTarget
	// _subscriptions?: Array<(property: BaseProperty<any>) => void>;
}

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
	static properties<T extends PropertyModel>(model: T) {
		return Object.entries(model).filter(([_, value]) => value instanceof BaseProperty) as [
			string,
			BaseProperty<any>,
		][];
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
}
