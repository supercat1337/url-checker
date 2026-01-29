// @ts-check
import { task } from "./sample-task.js";
import { init } from "./src/index.js";

const filename = 'urls.txt';
const tasksLimit = 16;

// Optional parameters
const taskContext = {
    tail: '/some-extra-path',
    removeWWW: true
};

await init(filename, task, taskContext, tasksLimit);