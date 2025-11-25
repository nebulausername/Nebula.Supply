import base from "../tokens.json" assert { type: "json" };

const tokens = base;

export const colors = tokens.colors;
export const radii = tokens.radii;
export const typography = {
  heading: "Space Grotesk",
  body: "Inter",
  mono: "JetBrains Mono"
} as const;

export const shadows = {
  card: "0 16px 32px rgba(11, 247, 188, 0.15)",
  soft: "0 8px 24px rgba(17, 24, 39, 0.35)"
} as const;

export const spacingScale = [0, 4, 8, 12, 16, 20, 24, 32, 40] as const;

export default {
  colors,
  radii,
  typography,
  shadows,
  spacingScale
};
