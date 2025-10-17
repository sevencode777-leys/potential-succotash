// c:/Users/90506/Desktop/New folder (2)/server/utils/fetchWithRetry.js

/**
 * Sleep for a given number of milliseconds.
 * @param {number} ms - Milliseconds to sleep.
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse the Retry-After header value.
 * @param {string} header - The Retry-After header value.
 * @returns {number|null} Delay in milliseconds, or null if invalid.
 */
function parseRetryAfter(header) {
  if (!header) return null;
  const seconds = parseInt(header, 10);
  if (!isNaN(seconds)) return seconds * 1000; // Convert to milliseconds
  const date = new Date(header);
  if (!isNaN(date.getTime())) return Math.max(0, date.getTime() - Date.now());
  return null;
}

/**
 * Check if the HTTP status code is retryable.
 * @param {number} status - HTTP status code.
 * @returns {boolean} True if retryable.
 */
function isRetryableStatus(status) {
  return [408, 429, 500, 502, 503, 504].includes(status);
}

/**
 * Check if the error is a network or timeout error.
 * @param {Error} error - The error object.
 * @returns {boolean} True if it's a network or timeout error.
 */
function isNetworkOrTimeoutError(error) {
  return error instanceof TypeError || error.name === 'AbortError' || error.name === 'TimeoutError';
}

/**
 * Calculate exponential backoff delay with jitter.
 * @param {number} attempt - The current attempt number (starting from 0).
 * @returns {number} Delay in milliseconds.
 */
function calculateBackoff(attempt) {
  const base = 300;
  const factor = 2;
  const jitter = 0.2;
  const delay = base * Math.pow(factor, attempt);
  const jitterAmount = delay * jitter * (Math.random() - 0.5) * 2; // Random jitter between -20% and +20%
  return Math.max(0, delay + jitterAmount);
}

/**
 * Fetch with retry logic, timeout, and abort support.
 * @param {string} url - The URL to fetch.
 * @param {object} options - Options object.
 * @param {string} [options.method='GET'] - HTTP method.
 * @param {any} [options.body] - Request body.
 * @param {object} [options.headers={}] - Request headers.
 * @param {number} [options.timeout=10000] - Timeout in milliseconds (default 10s).
 * @param {number} [options.retries=3] - Number of retries.
 * @param {AbortSignal} [options.signal] - User-provided abort signal.
 * @param {function} [options.onRetry] - Callback for retry events: (attempt, reason, delay).
 * @returns {Promise<Response>} The fetch response.
 * @throws {Error} If all retries are exhausted or error is not retryable.
 */
async function fetchWithRetry(url, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    timeout = 10000,
    retries = 3,
    signal,
    onRetry
  } = options;

  const idempotentMethods = ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'];
  const isIdempotent = idempotentMethods.includes(method.toUpperCase());

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutSignal = AbortSignal.timeout(timeout);
    const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal, controller.signal]) : AbortSignal.any([timeoutSignal, controller.signal]);

    try {
      const response = await fetch(url, {
        method,
        body,
        headers,
        signal: combinedSignal
      });

      if (response.ok) {
        return response;
      }

      // Check if we should retry
      if (isRetryableStatus(response.status) && isIdempotent && attempt < retries) {
        const retryAfter = parseRetryAfter(response.headers.get('retry-after'));
        const delay = retryAfter !== null ? retryAfter : calculateBackoff(attempt);
        if (onRetry) onRetry(attempt, `HTTP ${response.status}`, delay);
        await sleep(delay);
        continue;
      }

      // Not retryable or max retries reached, return the response
      return response;
    } catch (error) {
      if (isNetworkOrTimeoutError(error) && isIdempotent && attempt < retries) {
        const delay = calculateBackoff(attempt);
        if (onRetry) onRetry(attempt, error.message, delay);
        await sleep(delay);
        continue;
      }

      // Not retryable or max retries reached, throw the error
      throw error;
    }
  }
}

module.exports = {
  fetchWithRetry,
  sleep,
  parseRetryAfter,
  isRetryableStatus,
  isNetworkOrTimeoutError
};