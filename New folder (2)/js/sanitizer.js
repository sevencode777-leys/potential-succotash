/**
 * XSS Sanitization Module using DOMPurify
 * 
 * This module provides functions to sanitize HTML and plain text to prevent XSS attacks.
 * DOMPurify is used with a secure configuration to allow only safe HTML elements and attributes.
 * 
 * Security Considerations:
 * - Always sanitize user-generated content before inserting into the DOM.
 * - The configuration forbids dangerous tags and attributes to prevent script injection.
 * - For plain text, use sanitizeText to escape HTML entities and handle newlines safely.
 * - Never trust user input; sanitize on the client-side as a last line of defense.
 */

// DOMPurify is loaded from CDN and available globally

/**
 * Sanitizes HTML content using DOMPurify with a secure configuration.
 * This function removes or escapes potentially dangerous HTML elements and attributes.
 * 
 * @param {string} html - The HTML string to sanitize.
 * @returns {string} The sanitized HTML string.
 */
export function sanitizeHTML(html) {
  const config = {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'iframe', 'script', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'style'],
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SANITIZE_DOM: true,
    SANITIZE_NAMED_PROPS: true
  };
  return DOMPurify.sanitize(html, config);
}

/**
 * Converts plain text to HTML-safe format by escaping HTML entities and replacing newlines with <br> tags.
 * Uses the textContent approach to ensure HTML entities are properly escaped.
 * 
 * @param {string} text - The plain text string to sanitize.
 * @returns {string} The HTML-safe string with newlines converted to <br> tags.
 */
export function sanitizeText(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML.replace(/\n/g, '<br>');
}