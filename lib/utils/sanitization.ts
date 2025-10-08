/**
 * Security utilities for sanitizing user input and preventing XSS attacks
 */

/**
 * Sanitizes a string to prevent XSS attacks by escaping HTML special characters
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return input.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * Sanitizes a filename by removing potentially dangerous characters
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return 'download';
  
  // Remove path traversal attempts and dangerous characters
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // Remove invalid filename chars
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, '') // Remove trailing dots
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .substring(0, 255) // Limit length
    .trim() || 'download';
}

/**
 * Sanitizes a URL to prevent javascript: and data: URI XSS attacks
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  const trimmedUrl = url.trim().toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  if (dangerousProtocols.some(protocol => trimmedUrl.startsWith(protocol))) {
    return '';
  }
  
  return url;
}

/**
 * Sanitizes text content for safe display in React components
 * This is a more lenient version that preserves some formatting
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Validates and sanitizes email addresses
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  
  // Basic email validation and sanitization
  const sanitized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(sanitized) ? sanitized : '';
}

/**
 * Sanitizes phone numbers by removing non-numeric characters
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  
  // Keep only digits, +, -, (, ), and spaces
  return phone.replace(/[^\d+\-() ]/g, '');
}

/**
 * Deep sanitizes an object by sanitizing all string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized: any = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        sanitized[key] = sanitizeHtml(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
}

/**
 * Validates that a string contains only alphanumeric characters and safe punctuation
 */
export function isAlphanumericSafe(input: string): boolean {
  return /^[a-zA-Z0-9\s\-_.,!?()]+$/.test(input);
}

/**
 * Strips all HTML tags from a string
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  
  return html.replace(/<[^>]*>/g, '');
}
