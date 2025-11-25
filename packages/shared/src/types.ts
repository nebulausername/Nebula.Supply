export type LocaleCode = "DE" | "EN" | "CN" | "FR";

export type CurrencyCode = "EUR" | "USD" | "GBP" | "CHF" | "CNY";

export interface MoneyValue {
  /** amount in the minor currency unit (e.g. cents) */
  amountCents: number;
  currency: CurrencyCode;
  /** optional formatted label for quick rendering */
  formatted?: string;
}

export type SelectionMap<K extends string> = Partial<Record<K, string>>;

export type CategoryType =
  | "shoes"
  | "clothing"
  | "shorts"
  | "pants"
  | "tshirt"
  | "caps"
  | "watch"
  | "hoodies"
  | "jackets"
  | "accessories"
  | "taschen"
  | "tech"
  | "bundle";

// 3-Level Category Hierarchy
export interface CategorySeries {
  id: string;
  name: string;
  slug: string; // SEO-friendly slug
  description?: string;
}

export interface CategoryBrand {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  series?: CategorySeries[]; // 3. Level
}

export interface CategorySubItem {
  id: string;
  name: string;
  slug?: string; // SEO-friendly slug
  icon?: string;
  brands?: CategoryBrand[]; // Neue Struktur mit Brands (3-Level)
  items?: string[]; // Legacy für einfache Listen (2-Level)
}

export interface Category {
  id: string;
  slug: CategoryType;
  name: string;
  description: string;
  icon: string;
  order: number;
  featured?: boolean;
  // NEU: Sub-Items für Dropdown-Mega-Menüs
  subItems?: CategorySubItem[];
}

export type LeadTime = "same_day" | "2_days" | "1_week" | "preorder";

export type VariantType = "color" | "size";

export interface VariantOption {
  id: string;
  label: string;
  value: string;
  swatch?: string;
}

export interface ProductVariant {
  type: VariantType;
  name: string;
  options: VariantOption[];
}

export interface VariantCombination {
  id: string;
  options: Record<string, string>;
  sku: string;
  price: number;
  inventory: number;
  isActive: boolean;
  images?: ProductMedia[];
  barcode?: string;
}

export interface ProductMedia {
  id: string;
  url: string;
  color?: string;
  alt: string;
}

export interface PricingTier {
  minQuantity: number;
  price: number;
  priceMoney?: MoneyValue;
}

export type ShippingRegion = "DE" | "EU" | "CN";

export interface ShippingOption {
  id: string;
  region?: ShippingRegion;
  label: string;
  leadTime: string;
  price: number;
  currency: string;
  priceAdjustment?: number;
  costMoney?: MoneyValue;
  badge?: string;
  description?: string;
  tracking?: boolean;
  regions?: ShippingRegion[];
  // Landweg-Versand Konfiguration
  landShipping?: boolean;
  landShippingDeliveryRange?: string; // Format: "19. Dez.-15. Jan."
  landShippingMessage?: string; // Custom Nachricht für Landweg-Versand
  showLandShippingBadge?: boolean; // Badge anzeigen
}

export interface ProductRating {
  average: number;
  count: number;
  breakdown?: Record<number, number>;
  featuredReviewId?: string;
}

export interface ProductReviewPreview {
  id: string;
  author: string;
  rating: number;
  headline: string;
  body: string;
  createdAt: string;
  locale?: LocaleCode;
  verified: boolean;
}

export interface ProductSocialProof {
  interestDelta24h?: number;
  purchases24h?: number;
  viewersLive?: number;
  badges?: string[];
  lastPurchaseAgo?: string;
}

export interface ReferralMission {
  id: string;
  required: number;
  rewardLabel: string;
  rewardValue?: number;
  bonusProductId?: string;
  description?: string;
}

