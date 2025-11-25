import { Card } from '../ui/Card';
import { inviteStatusMock } from '@nebula/shared';

export function InviteStatus() {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Invite Status</h2>
      <div className="grid gap-3">
        <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-accent">Aktiver Rank</p>
          <p className="text-text font-semibold">{inviteStatusMock.rank}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-accent">Freie Invites</p>
          <p className="text-text font-semibold">{inviteStatusMock.availableInvites}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-accent">Invite Code</p>
          <p className="font-mono text-text">{inviteStatusMock.inviteCode}</p>
        </div>
      </div>
    </Card>
  );
}
