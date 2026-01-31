// @ts-check
import { Logger } from '#modules/logger.js';
import { formatError, formatSuccess, getDomainWithProtocol } from '#modules/tools.js';

/**
 * Check if a URL is valid and accessible.
 * @param {{line: string, lineNumber: number}} data
 * @param {{tail: string, removeWWW: boolean, timeout: number, logger: Logger}} taskContext
 * @returns {Promise<void>}
 */
export async function task({ line, lineNumber }, { removeWWW, timeout, logger }) {
    let url = getDomainWithProtocol(line, 'https://', removeWWW);
    if (url.length === 0) {
        return;
    }

    console.log(`Processing: ${url} (line ${lineNumber})`);

    try {
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'manual',
            signal: AbortSignal.timeout(timeout),
        });
        if (response.status === 0) {
            console.error('Network error');
            logger.error(formatError(new Error('Network error'), { line, lineNumber }));
            return;
        } else {
            logger.log(formatSuccess(url));
            return;
        }
    } catch (e) {
        console.error(e);
        let err = e instanceof Error ? e : new Error(String(e));
        logger.error(formatError(err, { line, lineNumber }));
        return;
    }
}