export interface ReferralCampaign {
  id: string;
  title: string;
  description?: string;
  missions: ReferralMission[];
  expiresAt?: string;
  termsUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  sku: string;
  description: string;
  price: number;
  priceMoney?: MoneyValue;
  pricingTiers?: PricingTier[];
  currency: CurrencyCode;
  leadTime: LeadTime;
  inventory: number;
  interest: number;
  variants?: ProductVariant[];
  media: ProductMedia[];
  badges?: string[];
  popularity?: number;
  isNew?: boolean;
  shippingOptions: ShippingOption[];
  defaultShippingOptionId?: string;
  deliveryEstimates?: Partial<Record<ShippingRegion, string>>;
  rating?: ProductRating;
  reviewsPreview?: ProductReviewPreview[];
  socialProof?: ProductSocialProof;
  referralCampaign?: ReferralCampaign;
  limitedUntil?: string;
  onRequest?: boolean;
  maxPerUser?: number;
  tags?: string[];
  // New fields for 3-level filtering
  brandId?: string;
  brandSlug?: string;
  seriesId?: string;
  seriesSlug?: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  selectedOptions?: SelectionMap<VariantType>;
  shippingOptionId?: string;
}

export interface CoinRewardTier {
  id: string;
  coins: number;
  reward: string;
  discountValue: number;
  minSpend: number;
}

export type InviteChannel = "direct" | "telegram" | "whatsapp" | "email" | "qr";

export type InviteActivityStatus = "pending" | "activated" | "rewarded";

export interface InviteActivity {
  id: string;
  inviteeHandle?: string;
  inviteeAvatarUrl?: string;
  inviteeEmail?: string;
  channel: InviteChannel;
  status: InviteActivityStatus;
  sentAt: string;
  activatedAt?: string;
  coinsPending?: number;
  coinsAwarded?: number;
  remindersSent?: number;
  lastReminderAt?: string;
}

export interface InviteSummary {
  totalSent: number;
  totalActivated: number;
  totalPending: number;
  totalRewardsClaimed: number;
  pendingCoins: number;
  conversionRate: number;
}
export type TicketStatus = "open" | "in_progress" | "waiting" | "escalated" | "done";

export type TicketPriority = "low" | "medium" | "high" | "critical";

export type TicketChannel = "telegram" | "email" | "web" | "internal";

export type TicketCategory = "order" | "product" | "shipping" | "payment" | "account" | "other" | "support" | "bug" | "feature" | "billing" | "technical";

export type TicketSentiment = "positive" | "neutral" | "negative";

export interface Ticket {
  id: string;
  subject: string;
  summary: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  telegramUserHash: string;
  channel: TicketChannel;
  category: TicketCategory;
  tags: string[];
  lastMessageAt: string;
  slaDueAt?: string;
  waitingSince?: string;
  assignedAgent?: string;
  unreadCount: number;
  sentiment: TicketSentiment;
  satisfaction?: number | null;
  escalatedAt?: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  authorType: "customer" | "agent" | "automation" | "system";
  authorName?: string;
  body: string;
  createdAt: string;
  via: TicketChannel;
  isPrivate?: boolean;
  attachments?: { id: string; name: string; url: string }[];
  sentiment?: TicketSentiment;
  recommendedReplyId?: string;
}

export interface TicketMetrics {
  open: number;
  waiting: number;
  inProgress: number;
  escalated: number;
  doneToday: number;
  avgFirstResponseMinutes: number;
  avgResolutionMinutes: number;
  automationDeflectionRate: number;
  satisfactionScore: number;
}

export interface TicketTrendPoint {
  timestamp: string;
  open: number;
  waiting: number;
  escalated: number;
}

export interface TicketAutomationInsight {
  id: string;
  label: string;
  value: string;
  trend?: string;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  lastUpdated: string;
  confidence: number;
  views: number;
  helpfulVotes: number;
  link?: string;
}

export type DropAccess = "free" | "standard" | "vip" | "limited";

export type DropBadge = "Kostenlos" | "Limitiert" | "VIP" | "Drop";

export type DropLocale = LocaleCode;

export type DropStatus = "available" | "locked" | "coming_soon";

export type DropGateMode = "invite_only" | "vip" | "waitlist";

