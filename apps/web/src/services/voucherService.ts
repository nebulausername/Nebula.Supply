// Enhanced Crypto Voucher Service with multiple providers and validation

export interface VoucherProvider {
  id: string;
  name: string;
  logo: string;
  supportedCurrencies: string[];
  minAmount: number;
  maxAmount: number;
  fees: number;
  processingTime: string;
  privacyLevel: 'high' | 'medium' | 'low';
  supportedCountries: string[];
  apiEndpoint?: string;
  validationRegex?: RegExp;
}

export interface VoucherValidationResult {
  isValid: boolean;
  amount?: number;
  currency?: string;
  provider?: string;
  error?: string;
  estimatedValue?: number;
}

export class VoucherService {
  private providers: VoucherProvider[] = [
    {
      id: 'dundle',
      name: 'Dundle',
      logo: 'https://via.placeholder.com/40x40?text=D',
      supportedCurrencies: ['EUR', 'USD', 'GBP'],
      minAmount: 10,
      maxAmount: 500,
      fees: 0,
      processingTime: 'Sofort',
      privacyLevel: 'medium',
      supportedCountries: ['DE', 'AT', 'CH', 'NL', 'BE', 'FR', 'IT', 'ES'],
      apiEndpoint: 'https://api.dundle.com/validate',
      validationRegex: /^[A-Z0-9]{10,20}$/i
    },
    {
      id: 'bitnovo',
      name: 'Bitnovo',
      logo: 'https://via.placeholder.com/40x40?text=B',
      supportedCurrencies: ['EUR', 'USD'],
      minAmount: 25,
      maxAmount: 1000,
      fees: 2.5,
      processingTime: 'Sofort',
      privacyLevel: 'high',
      supportedCountries: ['ES', 'PT', 'FR', 'IT', 'DE', 'NL'],
      apiEndpoint: 'https://api.bitnovo.com/validate',
      validationRegex: /^[A-Z0-9]{16}$/i
    },
    {
      id: 'coinsbee',
      name: 'Coinsbee',
      logo: 'https://via.placeholder.com/40x40?text=C',
      supportedCurrencies: ['EUR', 'USD', 'BTC'],
      minAmount: 5,
      maxAmount: 2000,
      fees: 1.5,
      processingTime: 'Sofort',
      privacyLevel: 'high',
      supportedCountries: ['DE', 'AT', 'CH', 'US', 'CA', 'AU'],
      apiEndpoint: 'https://api.coinsbee.com/validate',
      validationRegex: /^[A-Z0-9]{12,24}$/i
    },
    {
      id: 'recharge',
      name: 'Recharge.com',
      logo: 'https://via.placeholder.com/40x40?text=R',
      supportedCurrencies: ['EUR', 'USD', 'GBP', 'CAD'],
      minAmount: 10,
      maxAmount: 500,
      fees: 3,
      processingTime: 'Sofort',
      privacyLevel: 'medium',
      supportedCountries: ['NL', 'DE', 'BE', 'FR', 'ES', 'IT', 'PT'],
      apiEndpoint: 'https://api.recharge.com/validate',
      validationRegex: /^[A-Z0-9]{10,16}$/i
    },
    {
      id: 'offgamers',
      name: 'OffGamers',
      logo: 'https://via.placeholder.com/40x40?text=O',
      supportedCurrencies: ['USD', 'EUR', 'GBP'],
      minAmount: 10,
      maxAmount: 1000,
      fees: 2,
      processingTime: 'Sofort',
      privacyLevel: 'medium',
      supportedCountries: ['US', 'CA', 'GB', 'DE', 'FR', 'AU'],
      apiEndpoint: 'https://api.offgamers.com/validate',
      validationRegex: /^[A-Z0-9]{12,20}$/i
    }
  ];

  // Get all available providers
  getProviders(): VoucherProvider[] {
    return this.providers;
  }

  // Get providers for specific amount and country
  getProvidersForAmount(amount: number, country: string = 'DE'): VoucherProvider[] {
    return this.providers.filter(provider =>
      amount >= provider.minAmount &&
      amount <= provider.maxAmount &&
      provider.supportedCountries.includes(country)
    );
  }

