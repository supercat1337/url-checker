// @ts-check
import { createWriteStream } from 'fs';
import path from 'path';

/**
 * Logger class for logging messages to a file.
 */
export class Logger {
    /**
     * Constructor for Logger class.
     * @param {string} filePath Path to the log file.
     */
    constructor(filePath) {
        this.stream = createWriteStream(filePath, {
            flags: 'a', // append
            encoding: 'utf8',
        });
    }

    /**
     * Writes a log message to the log file.
     * @param {string} message The message to write to the log file.
     */
    log(message) {
        // const data = `${new Date().toISOString()} - ${message}\n`;
        this.stream.write(message + '\n');
    }

    /**
     * Writes a success message to the log file.
     * @param {string} url The URL that was successfully checked.
     * @param {number|null} lineNumber The line number where the URL was found.
     */
    success(url, lineNumber) {
        //let message = `Success: ${url} ${lineNumber ? `(line ${lineNumber})` : ''}`;
        // console.log('Success:', url, lineNumber ? `(line ${lineNumber})` : '');
        // Write to log file
        // this.log(message);

        this.log(url);
    }

    /**
     * Writes an error message to the log file.
     * @param {Error} err The error to log.
     * @param {Object} [options] Optional parameters to include in the error log.
     * @param {string} [options.line] The line of code where the error occurred.
     * @param {number|null} [options.lineNumber] The line number where the error occurred.
     */
    error(err, { line = '', lineNumber = null } = {}) {
        let message = `Error: ${err.message}, Line: ${line}, ${lineNumber ? `(line ${lineNumber})` : ''}`;
        //console.error('Error:', err, 'Line:', line, lineNumber ? `(line ${lineNumber})` : '');
        // Write to log file
        // this.log(message);
    }

    close() {
        return new Promise(resolve => this.stream.end(resolve));
    }
}

/**
 * Converts a file path to a log file path by appending '.log' to the end.
 * @param {string} filePath The file path to convert.
 * @returns {string} The log file path.
 */
export function convertFilePathToLogFilePath(filePath) {
    let result = path.basename(filePath, path.extname(filePath));
    return result + '.log';
}
