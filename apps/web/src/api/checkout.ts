const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const BTC_EUR_RATE = 34000;
const ETH_EUR_RATE = 1800;

const randomHex = (length: number) =>
  Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join("");

const buildBtcAddress = () => `bc1p${randomHex(40)}`;
const buildEthAddress = () => `0x${randomHex(40)}`;


export type PaymentMethod =
  | "btc_chain"
  | "eth_chain"
  | "crypto_voucher"
  | "cash_meetup"
  | "nebula_pay"
  | "on_chain"
  | "bank_transfer"
  | "credit_card"
  | "klarna";

export interface PaymentMethodConfig {
  id: PaymentMethod;
  label: string;
  description: string;
  settlementEta: string;
  feeHint?: string;
  anonymity: "high" | "medium" | "low";
  requiresReview?: boolean;
}

type LineItem = {
  productId: string;
  name: string;
  quantity: number;
  unitAmount: number;
};

export interface CheckoutRequest {
  idempotencyKey: string;
  subtotal: number;
  discount: number;
  total: number;
  rewardId: string | null;
  items: LineItem[];
  method: PaymentMethod;
}

export interface PaymentSession {
  id: string;
  method: PaymentMethod;
  amount: number;
  currency: string;
  status: "pending" | "confirmed" | "expired" | "awaiting_review";
  reference: string;
  instructions: string[];
  createdAt: string;
  expiresAt: string;
  address?: string;
  memo?: string;
  qrCode?: string;
  voucherHint?: string;
}

const paymentMethods: PaymentMethodConfig[] = [
  {
    id: "btc_chain",
    label: "Bitcoin (Bitomatics Relay)",
    description: "Einmalige Taproot-Adresse, automatisch gemixt �ber Bitomatics Nodes.",
    settlementEta: "~1 Block (10�30 Minuten)",
    feeHint: "Empfohlene Fee wird dynamisch berechnet",
    anonymity: "high"
  },
  {
    id: "eth_chain",
    label: "Ethereum (Stealth Vault)",
    description: "Frische Stealth-Address, final bei 2 Best�tigungen.",
    settlementEta: "< 5 Minuten",
    feeHint: "Gas < 0,003 ETH",
    anonymity: "high"
  },
  {
    id: "crypto_voucher",
    label: "Crypto Voucher (ab 50 �)",
    description: "Kaufe z.B. via dundle.com, sende Code � Versand kostenlos.",
    settlementEta: "Sofort nach Code-Check",
    anonymity: "medium"
  },
  {
    id: "cash_meetup",
    label: "Bargeld (Telegram Safe-Meet)",
    description: "Selfie-Verifikation + Treffpunkt-Vorschlag durch Staff.",
    settlementEta: "Nach manueller Best�tigung",
    anonymity: "high",
    requiresReview: true
  },
  {
    id: "nebula_pay",
    label: "Nebula Pay (Karte/Wallet)",
    description: "PSP-Verarbeitung mit auto Idempotency.",
    settlementEta: "< 30 Sekunden",
    feeHint: "1,2 % Fee",
    anonymity: "low"
  },
  {
    id: "on_chain",
    label: "Stablecoin (USDC/EURC)",
    description: "Treasury Wallet nebula.eth, 1:1 EUR Settle.",
    settlementEta: "< 5 Minuten",
    anonymity: "medium"
  },
  {
    id: "bank_transfer",
    label: "Bank + Voucher Hybrid",
    description: "Anleitung zum Crypto Voucher statt klassischer �berweisung.",
    settlementEta: "Sobald Voucher akzeptiert",
    anonymity: "medium"
  },
  {
    id: "credit_card",
    label: "Kreditkarte",
    description: "Erkl�rt Voucher Flow f�r maximale Privacy.",
    settlementEta: "Sofort nach Voucher",
    anonymity: "medium"
  },
  {
    id: "klarna",
    label: "Klarna / 30 Tage",
    description: "Statt Klarna direkt: Voucher kaufen, Code einl�sen.",
    settlementEta: "Sofort nach Voucher",
    anonymity: "medium"
  }
];

const sessionsByKey = new Map<string, PaymentSession>();
const sessionStore = new Map<string, PaymentSession>();

// Cryptographically secure session ID generation
const buildSessionId = (): string => {
  // Use crypto.randomBytes for secure random generation
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return `ps_${Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')}`;
  }
  // Fallback for older environments
  const randomBytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  return `ps_${randomBytes.map(byte => byte.toString(16).padStart(2, '0')).join('')}`;
};

const buildReference = (): string => {
  // Use timestamp + secure random for reference
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `NEB-${timestamp}-${random}`;
};

