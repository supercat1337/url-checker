// @ts-check
import { Logger } from './src/logger.js';
import { normalizeUrl, resolveLocationUrl } from './src/tools.js';

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
 *
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

    /** @type {string|null} */
    let redirectedUrl = null;

    console.log(`Processing: ${url} (line ${lineNumber})`);

    try {
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'manual',
            signal: AbortSignal.timeout(taskContext.timeout),
        });
        if (response.status === 0) {
            logger.log(formatError(new Error('Network error'), line, lineNumber));
            return;
        }
        // if is redirect
        const location = response.headers.get('Location');
        if (location) {
            redirectedUrl = resolveLocationUrl(location, url);
        } else {
            // console.error('No Location header found for redirect');
            logger.log(formatError(new Error('No Location header'), line, lineNumber));
            return;
        }

        if (redirectedUrl === null) {
            logger.log(formatError(new Error('No Location header'), line, lineNumber));
            return;
        }

        //console.log(`Redirected to: ${redirectedUrl} (${url} line ${lineNumber})`);

        const response2 = await fetch(redirectedUrl, {
            method: 'GET',
            signal: AbortSignal.timeout(taskContext.timeout),
        });

        try {
            let text = await response2.text();
            if (/hello world/i.test(text)) {
                logger.log(formatSuccess(redirectedUrl, lineNumber));
                return;
            }
        } catch (e) {
            console.error(
                `Error reading response text: ${e} (${url} -> ${redirectedUrl} line ${lineNumber})`
            );
            logger.log(formatError(new Error('Error reading response text'), line, lineNumber));
        }
    } catch (e) {
        let err = e instanceof Error ? e : new Error(String(e));
        logger.log(formatError(err, line, lineNumber));
        return;
    }
}
