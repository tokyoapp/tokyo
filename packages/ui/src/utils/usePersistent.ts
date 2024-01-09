import { createSignal, onCleanup, onMount } from 'solid-js';

export function usePersistentState<T>(key: string, defaultValue?: T | undefined) {
	let initial: T | undefined = defaultValue;

	const [value, setValue] = createSignal<T | undefined>(initial);

	try {
		const stored = sessionStorage.getItem(key);
		if (stored) initial = JSON.parse(stored) as T;
	} catch (e) {}

	const onChange = (e) => {
		if (e.key === key) {
			try {
				const stored = sessionStorage.getItem(key);
				if (stored) {
					setValue(JSON.parse(stored) as T);
				} else {
					setValue(undefined);
				}
			} catch (e) {
				console.warn(e);
			}
		}
	};

	onMount(() => {
		window.addEventListener('storage', onChange);
	});

	onCleanup(() => {
		window.removeEventListener('storage', onChange);
	});

	return [
		value,
		(v: T) => {
			if (v === undefined) {
				sessionStorage.removeItem(key);
			} else {
				sessionStorage.setItem(key, JSON.stringify(v));
				window.dispatchEvent(new StorageEvent('storage', { key }));
			}
			setValue(v);
		},
	] as const;
}
