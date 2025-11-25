import React from 'react';
import { LivePaymentHistory } from '../components/profile/LivePaymentHistory';
import { LiveOrderTracking } from '../components/profile/LiveOrderTracking';

export const WebSocketTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">WebSocket Live-Tracking Test</h1>
          <p className="text-slate-400">Test der Echtzeit-Zahlungs- und Bestellverfolgung</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Live Payment History */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
            <LivePaymentHistory />
          </div>

          {/* Live Order Tracking */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
            <LiveOrderTracking />
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-4">Test-Anweisungen</h3>
          <div className="space-y-2 text-sm text-slate-300">
            <p>• Öffne die Browser-Entwicklertools (F12) → Console</p>
            <p>• Starte eine Zahlung im Checkout um Live-Updates zu testen</p>
            <p>• Die WebSocket-Verbindung sollte sich automatisch aufbauen</p>
            <p>• Bei erfolgreichen Zahlungen werden Updates hier angezeigt</p>
            <p>• Bei Versand wird automatisch zum Tracking weitergeleitet</p>
          </div>
        </div>
      </div>
    </div>
  );
};




