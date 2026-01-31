// @ts-check
import { task } from './task.js';
import { init } from './modules/index.js';

const filename = 'urls.txt';
const maxConcurrentChecks = 32;

// Optional parameters
const taskContext = {
    removeWWW: true,
    timeout: 10000, // timeout in milliseconds
};

await init(filename, task, taskContext, maxConcurrentChecks);
