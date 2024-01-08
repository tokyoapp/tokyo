import { createSignal } from 'solid-js';
import create from './create.js';
import open from './open.js';
import reload from './reload.js';
import search from './search.js';

type Job = {
	running: boolean;
	result: Promise<void>;
};

const queue = new Set<Job>();

const [runningJobCount, setRunningJobCount] = createSignal(0);

type ActionFunction = (...args: any[]) => Promise<void>;

export default class Jobs {
	static actions = {
		reload: reload as ActionFunction,
		open: open as ActionFunction,
		search: search as ActionFunction,
		create: create as ActionFunction,
	} as const;

	static get runningJobCount() {
		return runningJobCount;
	}

	static run(action: keyof typeof this.actions, args: any[] = []) {
		const prom: Promise<void> = Jobs.actions[action](...args);

		const job = {
			running: true,
			result: prom,
		};

		queue.add(job);
		setRunningJobCount(queue.size);
		prom.finally(() => {
			job.running = false;
			queue.delete(job);
			setRunningJobCount(queue.size);
		});
	}

	static map(action: keyof typeof this.actions) {
		return () => {
			Jobs.run(action);
		};
	}
}
