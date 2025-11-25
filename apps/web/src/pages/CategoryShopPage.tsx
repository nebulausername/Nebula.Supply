/**
 * Category Shop Page - Handles SEO-friendly URLs
 * Routes:
 * /shop/[categorySlug]
 * /shop/[categorySlug]/[brandSlug]
 * /shop/[categorySlug]/[brandSlug]/[seriesSlug]
 */

import { useEffect, useMemo } from "react";
import { useParams, Navigate } from "react-router-dom";
import { ShopPage } from "./ShopPage";
import { useShopStore } from "../store/shop";
import { validateShopRoute } from "../utils/routeValidation";
import { categories } from "@nebula/shared";

export const CategoryShopPage = () => {
  const { categorySlug, brandSlug, seriesSlug } = useParams<{
    categorySlug?: string;
    brandSlug?: string;
    seriesSlug?: string;
  }>();

  const { setCategory, filterByBrand, filterBySeries, clearFilters } = useShopStore();

  // Validate route parameters
  const validation = useMemo(() => {
    return validateShopRoute({
      categorySlug,
      brandSlug,
      seriesSlug
    });
  }, [categorySlug, brandSlug, seriesSlug]);

  // Find matching category/brand/series from slug
  const categoryMatch = useMemo(() => {
    if (!categorySlug || !validation.valid) return null;

    // Find category by slug
    const category = categories.find(c => c.slug === validation.sanitized.categorySlug);
    if (!category) return null;

    // Find brand if provided
    let brandMatch = null;
    if (brandSlug && validation.valid) {
      for (const subItem of category.subItems || []) {
        if (subItem.brands) {
          brandMatch = subItem.brands.find(b => b.slug === validation.sanitized.brandSlug);
          if (brandMatch) break;
        }
      }
    }

    // Find series if provided
    let seriesMatch = null;
    if (seriesSlug && validation.valid && brandMatch?.series) {
      seriesMatch = brandMatch.series.find(s => s.slug === validation.sanitized.seriesSlug);
    }

    return {
      category,
      brand: brandMatch,
      series: seriesMatch
    };
  }, [categorySlug, brandSlug, seriesSlug, validation]);

  // Apply filters based on URL
  useEffect(() => {
    if (!validation.valid) {
      // Invalid route - redirect to main shop
      return;
    }

    if (categoryMatch?.category) {
      setCategory(categoryMatch.category.id);
      
      if (categoryMatch.brand) {
        filterByBrand(categoryMatch.brand.slug);
      } else {
        filterByBrand(undefined);
      }

      if (categoryMatch.series) {
        filterBySeries(categoryMatch.series.slug);
      } else {
        filterBySeries(undefined);
      }
    } else if (categorySlug && validation.valid) {
      // Category slug provided but not found
      clearFilters();
    }

    // Cleanup on unmount
    return () => {
      // Don't clear on unmount - let ShopPage handle it
    };
  }, [categoryMatch, validation.valid, categorySlug, setCategory, filterByBrand, filterBySeries, clearFilters]);

  // Redirect to main shop if invalid
  if (!validation.valid || (categorySlug && !categoryMatch?.category)) {
    return <Navigate to="/shop" replace />;
  }

  // Render main ShopPage (it will use the filters we set)
  return <ShopPage />;
};

