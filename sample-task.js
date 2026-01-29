// @ts-check
import { Logger } from './src/logger.js';
import { normalizeUrl } from './src/tools.js';

/**
 * Formats an error message with the original line and line number.
 * @param {Error} err - The error object to format.
 * @param {string} line - The original line from the input file.
 * @param {number} [lineNumber] - The line number of the original line in the input file.
 * @returns {string} - The formatted error message.
 */
function formatError(err, line, lineNumber) {
    let message = `Error: ${err.message}, Line: ${line}, ${lineNumber ? `(line ${lineNumber})` : ''}`;
    return message;
}

/**
 * Formats a success message with the original URL and line number.
 * @param {string} url The URL that was successfully checked.
 * @param {number} [lineNumber] The line number of the original URL in the input file.
 * @returns {string} The formatted success message.
 */
function formatSuccess(url, lineNumber) {
    //let message = `Success: ${url} ${lineNumber ? `(line ${lineNumber})` : ''}`;
    let message = url;
    return message;
}

/**
 * Check if a URL is valid and accessible.
 * @param {string} line
 * @param {{tail: string, removeWWW: boolean, timeout: number}} taskContext
 * @param {{logger: Logger, lineNumber: number}} options
 * @returns {Promise<void>}
 */
export async function task(line, taskContext, { logger, lineNumber }) {
    let url = normalizeUrl(line, 'https://', taskContext.removeWWW);
    if (url.length === 0) {
        return;
    }
    url += taskContext.tail;

    console.log(`Processing: ${url} (line ${lineNumber})`);

    try {
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'manual',
            signal: AbortSignal.timeout(taskContext.timeout),
        });
        if (response.status === 0) {
            console.error('Network error');
            logger.log(formatError(new Error('Network error'), line, lineNumber));
            return;
        } else {
            logger.log(formatSuccess(url, lineNumber));
            return;
        }
    } catch (e) {
        console.error(e);
        let err = e instanceof Error ? e : new Error(String(e));
        logger.log(formatError(err, line, lineNumber));
        return;
    }
}
