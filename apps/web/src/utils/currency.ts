export const formatCurrency = (value: number, locale = "de-DE", currency = "EUR") =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
