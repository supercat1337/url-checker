// @ts-check
import { Logger } from './src/logger.js';
import { normalizeUrl, resolveLocationUrl } from './src/tools.js';

/**
 *
 * @param {string} line
 * @param {{tail: string, removeWWW: boolean}} taskContext
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
        const response = await fetch(url, { method: 'GET', redirect: 'manual' });
        if (response.status === 0) {
            logger.error(new Error('Network error'), { line, lineNumber });
            return;
        }
        // if is redirect
        const location = response.headers.get('Location');
        if (location) {
            redirectedUrl = resolveLocationUrl(location, url);
        } else {
            logger.error(new Error(`No Location header`), { line, lineNumber });
            return;
        }

        if (redirectedUrl === null) {
            logger.error(new Error(`No Location header`), { line, lineNumber });
            return;
        }

        // console.log(`Redirected to: ${redirectedUrl}`);

        const response2 = await fetch(redirectedUrl, { method: 'GET' });
        if (response2.status === 200) {
            logger.success(redirectedUrl, lineNumber);
            return;
        } else {
            logger.error(new Error(`Unexpected status code: ${response2.status}`), {
                line,
                lineNumber,
            });
            return;
        }
    } catch (e) {
        let err = e instanceof Error ? e : new Error(String(e));
        logger.error(err, { line, lineNumber });
        return;
    }
}
