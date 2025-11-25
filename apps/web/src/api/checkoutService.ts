import { CheckoutData } from "../components/checkout/CheckoutFlow";
import { CartItem } from "../store/globalCart";

export interface CheckoutRequest {
  items: CartItem[];
  checkoutData: CheckoutData;
  totalAmount: number;
  currency: string;
}

export interface CheckoutResponse {
  success: boolean;
  orderId: string;
  paymentSessionId?: string;
  estimatedDelivery: string;
  trackingNumber?: string;
  error?: string;
}

export interface PaymentSession {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  paymentUrl?: string;
  qrCode?: string;
  instructions: string[];
  expiresAt: string;
}

export interface OrderStatus {
  orderId: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  trackingNumber?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  updates: OrderUpdate[];
}

export interface OrderUpdate {
  timestamp: string;
  status: string;
  message: string;
  location?: string;
}

// Mock implementation - in a real app, this would call your backend API
export const checkoutService = {
  async submitOrder(request: CheckoutRequest): Promise<CheckoutResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock order ID
    const orderId = `NEB-${Date.now().toString(36).toUpperCase()}`;
    
    // Calculate estimated delivery (3-5 business days)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + Math.floor(Math.random() * 3) + 3);
    
    // Simulate occasional failures
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error("Zahlungsverarbeitung fehlgeschlagen. Bitte versuche es erneut.");
    }
    
    return {
      success: true,
      orderId,
      estimatedDelivery: deliveryDate.toISOString(),
      trackingNumber: `TRK${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    };
  },

  async createPaymentSession(
    orderId: string, 
    paymentMethod: string, 
    amount: number
  ): Promise<PaymentSession> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const sessionId = `ps_${Math.random().toString(36).substr(2, 12)}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    const instructions = this.getPaymentInstructions(paymentMethod, amount);
    
    return {
      id: sessionId,
      status: "pending",
      instructions,
      expiresAt: expiresAt.toISOString(),
      paymentUrl: paymentMethod === "nebula_pay" ? `https://pay.nebula.com/${sessionId}` : undefined,
      qrCode: paymentMethod.includes("btc") || paymentMethod.includes("eth") ? 
        `data:image/svg+xml;base64,${btoa(`<svg>Mock QR Code for ${paymentMethod}</svg>`)}` : undefined,
    };
  },

  async getOrderStatus(orderId: string): Promise<OrderStatus> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const statuses = ["pending", "confirmed", "processing", "shipped", "delivered"];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)] as OrderStatus["status"];
    
    const updates: OrderUpdate[] = [
      {
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: "pending",
        message: "Bestellung aufgegeben",
      },
      {
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: "confirmed",
        message: "Zahlung bestätigt",
      },
    ];
    
    if (randomStatus === "processing" || randomStatus === "shipped" || randomStatus === "delivered") {
      updates.push({
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        status: "processing",
        message: "Bestellung wird vorbereitet",
        location: "Nebula Warehouse, Berlin",
      });
    }
    
    if (randomStatus === "shipped" || randomStatus === "delivered") {
      updates.push({
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        status: "shipped",
        message: "Bestellung versendet",
        location: "DHL Hub, Berlin",
      });
    }
    
    if (randomStatus === "delivered") {
      updates.push({
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: "delivered",
        message: "Bestellung zugestellt",
        location: "Zuhause",
      });
    }
    
    return {
      orderId,
      status: randomStatus,
      trackingNumber: `TRK${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      updates: updates.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    };
  },

  async cancelOrder(orderId: string): Promise<{ success: boolean; message: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate occasional failures
    if (Math.random() < 0.1) { // 10% failure rate
      throw new Error("Bestellung konnte nicht storniert werden. Bitte kontaktiere den Support.");
    }
    
    return {
      success: true,
      message: "Bestellung wurde erfolgreich storniert. Die Rückerstattung wird in 3-5 Werktagen bearbeitet.",
    };
  },

  getPaymentInstructions(paymentMethod: string, amount: number): string[] {
    switch (paymentMethod) {
      case "nebula_pay":
        return [
          "Öffne den Nebula Pay Terminal Screen",
          "Bestätige die Zahlung mit FaceID",
          "Die Zahlung wird in unter 30 Sekunden abgeschlossen",
        ];
      
      case "btc_chain":
        return [
          `Sende ${(amount / 34000).toFixed(8)} BTC an die angegebene Adresse`,
          "Adresse wurde durch Bitomatics Whirlpool gemixt",
          "Wir monitoren den Mempool in Echtzeit",
          "Bestätigung nach 1 Block (10-30 Minuten)",
        ];
      
      case "eth_chain":
        return [
          `Sende ${(amount / 1800).toFixed(6)} ETH an die angegebene Adresse`,
          "Stealth Vault rotiert die Adresse nach Abschluss",
          "Wir schließen nach 2 Bestätigungen ab",
        ];
      
      case "crypto_voucher":
        return [
          "Besuche dundle.com oder bitnovo.com",
          "Kaufe einen Krypto-Voucher (50-500€)",
          "Löse den Code im Checkout ein",
          "Nach Prüfung wird deine Bestellung freigegeben",
        ];
      
      case "sepa_transfer":
        return [
          "Empfänger: Nebula Supply GmbH",
          "Bank: Solarisbank AG",
          "IBAN: DE58 5001 0517 5407 3240 42",
          "BIC: SOBKDEBBXXX",
          `Verwendungszweck: NEB-${Date.now().toString(36).toUpperCase()}`,
        ];
      
      case "cash_meetup":
        return [
          "Nimm ein Selfie mit dem angegebenen Emoji auf",
          "Upload im Profil > Cash Requests",
          "Unser Staff schlägt dir Ort & Zeit vor",
          "Nach Übergabe wird die Bestellung als bezahlt markiert",
        ];
      
      default:
        return ["Zahlungsinstruktionen folgen."];
    }
  },

  async validateAddress(address: CheckoutData["shippingAddress"]): Promise<{ valid: boolean; suggestions?: string[] }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock validation - in a real app, this would use a geocoding service
    const isValid = !!(
      address.firstName &&
      address.lastName &&
      address.address1 &&
      address.city &&
      address.postalCode
    );
    
    return {
      valid: isValid,
      suggestions: isValid ? undefined : [
        "Bitte überprüfe deine Adressdaten",
        "Stelle sicher, dass alle Pflichtfelder ausgefüllt sind",
      ],
    };
  },

  async getShippingOptions(
    address: CheckoutData["shippingAddress"],
    items: CartItem[]
  ): Promise<Array<{
    id: string;
    name: string;
    price: number;
    estimatedDays: number;
    description: string;
  }>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const baseOptions = [
      {
        id: "standard",
        name: "Standard Versand",
        price: 4.99,
        estimatedDays: 3,
        description: "Standard Lieferung innerhalb Deutschlands",
      },
      {
        id: "express",
        name: "Express Versand",
        price: 9.99,
        estimatedDays: 1,
        description: "Schnelle Lieferung am nächsten Werktag",
      },
    ];
    
    // Free shipping for orders over 25€
    const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (totalValue >= 25) {
      baseOptions[0].price = 0;
      baseOptions[0].description = "Kostenloser Versand (ab 25€)";
    }
    
    return baseOptions;
  },
};

