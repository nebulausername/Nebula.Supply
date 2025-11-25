import { useState, useEffect, useCallback, memo } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { api } from "../../lib/api/client";
import { logger } from "../../lib/logger";
import { useToast } from "../ui/Toast";

interface CashPaymentVerification {
  id: string;
  user_id: string;
  order_id: string;
  hand_sign: string;
  hand_sign_emoji: string;
  hand_sign_instructions: string;
  photo_url: string;
  status: "pending_review" | "approved" | "rejected";
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export const CashPaymentVerificationQueue = memo(function CashPaymentVerificationQueue() {
  const [verifications, setVerifications] = useState<CashPaymentVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const { showToast } = useToast();

  const fetchPendingVerifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get<CashPaymentVerification[]>('/api/bot/cash-verifications/pending', undefined, { returnFullResponse: true });
      
      if (response && 'data' in response && Array.isArray(response.data)) {
        setVerifications(response.data);
      } else if (Array.isArray(response)) {
        setVerifications(response);
      } else {
        setVerifications([]);
      }
    } catch (err) {
      logger.error('Failed to fetch pending cash verifications', { error: err });
      setError(err instanceof Error ? err.message : 'Unknown error');
      setVerifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const approveVerification = useCallback(async (verificationId: string) => {
    try {
      const notes = adminNotes[verificationId] || '';

      await api.patch(`/api/bot/cash-verifications/${verificationId}/status`, {
        status: 'approved',
        admin_notes: notes
      });

      logger.info('Cash verification approved', { verificationId, notes });
      showToast({ type: 'success', title: 'Verification approved successfully' });

      // Refresh the list
      await fetchPendingVerifications();
      
      // Clear notes
      setAdminNotes(prev => {
        const updated = { ...prev };
        delete updated[verificationId];
        return updated;
      });
    } catch (err) {
      logger.error('Failed to approve verification', { error: err, verificationId });
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve verification';
      setError(errorMessage);
      showToast({ type: 'error', title: errorMessage });
    }
  }, [adminNotes, fetchPendingVerifications, showToast]);

  const rejectVerification = useCallback(async (verificationId: string) => {
    try {
      const notes = adminNotes[verificationId] || '';

      if (!notes.trim()) {
        showToast({ type: 'error', title: 'Please provide a rejection reason' });
        return;
      }

      await api.patch(`/api/bot/cash-verifications/${verificationId}/status`, {
        status: 'rejected',
        admin_notes: notes
      });

      logger.info('Cash verification rejected', { verificationId, notes });
      showToast({ type: 'success', title: 'Verification rejected' });

      // Refresh the list
      await fetchPendingVerifications();
      
      // Clear notes
      setAdminNotes(prev => {
        const updated = { ...prev };
        delete updated[verificationId];
        return updated;
      });
    } catch (err) {
      logger.error('Failed to reject verification', { error: err, verificationId });
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject verification';
      setError(errorMessage);
      showToast({ type: 'error', title: errorMessage });
    }
  }, [adminNotes, fetchPendingVerifications, showToast]);

  useEffect(() => {
    fetchPendingVerifications();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingVerifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Barzahlung Verifikations-Queue</h3>
          <p className="text-sm text-muted">Handzeichen-Selfies zur Überprüfung</p>
        </div>
        <Badge variant="default" className="text-xs">
          {verifications.length} Pending
        </Badge>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          ❌ {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted">Laden...</div>
        </div>
      ) : verifications.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-muted text-sm">
            ✅ Keine ausstehenden Verifikationen
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {verifications.map((verification) => (
            <div
              key={verification.id}
              className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Selfie Photo */}
                <div className="flex-shrink-0">
                  <img
                    src={verification.photo_url}
                    alt="Verification Selfie"
                    className="w-32 h-32 rounded-lg border border-white/20 object-cover"
                  />
                </div>

                {/* Verification Details */}
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{verification.hand_sign_emoji}</span>
                      <span className="font-semibold text-white">{verification.hand_sign}</span>
                    </div>
                    <p className="text-sm text-muted mb-1">
                      {verification.hand_sign_instructions}
                    </p>
                    <p className="text-xs text-muted/70">
                      User: {verification.user_id} • Order: {verification.order_id}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Status: {verification.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {new Date(verification.created_at).toLocaleString('de-DE')}
                    </Badge>
                  </div>

                  {/* Admin Notes Input */}
                  <div>
                    <textarea
                      value={adminNotes[verification.id] || ''}
                      onChange={(e) => setAdminNotes(prev => ({
                        ...prev,
                        [verification.id]: e.target.value
                      }))}
                      placeholder="Admin-Notizen (optional für Approve, erforderlich für Reject)"
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-muted text-sm resize-none focus:border-accent focus:ring-1 focus:ring-accent"
                      rows={2}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => approveVerification(verification.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      ✅ Genehmigen
                    </Button>
                    <Button
                      onClick={() => rejectVerification(verification.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      size="sm"
                    >
                      ❌ Ablehnen
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/10">
        <Button
          onClick={fetchPendingVerifications}
          variant="outline"
          className="w-full"
          size="sm"
        >
          🔄 Aktualisieren
        </Button>
      </div>
    </Card>
  );
});





