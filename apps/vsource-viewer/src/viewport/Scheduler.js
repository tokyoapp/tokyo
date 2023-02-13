export class Scheduler {

    static timer(timer, callback) {
        let accumulator = 0;

        return function(deltaTime) {
            accumulator += deltaTime;
            if(accumulator >= timer) {
                callback(accumulator);
                accumulator = 0;
            }
        }
    }

    constructor() {
        this.queue = [];
    }

    addTask(task) {
        if(task instanceof Task) {
            this.queue.push(task);
        }
    }

    removeTask(task) {
        const index = this.queue.indexOf(task);
        if(index != -1) {
            this.queue.splice(index, 1);
        }
    }

    requestTask() {
        if(this.queue.length > 0) {
            const task = this.queue[0];
            return task;
        }
        return null;
    }

    run(deltaTime) {
        for(let task of this.queue) {
            const done = task.execute(deltaTime);
            if(done) this.removeTask(task);
        }
    }
}

export class Task {

    constructor(taskFunction) {
        this.taskFunction = () => {
            return true;
        };
        this.taskFunction = taskFunction;
    }

    execute(ms) {
        return this.taskFunction(ms);
    }

}
