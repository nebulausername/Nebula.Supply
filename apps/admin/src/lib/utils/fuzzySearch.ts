// Fuzzy Search Implementation for better search experience
// Uses Levenshtein distance and string matching algorithms

interface SearchResult<T> {
  item: T;
  score: number;
  matches: Array<{
    field: string;
    value: string;
    matchedText: string;
  }>;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate similarity score between two strings (0-1)
 */
function similarityScore(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / maxLength;
}

/**
 * Check if search term matches string (exact, starts with, contains, or fuzzy)
 * Optimized with early returns
 */
function matchesString(searchTerm: string, text: string, threshold: number = 0.6): {
  matches: boolean;
  score: number;
  matchedText: string;
} {
  // Early returns for empty strings
  if (!searchTerm || !text) {
    return { matches: false, score: 0, matchedText: text };
  }
  
  const lowerSearch = searchTerm.toLowerCase().trim();
  const lowerText = text.toLowerCase().trim();
  
  if (!lowerSearch || !lowerText) {
    return { matches: false, score: 0, matchedText: text };
  }

  // Exact match
  if (lowerText === lowerSearch) {
    return { matches: true, score: 1.0, matchedText: text };
  }

  // Starts with
  if (lowerText.startsWith(lowerSearch)) {
    return { matches: true, score: 0.9, matchedText: text };
  }

  // Contains
  if (lowerText.includes(lowerSearch)) {
    return { matches: true, score: 0.8, matchedText: text };
  }

  // Fuzzy match
  const similarity = similarityScore(lowerSearch, lowerText);
  if (similarity >= threshold) {
    return { matches: true, score: similarity, matchedText: text };
  }

  // Word-by-word matching
  const searchWords = lowerSearch.split(/\s+/);
  const textWords = lowerText.split(/\s+/);
  let wordMatches = 0;
  for (const searchWord of searchWords) {
    for (const textWord of textWords) {
      if (textWord.includes(searchWord) || similarityScore(searchWord, textWord) >= threshold) {
        wordMatches++;
        break;
      }
    }
  }
  if (wordMatches > 0 && wordMatches / searchWords.length >= 0.5) {
    return { matches: true, score: 0.6 + (wordMatches / searchWords.length) * 0.2, matchedText: text };
  }

  return { matches: false, score: 0, matchedText: text };
}

export interface FuzzySearchOptions<T> {
  searchFields: Array<keyof T | ((item: T) => string)>;
  threshold?: number; // Minimum similarity score (0-1)
  limit?: number; // Maximum number of results
  caseSensitive?: boolean;
}

/**
 * Perform fuzzy search on an array of items
 */
export function fuzzySearch<T>(
  items: T[],
  searchTerm: string,
  options: FuzzySearchOptions<T>
): SearchResult<T>[] {
  // Early return for empty search or items
  if (!items || items.length === 0) {
    return [];
  }
  
  if (!searchTerm || searchTerm.trim().length === 0) {
    return items.map(item => ({
      item,
      score: 1,
      matches: [],
    }));
  }
  
  const trimmedSearch = searchTerm.trim();

  const threshold = options.threshold || 0.6;
  const limit = options.limit;
  const results: SearchResult<T>[] = [];

  for (const item of items) {
    if (!item) continue; // Skip null/undefined items
    
    const matches: SearchResult<T>['matches'] = [];
    let maxScore = 0;

    for (const field of options.searchFields) {
      let fieldValue: string;
      
      try {
        if (typeof field === 'function') {
          fieldValue = String(field(item));
        } else {
          const value = (item as any)[field];
          fieldValue = value != null ? String(value) : '';
        }
      } catch (error) {
        // Skip fields that throw errors
        continue;
      }

      if (!fieldValue || fieldValue.trim().length === 0) continue;

      const matchResult = matchesString(trimmedSearch, fieldValue, threshold);
      if (matchResult.matches) {
        matches.push({
          field: typeof field === 'function' ? 'computed' : String(field),
          value: fieldValue,
          matchedText: matchResult.matchedText,
        });
        maxScore = Math.max(maxScore, matchResult.score);
      }
    }

    if (matches.length > 0) {
      results.push({
        item,
        score: maxScore,
        matches,
      });
    }
  }

  // Sort by score (highest first)
  results.sort((a, b) => b.score - a.score);

  // Apply limit
  return limit ? results.slice(0, limit) : results;
}

/**
 * Quick filter helper for common filter patterns
 */
export function createQuickFilter<T>(
  items: T[],
  filterType: 'lowStock' | 'outOfStock' | 'featured' | 'active' | 'inactive',
  getStock?: (item: T) => number,
  getStatus?: (item: T) => string,
  getFeatured?: (item: T) => boolean
): T[] {
  switch (filterType) {
    case 'lowStock':
      if (!getStock) return items;
      return items.filter(item => {
        const stock = getStock(item);
        return stock > 0 && stock < 20;
      });
    
    case 'outOfStock':
      if (!getStock) return items;
      return items.filter(item => getStock(item) === 0);
    
    case 'featured':
      if (!getFeatured) return items;
      return items.filter(item => getFeatured(item) === true);
    
    case 'active':
      if (!getStatus) return items;
      return items.filter(item => getStatus(item) === 'active');
    
    case 'inactive':
      if (!getStatus) return items;
      return items.filter(item => getStatus(item) !== 'active');
    
    default:
      return items;
  }
}

