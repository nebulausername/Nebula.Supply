import type { Drop } from "@nebula/shared";
import { categories } from "@nebula/shared";

/**
 * Map drop to category based on name, flavorTag, or other heuristics
 * This is a temporary solution until drops have explicit categoryId
 */
export function getDropCategoryId(drop: Drop): string | null {
  const dropNameLower = drop.name.toLowerCase();
  const flavorTagLower = drop.flavorTag?.toLowerCase() || "";
  const combined = `${dropNameLower} ${flavorTagLower}`;

  // Match categories by slug keywords
  for (const category of categories) {
    const keywords: Record<string, string[]> = {
      "cat-shoes": ["sneaker", "shoe", "schuh", "sneakers"],
      "cat-tshirt": ["t-shirt", "tshirt", "shirt", "tee"],
      "cat-pants": ["pants", "hose", "pant", "jeans"],
      "cat-shorts": ["shorts", "kurze", "short"],
      "cat-caps": ["cap", "cap", "mütze", "hat"],
      "cat-watch": ["watch", "uhr", "zeit"],
      "cat-hoodies": ["hoodie", "hood", "pulli"],
      "cat-jackets": ["jacket", "jacke", "mantel"],
      "cat-accessories": ["accessoire", "tasche", "rucksack", "gürtel"],
      "cat-tech": ["tech", "case", "sleeve", "phone"],
      "cat-bundle": ["bundle", "pack", "set", "paket"]
    };

    const categoryKeywords = keywords[category.id] || [];
    if (categoryKeywords.some(keyword => combined.includes(keyword))) {
      return category.id;
    }
  }

  return null;
}

/**
 * Get category count for all drops
 */
export function getCategoryCounts(drops: Drop[]): Record<string, number> {
  const counts: Record<string, number> = {};
  
  drops.forEach(drop => {
    const categoryId = getDropCategoryId(drop);
    if (categoryId) {
      counts[categoryId] = (counts[categoryId] || 0) + 1;
    }
  });

  return counts;
}

/**
 * Filter drops by category
 */
export function filterDropsByCategory(drops: Drop[], categoryId: string | null): Drop[] {
  if (!categoryId) return drops;
  
  return drops.filter(drop => getDropCategoryId(drop) === categoryId);
}
