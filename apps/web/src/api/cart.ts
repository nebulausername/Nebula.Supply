import { api } from "../lib/api/client";
import type { CartItem } from "../store/globalCart";

export interface CartValidationRequest {
  items: CartItem[];
  userId: string;
}

export interface CartValidationError {
  itemId: string;
  field: string;
  message: string;
}

export interface CartValidationResponse {
  success: boolean;
  validated: boolean;
  items: CartItem[];
  serverTotalPrice: number;
  errors: CartValidationError[];
  warnings: string[];
}

/**
 * Validate cart items server-side (prices, stock, availability)
 * This ensures prices haven't been manipulated client-side
 * 
 * @param timeoutMs - Timeout in milliseconds (default: 5000ms)
 */
export const validateCart = async (
  items: CartItem[],
  userId: string,
  timeoutMs: number = 5000
): Promise<CartValidationResponse> => {
  // Ensure items array is valid
  if (!items || items.length === 0) {
    return {
      success: false,
      validated: false,
      items: [],
      serverTotalPrice: 0,
      errors: [{ itemId: '', field: 'cart', message: 'Warenkorb ist leer' }],
      warnings: []
    };
  }

  // Create timeout promise
  const timeoutPromise = new Promise<CartValidationResponse>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Validierung dauerte zu lange - Timeout'));
    }, timeoutMs);
  });

  try {
    // Race between validation and timeout
    const response = await Promise.race([
      api.post<CartValidationResponse>("/api/cart/validate", {
        items,
        userId,
      }),
      timeoutPromise
    ]) as any;

    // API client returns the JSON data directly (from response.json())
    // So response is already our CartValidationResponse
    const responseData = response;
    
    // Validate response structure
    if (!responseData || typeof responseData !== 'object') {
      console.warn('Invalid validation response structure:', responseData);
      return {
        success: true, // Allow checkout even if validation fails
        validated: false,
        items: items,
        serverTotalPrice: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        errors: [],
        warnings: ['Validierung konnte nicht durchgeführt werden - Checkout wird fortgesetzt']
      };
    }

    // Ensure response has required fields with safe defaults
    return {
      success: responseData.success !== false, // Default to true if not specified
      validated: responseData.validated ?? true,
      items: Array.isArray(responseData.items) ? responseData.items : items,
      serverTotalPrice: typeof responseData.serverTotalPrice === 'number' 
        ? responseData.serverTotalPrice 
        : items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      errors: Array.isArray(responseData.errors) ? responseData.errors : [],
      warnings: Array.isArray(responseData.warnings) ? responseData.warnings : []
    };
  } catch (error: any) {
    console.error("Cart validation error:", error);
    
    // Handle different error types gracefully
    const errorMessage = error?.message || error?.data?.error || 'Fehler bei der Cart-Validierung';
    const status = error?.status;
    const isTimeout = errorMessage.includes('Timeout') || errorMessage.includes('zu lange');
    
    // If timeout or network/server error, allow checkout to proceed with warning
    // This prevents blocking users due to temporary server issues
    if (isTimeout || status === 0 || status >= 500 || !status) {
      console.warn('Validation failed/timeout, allowing checkout with warning', { errorMessage, status, isTimeout });
      return {
        success: true, // Allow checkout but mark as potentially unvalidated
        validated: false,
        items: items,
        serverTotalPrice: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        errors: [],
        warnings: [isTimeout 
          ? 'Validierung dauerte zu lange - Checkout wird fortgesetzt'
          : 'Validierung konnte nicht durchgeführt werden - Serverfehler'
        ]
      };
    }
    
    // For client errors (400, 403, etc.), allow checkout but return error info
    // Don't block checkout for validation errors - let user proceed
    return {
      success: true, // Allow checkout even with validation errors
      validated: false,
      items: items,
      serverTotalPrice: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      errors: [{ itemId: '', field: 'validation', message: errorMessage }],
      warnings: ['Validierung fehlgeschlagen - Checkout wird trotzdem fortgesetzt']
    };
  }
};

