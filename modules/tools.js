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
 * Normalizes a URL by ensuring it has a protocol and extracting the domain.
 * @param {string} url The URL to normalize.
 * @param {string} protocol The protocol to use. Default is 'https://'.
 * @returns {string} The normalized URL.
 */
export function normalizeUrl(url, protocol = 'https://', removeWWW = true) {
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
