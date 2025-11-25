/**
 * Product Generator
 * 
 * Generates realistic products based on category structure
 * Creates products for each series automatically
 * Performance: Uses caching to avoid regenerating same products
 */

import type { Product, CategoryBrand, CategorySeries } from "../types";
import { createSlug } from "../utils/slugUtils";

// Cache for generated products to improve performance
const productCache = new Map<string, Product[]>();

interface GenerateProductsOptions {
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  brandId?: string;
  brandName?: string;
  brandSlug?: string;
  seriesId?: string;
  seriesName?: string;
  seriesSlug?: string;
  count?: number;
}

const colorOptions = [
  { id: "col-black", label: "Schwarz", value: "black", swatch: "#111827" },
  { id: "col-white", label: "Weiß", value: "white", swatch: "#FFFFFF" },
  { id: "col-grey", label: "Grau", value: "grey", swatch: "#6B7280" },
  { id: "col-red", label: "Rot", value: "red", swatch: "#EF4444" },
  { id: "col-blue", label: "Blau", value: "blue", swatch: "#3B82F6" },
  { id: "col-green", label: "Grün", value: "green", swatch: "#10B981" },
  { id: "col-yellow", label: "Gelb", value: "yellow", swatch: "#F59E0B" },
  { id: "col-orange", label: "Orange", value: "orange", swatch: "#F97316" }
];

const sizeOptions = [
  { id: "size-40", label: "40", value: "40" },
  { id: "size-41", label: "41", value: "41" },
  { id: "size-42", label: "42", value: "42" },
  { id: "size-43", label: "43", value: "43" },
  { id: "size-44", label: "44", value: "44" },
  { id: "size-45", label: "45", value: "45" }
];

const descriptions = [
  "Premium Qualität mit authentischem Design und hochwertigen Materialien.",
  "Limitierte Edition mit exklusiven Details und besonderem Comfort.",
  "Iconic Design mit zeitloser Ästhetik und moderner Technologie.",
  "Streetwear-Essential mit Premium-Finish und unverwechselbarem Style.",
  "Collector's Item mit besonderen Features und exklusiver Ausstattung."
];

/**
 * Generates products for a series
 */
