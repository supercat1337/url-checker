// @ts-check
import { Logger } from './src/logger.js';
import { normalizeUrl } from './src/tools.js';

/**
 * Check if a URL is valid and accessible.
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

    console.log(`Processing: ${url} (line ${lineNumber})`);

    try {
        const response = await fetch(url, { method: 'GET', redirect: 'manual' });
        if (response.status === 0) {
            logger.error(new Error('Network error'), { line, lineNumber });
            return;
        } else {
            logger.success(url, lineNumber);
            return;
        }
    } catch (e) {
        let err = e instanceof Error ? e : new Error(String(e));
        logger.error(err, { line, lineNumber });
        return;
    }
}
