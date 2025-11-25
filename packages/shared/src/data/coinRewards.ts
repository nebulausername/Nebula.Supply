import type { CoinRewardTier } from "../types";

export const coinRewardTiers: CoinRewardTier[] = [
  {
    id: "reward-5",
    coins: 50,
    reward: "5€ Rabatt",
    discountValue: 5,
    minSpend: 30
  },
  {
    id: "reward-10",
    coins: 100,
    reward: "10€ Rabatt",
    discountValue: 10,
    minSpend: 50
  },
  {
    id: "reward-20",
    coins: 200,
    reward: "20€ Rabatt",
    discountValue: 20,
    minSpend: 90
  }
];
