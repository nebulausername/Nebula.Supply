export type ProductModalPackPreset = {
  id: string;
  label: string;
  quantity: number;
  description?: string;
  highlight?: 'accent' | 'warning' | 'muted';
};

export interface ProductModalConfig {
  hero: {
    showStatus: boolean;
    showCountdown: boolean;
    showBadges: boolean;
    showSku: boolean;
    showProgress: boolean;
    showSocialProof: boolean;
    showVariantSummary: boolean;
  };
  media: {
    enableColorSync: boolean;
    showThumbnails: boolean;
    thumbVariantSync: 'match' | 'all';
  };
  variants: {
    groupVisualFirst: boolean;
    showCounts: boolean;
    highlightActive: boolean;
    allowConfigDescriptions: boolean;
  };
  quantity: {
    defaultMinimum: number;
    enableQuickOptions: boolean;
    enablePacks: boolean;
    presets: ProductModalPackPreset[];
  };
  pricing: {
    emphasizeTierSavings: boolean;
    showPerUnit: boolean;
    showTotals: boolean;
    showLeadTime: boolean;
  };
  activity: {
    showTicker: boolean;
    defaultFilter: 'all' | 'order' | 'comment' | 'system';
    enableHighlights: boolean;
  };
  actions: {
    showInterest: boolean;
    showShare: boolean;
    stickySummary: boolean;
  };
}

export const DEFAULT_PRODUCT_MODAL_CONFIG: ProductModalConfig = {
  hero: {
    showStatus: true,
    showCountdown: true,
    showBadges: true,
    showSku: true,
    showProgress: true,
    showSocialProof: true,
    showVariantSummary: true
  },
  media: {
    enableColorSync: true,
    showThumbnails: true,
    thumbVariantSync: 'match'
  },
  variants: {
    groupVisualFirst: true,
    showCounts: true,
    highlightActive: true,
    allowConfigDescriptions: true
  },
  quantity: {
    defaultMinimum: 1,
    enableQuickOptions: true,
    enablePacks: false,
    presets: []
  },
  pricing: {
    emphasizeTierSavings: true,
    showPerUnit: true,
    showTotals: true,
    showLeadTime: true
  },
  activity: {
    showTicker: true,
    defaultFilter: 'all',
    enableHighlights: true
  },
  actions: {
    showInterest: true,
    showShare: true,
    stickySummary: false
  }
};
