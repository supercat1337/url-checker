// @ts-check

import { App } from '#modules/app.js';
import { convertFilePathToLogFilePath, Logger } from '#modules/logger.js';
import { formatError, getUrlFromLine, normalizeUrl } from '#modules/tools.js';

const filename = 'urls.txt';
const maxConcurrentChecks = 32;
const keyWordInPath = '/path/';
const keyWordInContent = /hello world/i;

// Optional parameters
const taskContext = {
    timeout: 10000, // timeout in milliseconds
};

/**
 * @param {{line: string, lineNumber: number}} data
 * @param {{timeout: number, logger: Logger}} taskContext
 * @returns {Promise<void>}
 */
export async function task({ line, lineNumber }, { timeout, logger }) {
    //console.log(`Processing: ${line} (line ${lineNumber})`);
    let lineUrl = getUrlFromLine(line);
    //console.log(`Extracted URL: ${lineUrl} (line ${lineNumber})`);
    if (lineUrl.length === 0) {
        return;
    }

    // get last index of keyWord in lineUrl
    let lastIndex = lineUrl.lastIndexOf(keyWordInPath);
    if (lastIndex == -1) {
        return;
    }

    let url = lineUrl.slice(0, lastIndex + keyWordInPath.length);
    url = normalizeUrl(url, { defaultProtocol: 'https://', forceDefaultProtocol: true });

    console.log(`Processing: ${url} (line ${lineNumber})`);

    try {
        const response = await fetch(url, {
            method: 'GET',
            signal: AbortSignal.timeout(timeout),
        });
        if (response.status === 0) {
            let err = formatError(new Error('Network error'), { line, lineNumber });
            console.error(err);
            //logger.error(err);
            return;
        }

        try {
            let text = await response.text();
            if (keyWordInContent.test(text)) {
                logger.log(line);
                return;
            }
        } catch (e) {
            let error = e instanceof Error ? e : new Error(String(e));
            let err = formatError(error, { line, lineNumber });
            console.error(err);
        }
    } catch (e) {
        let error = e instanceof Error ? e : new Error(String(e));
        let err = formatError(error, { line, lineNumber });
        console.error(err);
        //logger.error(err);
        return;
    }
}

const logFilePath = convertFilePathToLogFilePath(filename);
const logger = new Logger(logFilePath);
const app = new App();

const ctx = { ...taskContext, logger };

app.setTask(task, ctx, maxConcurrentChecks);
app.onClose(() => {
    logger.close(); // Close the logger when app is closed
});

await app.run(filename);
console.log('Done.');
