// @ts-check

import { convertFilePathToLogFilePath, Logger } from './logger.js';
import { App } from './app.js';

/**
 * Initializes and runs the URL checking process.
 * @param {string} filename - The path to the input file containing URLs.
 * @param {(data: {line: string, lineNumber: number }, taskContext: any)=>Promise<void>} task - The task function to run for each URL.
 * @param {any} taskContext - The context object to pass to the task function.
 * @param {number} [maxConcurrentChecks=16] - The maximum number of concurrent tasks.
 */
export async function init(filename, task, taskContext, maxConcurrentChecks = 16) {
    const logFilePath = convertFilePathToLogFilePath(filename);
    const logger = new Logger(logFilePath);
    const app = new App();

    const ctx = { ...taskContext, logger };

    app.setTask(task, ctx, maxConcurrentChecks);
    app.onClose(() => {
        logger.close(); // Close the logger when app is closed
    });

    await app.run(filename);
}
