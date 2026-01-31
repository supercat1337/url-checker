//@ts-check

import { EventEmitter } from './event-emitter.js';
import { Queue } from './queue.js';
import { TextFileReader } from './textfile-reader.js';

export class App {
    #eventEmitter = new EventEmitter();
    /** @type {Object} */
    taskContext = {};
    /** @type {((data: {line: string, lineNumber: number }, taskContext: Object)=>Promise<void>)|null} */
    task = null;

    #isRunning = false;

    /** @type {number} */
    #maxConcurrentChecks = 16; // maximum number of concurrent checks

    /**
     * Registers an event listener for the specified event.
     * @param {string} event The name of the event to listen for.
     * @param {function} listener The callback function to invoke when the event is emitted.
     */
    on(event, listener) {
        return this.#eventEmitter.on(event, listener);
    }

    /**
     * Registers an event listener for the "close" event. This event is emitted when the App instance is closed.
     * @param {function} listener The callback function to invoke when the event is emitted.
     * @returns {()=>void}
     */
    onClose(listener) {
        return this.#eventEmitter.on('close', listener);
    }

    /**
     * Sets the task and task context for the App instance.
     * @param {(data: {line: string, lineNumber: number }, taskContext: any)=>Promise<void>} task The task function to be run by the App instance.
     * @param {any} taskContext The context object to pass to the task function.
     * @param {number} [maxConcurrentChecks] The maximum number of concurrent checks allowed.
     */
    setTask(task, taskContext, maxConcurrentChecks) {
        this.task = task;
        this.taskContext = taskContext;
        if (maxConcurrentChecks !== undefined) this.#maxConcurrentChecks = maxConcurrentChecks;
    }

    /**
     * Gets the maximum number of concurrent checks allowed.
     * @returns {number} The maximum number of concurrent checks.
     */
    get maxConcurrentChecks() {
        return this.#maxConcurrentChecks;
    }

    /**
     * Runs the task function on each line of the specified file.
     * @param {string} filename The path to the file to read.
     * @returns {Promise<void>}
     * @throws {Error} If the task function is not set.
     * @emits {close} When all tasks have been completed.
     */
    async run(filename) {
        if (!this.task) {
            throw new Error('Task is not set');
        }

        if (this.#isRunning) {
            throw new Error('App is already running');
        }

        this.#isRunning = true;

        const textFileReader = new TextFileReader();
        // Open a file
        const queue = new Queue();

        textFileReader.openFile(filename);

        // Read from the last saved position
        await textFileReader.read(async (line, lineNumber) => {
            queue.addTaskAndRun(async () => {
                // for type checking
                if (!this.task) {
                    throw new Error('Task is not set');
                }

                // add task to queue and run it
                return this.task({ line: line, lineNumber: lineNumber }, this.taskContext); // run the task
            });

            await queue.waitForLessThan(this.maxConcurrentChecks);
        });

        await queue.waitUntilEmpty(); // wait until all tasks are completed

        textFileReader.close(); // Close the file
        this.#isRunning = false;
        this.#eventEmitter.emit('close');
    }
}
