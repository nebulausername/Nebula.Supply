/**
 * Route Validation & Security Utilities
 * 
 * Expert-level security validation for shop routes:
 * - Path traversal protection
 * - XSS prevention via slug sanitization
 * - SQL injection protection (if DB is used)
 * - Rate limiting helpers
 */

import { validateSlug, sanitizeSlug } from "@nebula/shared";

/**
 * Validates shop route slugs
 * Returns true if all slugs are valid and safe
 */
export function validateShopRoute(params: {
  categorySlug?: string;
  brandSlug?: string;
  seriesSlug?: string;
}): {
  valid: boolean;
  sanitized: {
    categorySlug: string;
    brandSlug: string;
    seriesSlug: string;
  };
  errors: string[];
} {
  const errors: string[] = [];
  const sanitized = {
    categorySlug: sanitizeSlug(params.categorySlug),
    brandSlug: sanitizeSlug(params.brandSlug),
    seriesSlug: sanitizeSlug(params.seriesSlug)
  };

  // Validate each slug if provided
  if (params.categorySlug !== undefined) {
    if (!sanitized.categorySlug && params.categorySlug) {
      errors.push(`Invalid category slug: ${params.categorySlug}`);
    }
  }

  if (params.brandSlug !== undefined) {
    if (!sanitized.brandSlug && params.brandSlug) {
      errors.push(`Invalid brand slug: ${params.brandSlug}`);
    }
    // Brand requires category
    if (params.brandSlug && !params.categorySlug) {
      errors.push("Brand slug requires category slug");
    }
  }

  if (params.seriesSlug !== undefined) {
    if (!sanitized.seriesSlug && params.seriesSlug) {
      errors.push(`Invalid series slug: ${params.seriesSlug}`);
    }
    // Series requires brand and category
    if (params.seriesSlug && (!params.brandSlug || !params.categorySlug)) {
      errors.push("Series slug requires both category and brand slugs");
    }
  }

  return {
    valid: errors.length === 0,
    sanitized,
    errors
  };
}

/**
 * Rate limiting helper (client-side check)
 * In production, this should be enforced server-side
 */
const routeAccessCache = new Map<string, { count: number; resetAt: number }>();

export function checkRouteRateLimit(
  route: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now();
  const key = route;

  const cached = routeAccessCache.get(key);

  if (!cached || now > cached.resetAt) {
    routeAccessCache.set(key, {
      count: 1,
      resetAt: now + windowMs
    });
    return true;
  }

  if (cached.count >= maxRequests) {
    return false; // Rate limit exceeded
  }

  cached.count++;
  return true;
}

/**
 * Cleans up old rate limit entries
 */
export function cleanupRateLimitCache(): void {
  const now = Date.now();
  for (const [key, value] of routeAccessCache.entries()) {
    if (now > value.resetAt) {
      routeAccessCache.delete(key);
    }
  }
}

// Auto-cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(cleanupRateLimitCache, 5 * 60 * 1000);
}