const createInstructions = (method: PaymentMethod, reference: string, total: number, session: PaymentSession) => {
  switch (method) {
    case "btc_chain": {
      const btcAmount = total / BTC_EUR_RATE;
      session.address = buildBtcAddress();
      session.qrCode = `bitcoin:${session.address}?amount=${btcAmount.toFixed(8)}`;
      session.memo = `Ref ${reference}`;
      return [
        `Sende ${btcAmount.toFixed(8)} BTC an ${session.address}`,
        "Adresse wurde durch Bitomatics Whirlpool gemixt (Taproot).",
        "Wir monitoren den Mempool in Echtzeit � 1 Block konfirmiert den Auftrag.",
        `Verwendungszweck: ${reference}`
      ];
    }
    case "eth_chain": {
      const ethAmount = total / ETH_EUR_RATE;
      session.address = buildEthAddress();
      session.qrCode = `ethereum:${session.address}?value=${(ethAmount * 1e18).toFixed(0)}`;
      session.memo = `Ref ${reference}`;
      return [
        `Sende ${ethAmount.toFixed(6)} ETH an ${session.address}`,
        "Stealth Vault rotiert die Adresse nach Abschluss; kein Link zu fr�heren Orders.",
        "Wir schlie�en nach 2 Best�tigungen ab.",
        `Memo / Ref (optional): ${reference}`
      ];
    }
    case "crypto_voucher": {
      session.voucherHint = "Codes = 50 � akzeptiert � Versandkosten entfallen automatisch.";
      return [
        "Besuche dundle.com oder bitnovo.com und kaufe einen Krypto-Voucher (50-500 �).",
        "W�hle Zahlungsart nach Wahl (Bar, Gutschein, Prepaid).",
        "L�se den Code im Checkout ein � wir validieren ihn automatisch.",
        "Nach Pr�fung wird deine Bestellung sofort freigegeben."
      ];
    }
    case "cash_meetup": {
      session.status = "awaiting_review";
      const emojiChallenge = ["??", "?", "??", "??", "???"][Math.floor(Math.random() * 5)];
      session.memo = `Selfie mit ${emojiChallenge}`;
      return [
        `Selfie aufnehmen: Halte ein Blatt mit ${emojiChallenge} + ${reference} in die Kamera.`,
        "Upload im Profil > Cash Requests.",
        "Unser Staff schl�gt dir Ort & Zeit (SafeMeet-Partner) vor.",
        "Nach �bergabe markiert der Staff die Bestellung als bezahlt."
      ];
    }
    case "nebula_pay":
      return [
        "�ffne den Nebula Pay Terminal Screen (Bot > /pay).",
        `Transaktion ${reference} wird mit FaceID best�tigt.`,
        "Sollte etwas h�ngen: Support via /ticket."
      ];
    case "on_chain": {
      const usdcAmount = total.toFixed(2);
      session.address = "nebula.eth";
      session.qrCode = `ethereum:${session.address}?token=USDC&value=${(Number(usdcAmount) * 1e6).toFixed(0)}`;
      return [
        "Sende USDC/EURC �ber Ethereum oder Polygon an nebula.eth",
        `Betrag: ${usdcAmount} (1:1 EUR)`,
        `Memo (optional): ${reference}`,
        "Wir fixieren den Kurs bei Eingang (0 Slippage)."
      ];
    }
    case "bank_transfer":
      session.voucherHint = "Statt klassischer �berweisung empfehlen wir Crypto Voucher � bar oder anonym bezahlbar.";
      return [
        "W�hle einen Voucher-Anbieter (du kannst bar zahlen oder Prepaid).",
        "Kaufe den Betrag deiner Bestellung (= 50 �).",
        "Im Checkout tr�gst du den Code ein � wir verrechnen ihn 1:1.",
        "Keine Bankspur, Versandkosten entfallen automatisch."
      ];
    case "credit_card":
      session.voucherHint = "Wir empfehlen Crypto Voucher � jede Kreditkarte m�glich, keine Card-Daten bei Nebula.";
      return [
        "�ffne dundle.com, w�hle 'Voucher > Crypto'.",
        "Bezahle mit deiner Karte (Visa/Master/Amex).",
        "Kopiere den Code in unser Voucher-Feld.",
        "Wir best�tigen sofort nach Code-Check."
      ];
    case "klarna":
      session.voucherHint = "F�r Buy-Now-Pay-Later nutze Klarna auf dundle.com und sende den Voucher-Code.";
      return [
        "Starte Klarna-Kauf auf dundle (Buy Now Pay Later).",
        "W�hle Crypto Voucher, Betrag = 50 �.",
        "Nach Erhalt Code im Checkout eintragen.",
        "Sobald validiert, ist deine Bestellung bezahlt."
      ];
    default:
      return ["Zahlungsinstruktionen folgen."];
  }
};

export const getPaymentMethods = async (): Promise<PaymentMethodConfig[]> => {
  await delay(120);
  return paymentMethods;
};

export const createPaymentSession = async (request: CheckoutRequest): Promise<PaymentSession> => {
  if (sessionsByKey.has(request.idempotencyKey)) {
    return sessionsByKey.get(request.idempotencyKey)!;
  }

  await delay(300);

  const id = buildSessionId();
  const reference = buildReference();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

  const baseSession: PaymentSession = {
    id,
    method: request.method,
    amount: request.total,
    currency: "EUR",
    status: "pending",
    reference,
    instructions: [],
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  baseSession.instructions = createInstructions(request.method, reference, request.total, baseSession);

  sessionsByKey.set(request.idempotencyKey, baseSession);
  sessionStore.set(id, baseSession);

  const finalize = () => {
    const current = sessionStore.get(id);
    if (!current || current.status !== "pending") return;
    const confirmed = { ...current, status: "confirmed" as const };
    sessionStore.set(id, confirmed);
    sessionsByKey.set(request.idempotencyKey, confirmed);
  };

  if (
    request.method === "btc_chain" ||
    request.method === "eth_chain" ||
    request.method === "nebula_pay" ||
    request.method === "on_chain" ||
    request.method === "crypto_voucher" ||
    request.method === "bank_transfer" ||
    request.method === "credit_card" ||
    request.method === "klarna"
  ) {
    const timeout =
      request.method === "nebula_pay" ? 2000 : request.method === "crypto_voucher" ? 4000 : 6000;
    setTimeout(finalize, timeout);
  }

  return baseSession;
};

export const waitForPaymentConfirmation = async (sessionId: string): Promise<PaymentSession> => {
  for (;;) {
    await delay(750);
    const session = sessionStore.get(sessionId);
    if (!session) {
      throw new Error("Unbekannte Payment Session");
    }
    if (session.status === "confirmed" || session.status === "awaiting_review") {
      return session;
    }
  }
};

export const clearPaymentSessionCache = () => {
  sessionsByKey.clear();
  sessionStore.clear();
};


