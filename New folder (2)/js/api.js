// js/api.js
import { API_BASE_URL } from './config.js';
import { getAuth } from './auth.js';

// Utility functions for fetchWithRetry
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const parseRetryAfter = (retryAfter) => {
  if (!retryAfter) return null;
  const seconds = parseInt(retryAfter, 10);
  if (!isNaN(seconds)) return seconds * 1000;
  const date = new Date(retryAfter);
  if (!isNaN(date.getTime())) return Math.max(0, date.getTime() - Date.now());
  return null;
};

const isRetryableStatus = (status) => [408, 429, 500, 502, 503, 504].includes(status);

const isNetworkOrTimeoutError = (error) => error.name === 'TypeError' || error.name === 'TimeoutError' || error.name === 'AbortError';

const isIdempotentMethod = (method) => ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'].includes(method.toUpperCase());

// fetchWithRetry for browser
async function fetchWithRetry(url, options = {}, timeout = 10000, retries = 3, userSignal = null) {
  const { method = 'GET' } = options;
  const isIdempotent = isIdempotentMethod(method);
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutSignal = AbortSignal.timeout(timeout);
      const combinedSignal = userSignal ? AbortSignal.any([timeoutSignal, userSignal]) : timeoutSignal;

      const response = await fetch(url, {
        ...options,
        signal: combinedSignal,
      });

      if (response.ok) {
        return response;
      }

      // Check for retryable status codes
      if (isRetryableStatus(response.status) && (isIdempotent || response.status === 429 || response.status === 503)) {
        const retryAfter = parseRetryAfter(response.headers.get('Retry-After'));
        const delay = retryAfter || Math.min(300 * Math.pow(2, attempt) + Math.random() * 60, 30000); // Exponential backoff with jitter
        if (attempt < retries) {
          await sleep(delay);
          continue;
        }
      }

      // Non-retryable error
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error;
      if (isNetworkOrTimeoutError(error) && attempt < retries && (isIdempotent || error.name === 'TypeError')) {
        const delay = Math.min(300 * Math.pow(2, attempt) + Math.random() * 60, 30000);
        await sleep(delay);
        continue;
      }
      // If not retryable or max retries reached, throw
      break;
    }
  }

  // Detailed error messages
  if (lastError.name === 'TimeoutError') {
    throw new Error('Request timed out. Please check your internet connection and try again.');
  } else if (lastError.name === 'AbortError') {
    throw new Error('Request was aborted.');
  } else if (lastError.name === 'TypeError') {
    throw new Error('Network error. Please check your internet connection.');
  } else if (lastError.message.includes('429')) {
    throw new Error('Rate limit exceeded. Please wait a moment and try again.');
  } else if (lastError.message.includes('503') || lastError.message.includes('502') || lastError.message.includes('504')) {
    throw new Error('Server is temporarily unavailable. Please try again later.');
  } else {
    throw new Error(`Server error: ${lastError.message}`);
  }
}

// sendToAI function
async function sendToAI(provider, userText, imagesB64, context, mode) {
  const auth = getAuth();
  let authToken = null;
  if (auth.currentUser) {
    authToken = await auth.currentUser.getIdToken();
  }

  const requestBody = {
    provider,
    text: userText,
    images: imagesB64 || [],
    context: context || [],
    mode: mode || 'learn'
  };

  const headers = {
    'Content-Type': 'application/json'
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    }, 30000, 3); // 30s timeout, 3 retries

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Unknown server error');
    }
    return data.text;
  } catch (error) {
    // Re-throw with detailed message
    throw error;
  }
}

export { fetchWithRetry, sendToAI };