/**
 * ML-based Recommendation Engine
 * Uses multiple factors to score and rank products
 */

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  interest?: number;
  views?: number;
  purchases?: number;
  leadTime?: string;
  tags?: string[];
  createdAt?: number;
}

export interface UserPreferences {
  interests: Record<string, number>;
  viewedProducts: string[];
  purchasedProducts: string[];
  favoriteCategories: string[];
  priceRange?: { min: number; max: number };
}

interface RecommendationScore {
  product: Product;
  score: number;
  factors: {
    interest: number;
    popularity: number;
    recency: number;
    price: number;
    category: number;
    personalization: number;
  };
}

/**
 * Calculate recommendation score for a product
 */
export const calculateRecommendationScore = (
  product: Product,
  preferences: UserPreferences
): RecommendationScore => {
  const factors = {
    // Interest-based (0-40 points)
    interest: Math.min(40, (product.interest || 0) / 10),
    
    // Popularity (0-20 points)
    popularity: Math.min(20, ((product.views || 0) + (product.purchases || 0) * 5) / 10),
    
    // Recency (0-15 points) - newer products get higher scores
    recency: product.createdAt
      ? Math.min(15, (Date.now() - product.createdAt) / (1000 * 60 * 60 * 24 * 30)) // Last 30 days
      : 5,
    
    // Price optimization (0-10 points) - prefer products in user's price range
    price: preferences.priceRange
      ? product.price >= preferences.priceRange.min && product.price <= preferences.priceRange.max
        ? 10
        : product.price < preferences.priceRange.min
        ? 7
        : product.price > preferences.priceRange.max
        ? 3
        : 5
      : 5,
    
    // Category preference (0-10 points)
    category: product.category && preferences.favoriteCategories.includes(product.category)
      ? 10
      : 5,
    
    // Personalization (0-5 points)
    personalization: preferences.viewedProducts.includes(product.id) ? 3 : 0
  };

  const totalScore = Object.values(factors).reduce((sum, score) => sum + score, 0);

  return {
    product,
    score: totalScore,
    factors
  };
};

/**
 * Get personalized recommendations
 */
export const getPersonalizedRecommendations = (
  products: Product[],
  preferences: UserPreferences,
  limit: number = 3
): Product[] => {
  const scored = products
    .map(product => calculateRecommendationScore(product, preferences))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(item => item.product);
};

/**
 * Get recommendation explanation
 */
export const getRecommendationReason = (score: RecommendationScore): string => {
  const { factors } = score;
  const reasons: string[] = [];

  if (factors.interest > 30) {
    reasons.push('Hohes Interesse');
  }
  if (factors.popularity > 15) {
    reasons.push('Sehr beliebt');
  }
  if (factors.recency > 10) {
    reasons.push('Neu eingetroffen');
  }
  if (factors.category === 10) {
    reasons.push('Deine Lieblingskategorie');
  }
  if (factors.personalization > 0) {
    reasons.push('Du hast es bereits angesehen');
  }

  return reasons.length > 0 ? reasons.join(' • ') : 'Empfohlen für dich';
};

