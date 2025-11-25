/**
 * Utility functions for generating SEO-friendly slugs
 * Security: Validates and sanitizes input to prevent path traversal and XSS
 */

/**
 * Converts a string to a URL-safe slug
 * - Lowercase
 * - Replace spaces and special chars with hyphens
 * - Remove invalid characters
 * - Max 50 characters
 */
export function createSlug(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars except word chars, spaces, hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .slice(0, 50); // Max 50 characters
}

/**
 * Validates a slug for security
 * - Only allows lowercase letters, numbers, and hyphens
 * - Prevents path traversal attacks (../)
 * - Max 50 characters
 */
export function validateSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false;
  }
  
  // Path traversal protection
  if (slug.includes('..') || slug.includes('/') || slug.includes('\\')) {
    return false;
  }
  
  // Only allow lowercase alphanumeric and hyphens, 1-50 chars
  return /^[a-z0-9-]{1,50}$/.test(slug);
}

/**
 * Sanitizes a slug parameter from URL
 * Returns empty string if invalid (safe default)
 */
export function sanitizeSlug(slug: string | undefined | null): string {
  if (!slug || typeof slug !== 'string') {
    return '';
  }
  
  const cleaned = slug.trim().toLowerCase();
  
  if (!validateSlug(cleaned)) {
    return '';
  }
  
  return cleaned;
}