  // Validate voucher code
  async validateVoucherCode(code: string): Promise<VoucherValidationResult> {
    // Basic format validation
    if (!code || code.length < 8) {
      return {
        isValid: false,
        error: 'Ungültiges Format'
      };
    }

    // Find matching provider
    const provider = this.providers.find(p => p.validationRegex?.test(code));

    if (!provider) {
      return {
        isValid: false,
        error: 'Unbekannter Voucher-Anbieter'
      };
    }

    try {
      // In production, call the provider's API
      // For demo, simulate API call
      const isValid = await this.simulateValidation(code, provider);

      if (isValid) {
        // Estimate voucher value (in production, get from API)
        const estimatedValue = this.estimateVoucherValue(code, provider);

        return {
          isValid: true,
          amount: estimatedValue,
          currency: 'EUR',
          provider: provider.id,
          estimatedValue
        };
      } else {
        return {
          isValid: false,
          error: 'Voucher ungültig oder bereits eingelöst'
        };
      }
    } catch (error) {
      console.error('Voucher validation error:', error);
      return {
        isValid: false,
        error: 'Validierung fehlgeschlagen'
      };
    }
  }

  // Get provider recommendations based on amount and preferences
  getRecommendedProviders(amount: number, country: string = 'DE', preferences: {
    maxFee?: number;
    privacyLevel?: 'high' | 'medium' | 'low';
  } = {}): VoucherProvider[] {
    let providers = this.getProvidersForAmount(amount, country);

    // Filter by preferences
    if (preferences.maxFee !== undefined) {
      providers = providers.filter(p => p.fees <= preferences.maxFee!);
    }

    if (preferences.privacyLevel) {
      providers = providers.filter(p => p.privacyLevel === preferences.privacyLevel);
    }

    // Sort by privacy level (high first) then by fees (low first)
    return providers.sort((a, b) => {
      if (a.privacyLevel !== b.privacyLevel) {
        const privacyOrder = { high: 3, medium: 2, low: 1 };
        return privacyOrder[b.privacyLevel] - privacyOrder[a.privacyLevel];
      }
      return a.fees - b.fees;
    });
  }

  // Calculate fees for provider
  calculateFees(amount: number, provider: VoucherProvider): {
    voucherFee: number;
    ourFee: number;
    totalCost: number;
  } {
    const voucherFee = (amount * provider.fees) / 100;
    const ourFee = 0; // No additional fees from us

    return {
      voucherFee,
      ourFee,
      totalCost: amount + voucherFee + ourFee
    };
  }

  // Private helper methods
  private async simulateValidation(code: string, provider: VoucherProvider): Promise<boolean> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For demo, accept codes that match the regex and are longer than 10 chars
    return code.length >= 12 && Math.random() > 0.1; // 90% success rate
  }

  private estimateVoucherValue(code: string, provider: VoucherProvider): number {
    // In production, this would come from the API response
    // For demo, estimate based on code length and provider
    const baseAmount = provider.minAmount + (Math.random() * (provider.maxAmount - provider.minAmount));

    // Add some randomness based on code characteristics
    const lengthMultiplier = Math.min(1.5, code.length / 10);
    const estimatedValue = baseAmount * lengthMultiplier;

    return Math.min(estimatedValue, provider.maxAmount);
  }

  // Get exchange rates for crypto vouchers
  async getExchangeRates(): Promise<Record<string, number>> {
    try {
      // In production, query real exchange rate APIs
      return {
        BTC: 42000,
        ETH: 2500,
        LTC: 80,
        XMR: 150,
        DASH: 45
      };
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      return {};
    }
  }
}

// Factory function
export const createVoucherService = () => {
  return new VoucherService();
};

// Utility functions
export const formatVoucherCode = (code: string): string => {
  // Format code for better readability
  return code.replace(/(.{4})/g, '$1 ').trim();
};

export const validateVoucherFormat = (code: string): boolean => {
  // Basic format validation
  return /^[A-Z0-9]{8,24}$/i.test(code);
};

export const estimateVoucherProcessingTime = (provider: VoucherProvider): string => {
  return provider.processingTime;
};




