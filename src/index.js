// @ts-check

import { Queue } from './queue.js';
import { TextFileReader } from './textfile-reader.js';
import { convertFilePathToLogFilePath, Logger } from './logger.js';

/**
 * Initializes and runs the URL checking process.
 * @param {string} filename - The path to the input file containing URLs.
 * @param {function} task - The task function to run for each URL.
 * @param {object} taskContext - The context object to pass to the task function.
 * @param {string} taskContext.tail - The path to append to the URL.
 * @param {boolean} taskContext.removeWWW - Whether to remove "www." from the URL.
 * @param {number} [tasksLimit=16] - The maximum number of concurrent tasks.
 */
export async function init(filename, task, taskContext, tasksLimit = 16) {
    const logFilePath = convertFilePathToLogFilePath(filename);
    const logger = new Logger(logFilePath);
    const textFileReader = new TextFileReader();
    // Open a file
    const queue = new Queue();

    textFileReader.openFile(filename);

    // Read from the last saved position
    await textFileReader.read(async (line, lineNumber) => {
        queue.addTaskAndRun(async () => {
            // add task to queue and run it
            return task(line, taskContext, { logger, lineNumber: lineNumber }); // run the task
        });

        await queue.waitForLessThan(tasksLimit);
    });

    await queue.waitUntilEmpty(); // wait until all tasks are completed

    textFileReader.close(); // Close the file
    logger.close(); // Close the logger
}
