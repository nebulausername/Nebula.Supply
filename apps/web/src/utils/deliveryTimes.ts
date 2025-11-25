import type { DropVariant, VariantOriginOption } from "@nebula/shared";

/**
 * 🎯 Get dynamic delivery time based on origin options
 * Priority: DE (2-5 days) > EU (3-7 days) > CN (7-15 days)
 */
export function getDynamicDeliveryTime(variant: DropVariant | null | undefined): string {
  if (!variant?.originOptions || variant.originOptions.length === 0) {
    return "1-2 Tage"; // Fallback
  }
  
  const labels = variant.originOptions.map(o => o.label.toLowerCase());
  
  // Priority: DE > EU > CN
  if (labels.some(l => l.includes('de') || l.includes('deutschland') || l.includes('fulfillment de'))) {
    return "2-5 Tage";
  }
  if (labels.some(l => l.includes('eu') || l.includes('europa') || l.includes('fulfillment eu'))) {
    return "3-7 Tage";
  }
  if (labels.some(l => l.includes('cn') || l.includes('china') || l.includes('fulfillment cn'))) {
    return "7-15 Tage";
  }
  
  return "1-2 Tage"; // Fallback
}

/**
 * 🎯 Get primary delivery origin (single option instead of multiple)
 * Priority: DE > EU > CN
 * Returns the label of the primary origin
 */
export function getPrimaryDeliveryOrigin(variant: DropVariant | null | undefined): VariantOriginOption | null {
  if (!variant?.originOptions || variant.originOptions.length === 0) {
    return null;
  }
  
  // Priority: DE > EU > CN
  const deOption = variant.originOptions.find(o => 
    o.label.toLowerCase().includes('de') || 
    o.label.toLowerCase().includes('deutschland') ||
    o.label.toLowerCase().includes('fulfillment de')
  );
  if (deOption) return deOption;
  
  const euOption = variant.originOptions.find(o => 
    o.label.toLowerCase().includes('eu') || 
    o.label.toLowerCase().includes('europa') ||
    o.label.toLowerCase().includes('fulfillment eu')
  );
  if (euOption) return euOption;
  
  const cnOption = variant.originOptions.find(o => 
    o.label.toLowerCase().includes('cn') || 
    o.label.toLowerCase().includes('china') ||
    o.label.toLowerCase().includes('fulfillment cn')
  );
  if (cnOption) return cnOption;
  
  // Return first option as fallback
  return variant.originOptions[0];
}

/**
 * 🎯 Get simplified origin label
 * Converts "Fulfillment DE" → "Deutschland", "Fulfillment EU" → "Europa", etc.
 */
export function getSimplifiedOriginLabel(originOption: VariantOriginOption | null): string {
  if (!originOption) return "";
  
  const label = originOption.label.toLowerCase();
  
  if (label.includes('de') || label.includes('deutschland')) {
    return "Deutschland";
  }
  if (label.includes('eu') || label.includes('europa')) {
    return "Europa";
  }
  if (label.includes('cn') || label.includes('china')) {
    return "China";
  }
  
  return originOption.label;
}
