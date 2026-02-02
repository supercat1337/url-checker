// @ts-check

import { init } from '#modules/init.js';
import { Logger } from '#modules/logger.js';
import { formatError, formatSuccess, getDomainWithProtocol, resolveLocationUrl } from '#modules/tools.js';

const filename = 'urls.txt';
const maxConcurrentChecks = 16;

// Optional parameters
const taskContext = {
    tail: '/some-extra-path',
    removeWWW: true,
    timeout: 10000, // timeout in milliseconds
};

/**
 *
 * @param {{line: string, lineNumber: number}} data
 * @param {{tail: string, removeWWW: boolean, timeout: number, logger: Logger}} taskContext
 * @returns {Promise<void>}
 */
export async function task({ line, lineNumber }, { tail, removeWWW, timeout, logger }) {
    let url = getDomainWithProtocol(line, 'https://', removeWWW);
    if (url.length === 0) {
        return;
    }
    url += tail;

    /** @type {string|null} */
    let redirectedUrl = null;

    console.log(`Processing: ${url} (line ${lineNumber})`);

    try {
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'manual',
            signal: AbortSignal.timeout(timeout),
        });
        if (response.status === 0) {
            logger.error(formatError(new Error('Network error'), { line, lineNumber }));
            return;
        }
        // if is redirect
        const location = response.headers.get('Location');
        if (location) {
            redirectedUrl = resolveLocationUrl(location, url);
        } else {
            // console.error('No Location header found for redirect');
            logger.error(formatError(new Error('No Location header'), { line, lineNumber }));
            return;
        }

        if (redirectedUrl === null) {
            logger.error(formatError(new Error('No Location header'), { line, lineNumber }));
            return;
        }

        //console.log(`Redirected to: ${redirectedUrl} (${url} line ${lineNumber})`);

        const response2 = await fetch(redirectedUrl, {
            method: 'GET',
            signal: AbortSignal.timeout(timeout),
        });

        try {
            let text = await response2.text();
            if (/hello world/i.test(text)) {
                logger.log(formatSuccess(response2.url));
                return;
            }
        } catch (e) {
            console.error(
                `Error reading response text: ${e} (${url} -> ${redirectedUrl} line ${lineNumber})`
            );
            logger.error(formatError(new Error('Error reading response text'), { line, lineNumber }));
        }
    } catch (e) {
        let err = e instanceof Error ? e : new Error(String(e));
        logger.error(formatError(err, { line, lineNumber }));
        return;
    }
}

await init(filename, task, taskContext, maxConcurrentChecks);
console.log('Done.');
