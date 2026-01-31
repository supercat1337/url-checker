// @ts-check

/**
 * Returns the domain of a given URL.
 * @param {string} url The URL to parse.
 * @param {boolean} removeWWW Whether to remove the 'www.' prefix from the domain. Default is true.
 * @returns {string} The domain of the given URL.
 */
export function getDomainFromUrl(url, removeWWW = true) {
    let normalized = url.trim().toLowerCase();
    if (normalized.length === 0) {
        return '';
    }
    normalized = normalized.replace(/^[a-z]+:\/+/, '');
    normalized = 'https://' + normalized;

    try {
        const urlObj = new URL(normalized);
        let domain = urlObj.hostname;

        if (removeWWW && domain.startsWith('www.')) {
            domain = domain.substring(4);
        }

        return domain;
    } catch (e) {
        return url.split(/[/:#?]/)[0].replace(/:\d+$/, '');
    }
}

/**
 * Normalizes a URL by adding a default protocol and/or replacing the existing protocol.
 * @param {string} url The URL to normalize.
 * @param {object} [options] - Optional parameters.
 * @param {string} [options.defaultProtocol='https://'] The default protocol to use if the URL does not start with 'http://' or 'https://'.
 * @param {boolean} [options.forceDefaultProtocol=true] Whether to replace the existing protocol with the default protocol.
 * @returns {string} The normalized URL.
 */
export function normalizeUrl(
    url,
    { defaultProtocol = 'https://', forceDefaultProtocol = true } = {}
) {
    let result = getUrlFromLine(url);
    if (result.length === 0) {
        return '';
    }

    if (/^https?:\/\//i.test(url) === false) {
        url = defaultProtocol + url;
    } else if (forceDefaultProtocol) {
        url = url.replace(/^https?:\/\//i, defaultProtocol);
    }

    return url;
}

/**
 * Returns a URL with the specified protocol and domain.
 * @param {string} url The URL to parse.
 * @param {string} [protocol='https://'] The protocol to use. Default is 'https://'.
 * @param {boolean} [removeWWW=true] Whether to remove the 'www.' prefix from the domain. Default is true.
 * @returns {string} The URL with the specified protocol and domain.
 */
export function getDomainWithProtocol(url, protocol = 'https://', removeWWW = true) {
    let domain = getDomainFromUrl(url, removeWWW);
    if (domain.length === 0) {
        return '';
    }

    return protocol + domain;
}

/**
 * Resolves a location URL by handling both absolute and relative URLs.
 * @param {string|null} location The location URL to resolve.
 * @param {string} baseUrl The base URL to use when resolving relative URLs.
 * @returns {string|null} The resolved URL, or null if an error occurred.
 * @throws {Error} If the base URL is required but not provided.
 */
export function resolveLocationUrl(location, baseUrl) {
    if (!location) return null;

    try {
        // if absolute URL
        if (location.startsWith('http://') || location.startsWith('https://')) {
            return new URL(location).toString();
        }

        // if relative URL
        if (!baseUrl) {
            throw new Error('Base URL is required for relative locations');
        }

        return new URL(location, baseUrl).toString();
    } catch (error) {
        let err = error instanceof Error ? error : new Error(String(error));
        console.error(`Failed to resolve location "${location}":`, err);
        return null;
    }
}

/**
 * Formats an error message with the original line and line number.
 * @param {Error} err - The error object to format.
 * @param {{line?: string, lineNumber?: number|null}} [options={}] Additional options including line and lineNumber.
 * @returns {string} - The formatted error message.
 */
export function formatError(err, { line = '', lineNumber = null } = {}) {
    let message = `${err.message}, Line: ${line}, ${lineNumber ? `(line ${lineNumber})` : ''}`;
    return message;
}

/**
 * Formats a success message with the original line and line number.
 * @param {string} message The success message to format.
 * @param {{line?: string, lineNumber?: number|null}} [options={}] Additional options including line and lineNumber.
 * @returns {string} The formatted success message.
 */
export function formatSuccess(message, { line = '', lineNumber = null } = {}) {
    let result = message;
    if (line) {
        result += `, Line: ${line}`;
    }
    if (lineNumber !== null && lineNumber !== undefined) {
        result += ` (line ${lineNumber})`;
    }
    return result;
}

/**
 * Gets URL from a line of text
 * @param {string} line
 * @returns
 */
export function getUrlFromLine(line) {
    line = line.trim();
    let m = line.match(/(?:https?:\/\/)(?:[^\s]+\.[^\s]+)/i);
    if (m) {
        return m[0];
    }

    let m1 = line.match(/(?:https?:\/\/)?(?:[^\s]+\.[^\s]+)/i);
    return m1 ? m1[0] : '';
}