export interface AccessGate {
  mode: DropGateMode;
  message: string;
  minTier?: string;
  inviteCodeRequired?: boolean;
  startsAt?: string;
}

export interface VariantMediaAsset {
  id: string;
  url: string;
  alt: string;
  dominantColor?: string;
  type?: "image" | "video";
}

export interface VariantOriginOption {
  id: string;
  label: string;
  eta: string;
  leadTime?: string;
  priceDelta: number;
  currency: CurrencyCode;
  badge?: string;
  description?: string;
  isDefault?: boolean;
}

export interface DropVariant {
  id: string;
  label: string;
  flavor: string;
  description: string;
  badges?: string[];
  minQuantity: number;
  maxQuantity: number;
  stock: number;
  basePrice: number;
  priceMoney?: MoneyValue;
  priceCompareAt?: number;
  inviteRequired?: boolean;
  shippingOptionIds: string[];
  defaultShippingOptionId?: string;
  originOptions?: VariantOriginOption[];
  currency?: string;
  media: VariantMediaAsset[];
  gate?: AccessGate;
  highlight?: "new" | "hot" | "limited";
  quickQuantityOptions?: number[];
}

export interface QuantityPackPreset {
  id: string;
  label: string;
  quantity: number;
  description?: string;
  highlight?: "accent" | "warning" | "muted";
}

export interface DropShippingOption extends ShippingOption {
  regions: ShippingRegion[];
  eta?: string;
  cost?: number;
  // Landweg-Versand Konfiguration (inherited from ShippingOption, but can be overridden)
  landShipping?: boolean;
  landShippingDeliveryRange?: string; // Format: "19. Dez.-15. Jan."
  landShippingMessage?: string; // Custom Nachricht für Landweg-Versand
  showLandShippingBadge?: boolean; // Badge anzeigen
}

export type PreorderStatus = "pending" | "collecting" | "reached" | "ordered" | "failed";
export type CountdownType = "short" | "extended";

export interface Drop {
  id: string;
  name: string;
  badge: DropBadge;
  flavorTag: string;
  minQuantity: number;
  price: number;
  priceMoney?: MoneyValue;
  currency: CurrencyCode;
  progress: number;
  locale: DropLocale;
  status: DropStatus;
  access: DropAccess;
  inviteRequired: boolean;
  interestCount: number;
  defaultVariantId: string;
  variants: DropVariant[];
  shippingOptions: DropShippingOption[];
  quantityPacks?: QuantityPackPreset[];
  maxPerUser?: number;
  heroImageUrl?: string;
  heroVideoUrl?: string;
  shortDescription?: string;
  highlightMessage?: string;
  analyticsTag?: string;
  // Countdown fields
  deadlineAt?: string; // ISO date string
  countdownType?: CountdownType; // "short" for few days, "extended" for 1-2 weeks
  // Preorder fields
  minimumOrders?: number; // Required minimum orders (e.g., 10)
  currentOrders?: number; // Current order count
  preorderDeadline?: string; // ISO date string - deadline for collecting orders
  autoOrderOnReach?: boolean; // Auto-order when minimum is reached
  preorderStatus?: PreorderStatus; // Status of preorder collection
}

export interface DropSelectionSnapshot {
  dropId: string;
  variantId: string;
  quantity: number;
  shippingOptionId?: string;
  originOptionId?: string;
}

export interface DropReservation {
  id: string;
  dropId: string;
  dropName: string;
  variantId: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  total: number;
  currency: CurrencyCode;
  shippingOptionId?: string;
  shippingLabel?: string;
  shippingCost: number;
  originOptionId?: string;
  originLabel?: string;
  inviteRequired: boolean;
  createdAt: string;
}

export interface DropInterest {
  dropId: string;
  userHash: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  handle: string;
  country: string;
  coins: number;
  rank: string;
  inviteCode?: string;
  avatarUrl?: string;
}

export interface InviteStatus {
  userId: string;
  hasInvite: boolean;
  inviteCode: string;
  availableInvites: number;
  totalReferrals: number;
  rank: string;
}


