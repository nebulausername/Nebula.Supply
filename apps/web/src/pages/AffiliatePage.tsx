import { useEffect, useMemo, useState } from 'react';
import { useToastStore } from '../store/toast';
import { useBotCommandHandler } from '../utils/botCommandHandler';

export const AffiliatePage = () => {
  const [overview, setOverview] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [rankInfo, setRankInfo] = useState<any>(null);
  const { addToast } = useToastStore();
  const { executeCommand } = useBotCommandHandler();

  useEffect(() => {
    const userId = 'me';
    
    // Check for bot commands in URL
    const urlParams = new URLSearchParams(window.location.search);
    const command = urlParams.get('command');
    if (command) {
      const result = executeCommand(command);
      if (result.success) {
        console.log('Bot command executed:', result.message);
      }
    }
    
    // Load affiliate overview
    fetch(`/api/affiliate/overview?userId=${encodeURIComponent(userId)}`)
      .then(r => r.json())
      .then(d => setOverview(d.data))
      .catch(error => {
        console.warn('Failed to load affiliate overview:', error);
        setOverview(null);
      });
    
    // Load leaderboard
    fetch(`/api/affiliate/leaderboard`)
      .then(r => r.json())
      .then(d => setLeaderboard(d.data))
      .catch(error => {
        console.warn('Failed to load leaderboard:', error);
        setLeaderboard([]);
      });
    
    // Load rank info
    fetch(`/api/rank/me?telegram_id=123456`)
      .then(r => r.json())
      .then(d => setRankInfo(d.data))
      .catch(error => {
        console.warn('Failed to load rank info:', error);
        setRankInfo(null);
      });
  }, []);

  const inviteLink = useMemo(() => {
    const inviterId = 'me';
    return `https://t.me/${import.meta.env.VITE_TELEGRAM_BOT || 'your_bot'}?start=ref_${inviterId}`;
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    addToast({ type: 'success', message: 'Link kopiert!' });
  };

  const handleShare = (platform: 'telegram' | 'whatsapp') => {
    const text = encodeURIComponent('Schau dir Nebula an!');
    const url = platform === 'telegram'
      ? `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${text}`
      : `https://wa.me/?text=${text}%20${encodeURIComponent(inviteLink)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 gradient-text">Affiliate Programm</h1>
      
      {/* Invite Link & QR */}
      <div className="mb-6 p-6 bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 rounded-xl">
        <p className="text-sm text-muted mb-3">📲 Teile deinen persönlichen Link:</p>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full flex items-center gap-2">
            <input value={inviteLink} readOnly className="flex-1 bg-black/40 border border-white/20 rounded px-3 py-2 text-sm" />
            <button onClick={handleCopy} className="px-4 py-2 rounded bg-accent/20 hover:bg-accent/30 transition-colors border border-accent/30">Copy</button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleShare('telegram')} className="px-3 py-2 rounded bg-blue-500/20 hover:bg-blue-500/30 transition-colors text-sm">Telegram</button>
            <button onClick={() => handleShare('whatsapp')} className="px-3 py-2 rounded bg-green-500/20 hover:bg-green-500/30 transition-colors text-sm">WhatsApp</button>
          </div>
        </div>
        <div className="mt-4 flex justify-center">
          <div className="p-3 bg-white rounded">
            <QRPlaceholder link={inviteLink} />
          </div>
        </div>
      </div>

      {/* Rank Progress */}
      {rankInfo && (
        <div className="mb-6 p-6 bg-black/30 border border-white/10 rounded-xl">
          <h3 className="text-lg font-semibold mb-3">🏆 Dein Rang: {rankInfo.rank}</h3>
          {rankInfo.nextRank && (
            <>
              <p className="text-sm text-muted mb-2">Fortschritt zu {rankInfo.nextRank}:</p>
              <div className="mb-2">
                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-accent to-accent/60" style={{ width: `${Math.min(100, ((rankInfo.invites || 0) / ((rankInfo.progress?.invitesNeeded || 1) + (rankInfo.invites || 0))) * 100)}%` }} />
                </div>
              </div>
              <p className="text-xs text-muted">
                Noch {rankInfo.progress?.ordersNeeded || 0} Bestellungen oder {rankInfo.progress?.invitesNeeded || 0} Einladungen bis {rankInfo.nextRank}
              </p>
            </>
          )}
        </div>
      )}

      {/* Stats */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Stat label="Total" value={overview.total} />
          <Stat label="Erfolgreich" value={overview.succeeded} />
          <Stat label="Pending" value={overview.pending} />
          <Stat label="Conversion" value={`${overview.conversion}%`} />
        </div>
      )}

      {/* Leaderboard */}
      <h2 className="text-xl font-semibold mb-3">🏅 Top Inviter</h2>
      <div className="bg-black/30 border border-white/10 rounded-xl overflow-hidden">
        {leaderboard.map((row, i) => (
          <div key={i} className={`flex items-center justify-between px-4 py-3 border-b border-white/5 ${row.user === 'me' ? 'bg-accent/10' : ''}`}>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-muted">#{i+1}</span>
              <span className={row.user === 'me' ? 'font-semibold text-accent' : ''}>{row.user}</span>
            </div>
            <span className="font-mono text-accent">{row.count}</span>
          </div>
        ))}
        {leaderboard.length===0 && <div className="px-4 py-6 text-sm text-muted text-center">Noch keine Inviter</div>}
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: any }) => (
  <div className="p-4 bg-black/30 border border-white/10 rounded">
    <div className="text-sm text-muted">{label}</div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

const QRPlaceholder = ({ link }: { link: string }) => {
  // Simple QR using canvas (basic implementation)
  // In production, use a library like qrcode.react or react-qr-code
  return (
    <div className="w-32 h-32 bg-black/10 flex items-center justify-center text-xs text-muted">
      QR Code
    </div>
  );
};




