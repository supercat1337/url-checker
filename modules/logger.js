// @ts-check
import { createWriteStream } from 'fs';
import path from 'path';

/**
 * Logger class for logging messages to a file.
 */
export class Logger {
    #isClosed = false;
    #isClosing = false;
    #pendingWrites = 0;
    /** @type {Promise<void>|null} */
    #closePromise = null;
    /** @type {function|null} */
    #closeResolve = null;
    /** @type {{message: string, resolve: function, reject: function}[]} */
    #queue = [];
    #isWriting = false;

    /**
     * Constructor for Logger class.
     * @param {string} filePath Path to the log file.
     */
    constructor(filePath, { useDate = false } = {}) {
        this.filePath = filePath;
        this.useDate = useDate;
        this.#init();
    }

    #init() {
        this.stream = createWriteStream(this.filePath, {
            flags: 'a', // append
            encoding: 'utf8',
        });
    }

    /**
     * Writes a log message to the log file.
     * @param {string} message The message to write to the log file.
     * @param {string} level The log level (e.g., "info", "warn", "error").
     * @returns {Promise<void>} A promise that resolves when the message has been written.
     */
    async log(message, level = "") {
        return new Promise((resolve, reject) => {
            let msg = level ? `[${level}] ${message}` : message;
            this.#queue.push({ message: msg, resolve, reject });
            this.#processQueue();
        });
    }

    /**
     * Writes an error message to the log file.
     * @param {string} message The message to write to the log file.
     * @returns {Promise<void>} A promise that resolves when the message has been written.
     */
    async error(message) {
        return this.log(message, "error");
    }

    /**
     * Writes a warning message to the log file.
     * @param {string} message The message to write to the log file.
     * @returns {Promise<void>} A promise that resolves when the message has been written.
     */
    async warn(message) {
        return this.log(message, "warn");
    }

    /**
     * Writes an info message to the log file.
     * @param {string} message The message to write to the log file.
     * @returns {Promise<void>} A promise that resolves when the message has been written.
     */
    async info(message) {
        return this.log(message, "info");
    }
    

    async #processQueue() {
        if (this.#isWriting || this.#queue.length === 0) return;

        this.#isWriting = true;
        const data = this.#queue.shift();
        if (!data) {
            this.#isWriting = false;
            return;
        }

        const { message, resolve, reject } = data;

        try {
            await this.#writeInternal(message);
            resolve();
        } catch (error) {
            reject(error);
        } finally {
            this.#isWriting = false;
            setImmediate(() => this.#processQueue());
        }
    }

    /**
     * Internal method to write a message to the stream.
     * @param {string} message The message to write.
     */
    async #writeInternal(message) {
        if (this.#isClosed || this.#isClosing) {
            throw new Error('Logger is closing or closed');
        }

        if (!this.stream) {
            this.#init();
        }

        // for TypeScript checking
        if (!this.stream) {
            throw new Error('Logger stream is not initialized');
        }

        if (this.useDate) {
            message = `${new Date().toISOString()} - ${message}`;
        }

        this.#pendingWrites++;

        try {
            const canWrite = this.stream.write(message + '\n');

            // If the internal buffer is full, wait for 'drain' event
            if (!canWrite) {
                await new Promise(resolve => {
                    if (!this.stream) {
                        resolve(false);
                        return;
                    }
                    this.stream.once('drain', () => {
                        resolve(true);
                    });
                });
            }
        } finally {
            this.#pendingWrites--;

            // Check if we are closing and there are no pending writes
            if (this.#isClosing && this.#pendingWrites === 0 && this.#closeResolve) {
                this.#closeResolve();
            }
        }
    }

    /**
     * Closes the logger and waits for all pending writes to finish.
     * If there are no pending writes, the logger is closed immediately.
     * If there are pending writes, a promise is returned that resolves when all pending writes are finished.
     * The logger will be closed even if there are errors during the write process.
     * @returns {Promise<boolean>} - A promise that resolves to true when the logger is closed.
     */
    async close() {
        if (this.#isClosed) return true;

        this.#isClosing = true;

        if (this.#pendingWrites > 0) {
            this.#closePromise = new Promise(resolve => {
                this.#closeResolve = resolve;
            });
            await this.#closePromise;
        }

        return new Promise(resolve => {
            if (!this.stream) {
                this.#isClosed = true;
                resolve(true);
                return;
            }

            this.stream.end(() => {
                this.#isClosed = true;
                this.stream = null;
                resolve(true);
            });
        });
    }
}

/**
 * Converts a file path to a log file path by appending '.log' to the end.
 * @param {string} filePath The file path to convert.
 * @param {string} [suffix = ""] The suffix to append to the file name.
 * @returns {string} The log file path.
 */
export function convertFilePathToLogFilePath(
    filePath,
    suffix = '',
    { outputDir = '', extension = '.log' } = {}
) {
    const dir = path.dirname(filePath);
    const sourceFileExt = path.extname(filePath);
    const base = path.basename(filePath, sourceFileExt);
    const logName = suffix ? `${base}${suffix}${extension}` : `${base}${extension}`;

    let result = path.join(dir, logName);

    if (outputDir) {
        outputDir = path.resolve(outputDir);
        result = path.join(outputDir, result);
    }
    return result;
}
