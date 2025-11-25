import { Card } from '../ui/Card';
import { coinRewardTiers } from '@nebula/shared';

export function CoinRewards() {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Coin Rewards</h2>
      <div className="space-y-2">
        {coinRewardTiers.map((tier) => (
          <div key={tier.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-4 py-3">
            <span className="text-text">{tier.coins} Coins | {tier.reward}</span>
            <span className="text-muted">ab {tier.minSpend} EUR</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