export function generateProductsForSeries(options: GenerateProductsOptions): Product[] {
  const {
    categoryId,
    categorySlug,
    categoryName,
    brandId,
    brandName = "",
    brandSlug,
    seriesId,
    seriesName = "",
    seriesSlug,
    count = 6
  } = options;

  const products: Product[] = [];
  const basePrice = categoryId === "cat-shoes" ? 120 : categoryId === "cat-jackets" ? 250 : 80;
  
  // Select colors for this series (2-4 colors)
  const seriesColors = colorOptions.slice(0, Math.floor(Math.random() * 3) + 2);
  
  for (let i = 0; i < count; i++) {
    const color = seriesColors[i % seriesColors.length];
    const colorName = color.label;
    
    // Build product name
    const productNameParts: string[] = [];
    if (brandName) productNameParts.push(brandName);
    if (seriesName) productNameParts.push(seriesName);
    productNameParts.push(colorName);
    
    const productName = productNameParts.join(" ");
    const productSlug = createSlug(productName);
    
    // Generate SKU
    const skuParts: string[] = [];
    if (brandSlug) skuParts.push(brandSlug.toUpperCase().substring(0, 3));
    if (seriesSlug) skuParts.push(seriesSlug.toUpperCase().replace(/-/g, "").substring(0, 5));
    skuParts.push(color.value.toUpperCase());
    skuParts.push(String(i + 1).padStart(2, "0"));
    const sku = skuParts.join("-");
    
    // Price variation
    const priceVariation = Math.floor(Math.random() * 40) - 20; // ±20 EUR
    const price = Math.max(50, basePrice + priceVariation);
    
    // Description
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];
    const fullDescription = `${productName}. ${description}`;
    
    // Generate media
    const media = seriesColors.map((c, idx) => ({
      id: `img-${productSlug}-${c.value}-${idx}`,
      url: `https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop&crop=center&sat=${idx * 20}`,
      color: c.value,
      alt: `${productName} - ${c.label}`
    }));
    
    const product: Product = {
      id: `prod-${productSlug}-${i + 1}`,
      name: productName,
      categoryId,
      sku,
      description: fullDescription,
      price,
      currency: "EUR",
      leadTime: Math.random() > 0.7 ? "same_day" : Math.random() > 0.5 ? "2_days" : "1_week",
      inventory: Math.floor(Math.random() * 50) + 10,
      interest: Math.floor(Math.random() * 200) + 50,
      variants: [
        {
          type: "color",
          name: "Farbe",
          options: seriesColors.map(c => ({
            id: c.id,
            label: c.label,
            value: c.value,
            swatch: c.swatch
          }))
        },
        {
          type: "size",
          name: "Größe",
          options: sizeOptions
        }
      ],
      media,
      badges: i === 0 ? ["Neu"] : i === 1 ? ["Beliebt"] : [],
      popularity: Math.max(0.3, Math.min(1.0, 0.7 + Math.random() * 0.3)),
      isNew: i === 0,
      shippingOptions: [
        {
          id: "ship-de",
          region: "DE",
          label: "Deutschland",
          leadTime: "2-4 Tage",
          priceAdjustment: 10,
          price: 9.9,
          currency: "EUR"
        },
        {
          id: "ship-eu",
          region: "EU",
          label: "Europa",
          leadTime: "3-7 Tage",
          priceAdjustment: 5,
          price: 11.9,
          currency: "EUR"
        },
        {
          id: "ship-cn",
          region: "CN",
          label: "China",
          leadTime: "8-15 Tage",
          priceAdjustment: -10,
          price: 12.5,
          currency: "EUR"
        }
      ],
      defaultShippingOptionId: "ship-de",
      deliveryEstimates: {
        DE: "2-3 Tage",
        EU: "3-6 Tage"
      },
      tags: brandSlug ? [brandSlug, seriesSlug || ""].filter(Boolean) : []
    };
    
    // Add brand/series metadata
    if (brandId) {
      product.brandId = brandId;
      product.brandSlug = brandSlug;
    }
    if (seriesId) {
      product.seriesId = seriesId;
      product.seriesSlug = seriesSlug;
    }
    
    products.push(product);
  }
  
  return products;
}

/**
 * Generates products for all series in a brand
 * Performance: Uses caching to avoid regenerating same products
 */
export function generateProductsForBrand(
  categoryId: string,
  categorySlug: string,
  categoryName: string,
  brand: CategoryBrand
): Product[] {
  // Cache key for this brand
  const cacheKey = `${categoryId}-${brand.id}`;
  
  // Return cached products if available
  if (productCache.has(cacheKey)) {
    return productCache.get(cacheKey)!;
  }
  
  if (!brand.series || brand.series.length === 0) {
    // If no series, generate products directly for brand
    const products = generateProductsForSeries({
      categoryId,
      categorySlug,
      categoryName,
      brandId: brand.id,
      brandName: brand.name,
      brandSlug: brand.slug,
      count: 8
    });
    productCache.set(cacheKey, products);
    return products;
  }
  
  // Generate products for each series (limit to first 3 series for performance)
  const allProducts: Product[] = [];
  const seriesToProcess = brand.series.slice(0, 3);
  
  for (const series of seriesToProcess) {
    const seriesProducts = generateProductsForSeries({
      categoryId,
      categorySlug,
      categoryName,
      brandId: brand.id,
      brandName: brand.name,
      brandSlug: brand.slug,
      seriesId: series.id,
      seriesName: series.name,
      seriesSlug: series.slug,
      count: 6
    });
    
    allProducts.push(...seriesProducts);
  }
  
  // Cache result
  productCache.set(cacheKey, allProducts);
  return allProducts;
}

