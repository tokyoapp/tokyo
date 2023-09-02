import { createSignal } from 'solid-js';
import open from './open.js';
import reload from './reload.js';

type Job = {
  running: boolean;
  result: Promise<void>;
};

const queue = new Set<Job>();

const [runningJobCount, setRunningJobCount] = createSignal(0);

export default class Action {
  static actions: Record<string, (...args: string[]) => Promise<void>> = {
    reload: reload,
    open: open,
  } as const;

  static get runningJobCount() {
    return runningJobCount;
  }

  static run(action: keyof typeof this.actions, args: string[] = []) {
    const prom: Promise<void> = this.actions[action](...args);

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
      Action.run(action);
    };
  }
}
