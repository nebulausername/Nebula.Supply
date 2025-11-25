import type { Drop, DropVariant } from '@nebula/shared';
import type { InviteStatus } from '../store/shop';
import { addDropItemToCart, useGlobalCartStore } from '../store/globalCart';
import { hasDropAccess } from './inviteAccess';
import { showToast } from '../store/toast';

export interface CheckoutLine {
  variant: DropVariant;
  quantity: number;
}

export interface CheckoutDropParams {
  drop: Drop;
  lines: CheckoutLine[];
  invite?: InviteStatus | null;
  openCart?: boolean;
  // If true, do not block adding when invite is missing; enforcement can happen later at checkout
  skipAccessCheck?: boolean;
}

export interface CheckoutDropResult {
  ok: boolean;
  itemsAdded: Array<{ variantLabel: string; quantity: number; price: number }>;
  totalPrice: number;
  failedCount: number;
}

/**
 * 🎯 Unified Drop Checkout Function
 * 
 * Adds one or more drop variants to the global cart with proper validation:
 * - Access control (invite requirements)
 * - Quantity clamping (min/max/stock)
 * - Multi-variant support
 * - Unified error handling
 * - Auto cart open (optional)
 * 
 * @param params - Checkout parameters
 * @returns Result with added items and total price
 */
export async function checkoutDrop({
  drop,
  lines,
  invite = null,
  openCart = true,
  skipAccessCheck = false
}: CheckoutDropParams): Promise<CheckoutDropResult> {
  const itemsAdded: Array<{ variantLabel: string; quantity: number; price: number }> = [];
  let totalPrice = 0;
  let failedCount = 0;

  console.log('🛒 checkoutDrop called:', {
    dropName: drop.name,
    lineCount: lines.length,
    hasInvite: !!invite
  });

  // Process each line item
  for (const line of lines) {
    const { variant, quantity: requestedQty } = line;

    console.log(`🔄 Processing line: ${variant.label} x${requestedQty}`);

    // 🔒 Access control
    const inviteRequired = variant.inviteRequired ?? drop.inviteRequired;
    const canAccess = hasDropAccess(invite as any, !!inviteRequired);

    console.log(`🔒 Access check: inviteRequired=${inviteRequired}, hasInvite=${invite?.hasInvite}, canAccess=${canAccess}, skipAccessCheck=${skipAccessCheck}`);

    if (!canAccess && !skipAccessCheck) {
      console.warn(`❌ Access denied for variant: ${variant.label}`);
      failedCount++;
      continue;
    }

    // 📊 Quantity validation and clamping
    const minQty = variant.minQuantity ?? 1;
    const maxQty = Math.min(variant.maxQuantity ?? 10, variant.stock);
    const clampedQty = Math.max(minQty, Math.min(requestedQty, maxQty));

    console.log(`📊 Quantity: requested=${requestedQty}, min=${minQty}, max=${maxQty}, clamped=${clampedQty}`);

    if (clampedQty !== requestedQty) {
      console.warn(`⚠️ Quantity clamped for ${variant.label}: ${requestedQty} → ${clampedQty}`);
    }

    // Stock check
    if (variant.stock <= 0) {
      console.warn(`❌ Out of stock: ${variant.label}`);
      failedCount++;
      continue;
    }

    // 🛒 Add to cart
    try {
      console.log(`🛒 Adding to cart: ${clampedQty}x ${variant.label}`);
      const success = addDropItemToCart(drop, variant, clampedQty);
      
      if (success) {
        console.log(`✅ Added to cart: ${clampedQty}x ${variant.label} @ ${variant.basePrice}`);
        itemsAdded.push({
          variantLabel: variant.label,
          quantity: clampedQty,
          price: variant.basePrice
        });
        totalPrice += variant.basePrice * clampedQty;
      } else {
        console.warn(`❌ Failed to add: ${variant.label}`);
        failedCount++;
      }
    } catch (error) {
      console.error(`❌ Error adding ${variant.label}:`, error);
      failedCount++;
    }
  }

  // 📊 Result summary
  const ok = itemsAdded.length > 0;

  console.log('🎯 checkoutDrop result:', {
    ok,
    itemsAdded: itemsAdded.length,
    totalPrice,
    failedCount
  });

  // 🎨 User feedback
  if (!ok) {
    if (failedCount > 0) {
      showToast.error(
        'Fehler beim Checkout',
        'Artikel konnten nicht zum Warenkorb hinzugefügt werden'
      );
    }
  } else if (failedCount > 0) {
    showToast.warning(
      'Teilweise hinzugefügt',
      `${itemsAdded.length} von ${lines.length} Artikeln wurden hinzugefügt`
    );
  }

  // 🛒 Auto-open cart
  if (ok && openCart) {
    setTimeout(() => {
      useGlobalCartStore.getState().openCart();
    }, 300);
  }

  return {
    ok,
    itemsAdded,
    totalPrice,
    failedCount
  };
}

/**
 * 🎯 Single-variant checkout helper
 * Convenience wrapper for single variant checkouts
 */
export async function checkoutSingleVariant({
  drop,
  variant,
  quantity,
  invite,
  openCart = true
}: {
  drop: Drop;
  variant: DropVariant | null | undefined;
  quantity: number;
  invite?: InviteStatus | null;
  openCart?: boolean;
}): Promise<CheckoutDropResult> {
  console.log('🎯 checkoutSingleVariant called:', { 
    dropName: drop?.name, 
    variantLabel: variant?.label, 
    quantity, 
    hasInvite: !!invite?.hasInvite 
  });

  if (!variant) {
    console.log('❌ No variant provided');
    showToast.error('Fehler', 'Bitte wähle eine Variante aus');
    return { ok: false, itemsAdded: [], totalPrice: 0, failedCount: 1 };
  }

  const result = await checkoutDrop({
    drop,
    lines: [{ variant, quantity }],
    invite,
    openCart
  });

  console.log('🎯 checkoutSingleVariant result:', result);
  return result;
}


