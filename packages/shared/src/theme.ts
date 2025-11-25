import tokens from "./tokens";

type TokenRecord = Record<string, string>;

export const toCssVariables = (record: TokenRecord, prefix: string) =>
  Object.entries(record).reduce<Record<string, string>>((acc, [key, value]) => {
    acc[`--${prefix}-${key}`] = value;
    return acc;
  }, {});

export const themeVariables = {
  ...toCssVariables(tokens.colors.background, "color-bg"),
  ...toCssVariables(tokens.colors.text, "color-text"),
  ...toCssVariables(tokens.colors.accent as TokenRecord, "color-accent"),
  ...toCssVariables(tokens.colors.status as TokenRecord, "color-status"),
  "--radius-lg": tokens.radii.lg,
  "--radius-md": tokens.radii.md,
  "--radius-sm": tokens.radii.sm
};

export default tokens;
