import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wrench, Zap, AlertTriangle, CheckCircle2, Save, Clock, MessageSquare } from "lucide-react";
import { fetchMaintenanceStatus, type MaintenanceStatus } from "../../api/status";
import { cn } from "../../utils/cn";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const MaintenanceControl = () => {
  const [status, setStatus] = useState<MaintenanceStatus>({
    isActive: false,
    mode: 'none',
    title: '',
    message: '',
    updates: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [estimatedTime, setEstimatedTime] = useState('');
  const [progress, setProgress] = useState<number | ''>('');
  const [newUpdate, setNewUpdate] = useState({ message: '', type: 'info' as 'info' | 'warning' | 'success' });
  
  useEffect(() => {
    loadStatus();
  }, []);
  
  const loadStatus = async () => {
    try {
      const data = await fetchMaintenanceStatus();
      setStatus(data);
      if (data.estimatedEndTime) {
        const date = new Date(data.estimatedEndTime);
        setEstimatedTime(date.toISOString().slice(0, 16));
      }
      setProgress(data.progress ?? '');
      setLoading(false);
    } catch (error) {
      console.error('Failed to load status:', error);
      setLoading(false);
    }
  };
  
  const saveStatus = async () => {
    setSaving(true);
    setSuccess(false);
    
    try {
      const payload: MaintenanceStatus = {
        ...status,
        estimatedEndTime: estimatedTime ? new Date(estimatedTime).toISOString() : undefined,
        progress: progress !== '' ? Number(progress) : undefined
      };
      
      const response = await fetch(`${API_BASE_URL}/api/status/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save status');
      }
      
      const saved = await response.json();
      setStatus(saved);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save status:', error);
      alert('Fehler beim Speichern. Bitte versuche es erneut.');
    } finally {
      setSaving(false);
    }
  };
  
  const addUpdate = () => {
    if (!newUpdate.message.trim()) return;
    
    const update = {
      id: `update-${Date.now()}`,
      timestamp: new Date().toISOString(),
      message: newUpdate.message,
      type: newUpdate.type
    };
    
    setStatus({
      ...status,
      updates: [...(status.updates || []), update]
    });
    
    setNewUpdate({ message: '', type: 'info' });
  };
  
  const removeUpdate = (id: string) => {
    setStatus({
      ...status,
      updates: (status.updates || []).filter(u => u.id !== id)
    });
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A0A]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/20 border-t-[#0BF7BC]" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#0BF7BC] to-white bg-clip-text text-transparent">
            Wartungsmodus Steuerung
          </h1>
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#34D399]/20 border border-[#34D399]/30"
            >
              <CheckCircle2 className="w-5 h-5 text-[#34D399]" />
              <span className="text-sm font-medium text-[#34D399]">Gespeichert!</span>
            </motion.div>
          )}
        </div>
        
        {/* Status Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-[#111827] border border-white/10 p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-1">Wartungsmodus</h2>
              <p className="text-sm text-white/60">Aktiviere oder deaktiviere den Wartungsmodus</p>
            </div>
            <button
              onClick={() => setStatus({ ...status, isActive: !status.isActive })}
              className={cn(
                "relative w-16 h-8 rounded-full transition-colors",
                status.isActive ? "bg-[#0BF7BC]" : "bg-white/20"
              )}
            >
              <motion.div
                layout
                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                animate={{ x: status.isActive ? 32 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
          
          {status.isActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 pt-4 border-t border-white/10"
            >
              {/* Mode Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Modus</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'maintenance', label: 'Wartung', icon: Wrench, color: 'text-[#0BF7BC]' },
                    { value: 'update', label: 'Update', icon: Zap, color: 'text-[#FBBF24]' },
                    { value: 'emergency', label: 'Notfall', icon: AlertTriangle, color: 'text-[#F87171]' }
                  ].map(({ value, label, icon: Icon, color }) => (
                    <button
                      key={value}
                      onClick={() => setStatus({ ...status, mode: value as any })}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-xl border transition-all",
                        status.mode === value
                          ? "border-[#0BF7BC] bg-[#0BF7BC]/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", status.mode === value ? color : "text-white/40")} />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">Titel</label>
                <input
                  type="text"
                  value={status.title}
                  onChange={(e) => setStatus({ ...status, title: e.target.value })}
                  placeholder="z.B. Wartungsarbeiten"
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-[#0BF7BC] focus:outline-none"
                />
              </div>
              
              {/* Message */}
              <div>
                <label className="block text-sm font-medium mb-2">Nachricht</label>
                <textarea
                  value={status.message}
                  onChange={(e) => setStatus({ ...status, message: e.target.value })}
                  placeholder="z.B. Wir arbeiten gerade an Verbesserungen..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-[#0BF7BC] focus:outline-none resize-none"
                />
              </div>
              
              {/* Estimated Time & Progress */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Geschätzte Zeit</label>
                  <input
                    type="datetime-local"
                    value={estimatedTime}
                    onChange={(e) => setEstimatedTime(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-[#0BF7BC] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Fortschritt (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0-100"
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-[#0BF7BC] focus:outline-none"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
        
        {/* Updates Section */}
        {status.isActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-[#111827] border border-white/10 p-6 space-y-4"
          >
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#0BF7BC]" />
              Status-Updates
            </h2>
            
            {/* Add Update */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newUpdate.message}
                onChange={(e) => setNewUpdate({ ...newUpdate, message: e.target.value })}
                placeholder="Neues Update..."
                className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-[#0BF7BC] focus:outline-none"
                onKeyPress={(e) => e.key === 'Enter' && addUpdate()}
              />
              <select
                value={newUpdate.type}
                onChange={(e) => setNewUpdate({ ...newUpdate, type: e.target.value as any })}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-[#0BF7BC] focus:outline-none"
              >
                <option value="info">Info</option>
                <option value="warning">Warnung</option>
                <option value="success">Erfolg</option>
              </select>
              <button
                onClick={addUpdate}
                className="px-4 py-2 rounded-xl bg-[#0BF7BC] text-black font-semibold hover:bg-[#0BF7BC]/80 transition-colors"
              >
                Hinzufügen
              </button>
            </div>
            
            {/* Updates List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {status.updates?.map((update, index) => (
                <div
                  key={update.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded",
                        update.type === 'info' && "bg-[#0BF7BC]/20 text-[#0BF7BC]",
                        update.type === 'warning' && "bg-[#FBBF24]/20 text-[#FBBF24]",
                        update.type === 'success' && "bg-[#34D399]/20 text-[#34D399]"
                      )}>
                        {update.type}
                      </span>
                      <span className="text-xs text-white/40">
                        {new Date(update.timestamp).toLocaleString('de-DE')}
                      </span>
                    </div>
                    <p className="text-sm text-white/80">{update.message}</p>
                  </div>
                  <button
                    onClick={() => removeUpdate(update.id)}
                    className="text-white/40 hover:text-white/80 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
              {(!status.updates || status.updates.length === 0) && (
                <p className="text-sm text-white/40 text-center py-4">Noch keine Updates</p>
              )}
            </div>
          </motion.div>
        )}
        
        {/* Save Button */}
        <motion.button
          onClick={saveStatus}
          disabled={saving}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold",
            "bg-gradient-to-r from-[#0BF7BC] to-[#61F4F4] text-black",
            "hover:scale-105 active:scale-95 transition-transform",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "shadow-lg shadow-[#0BF7BC]/30"
          )}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-black/20 border-t-black" />
              <span>Speichere...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Status speichern</span>
            </>
          )}
        </motion.button>
        
        {/* Preview Link */}
        <div className="text-center">
          <a
            href="/maintenance"
            target="_blank"
            className="text-sm text-[#0BF7BC] hover:underline"
          >
            Vorschau öffnen →
          </a>
        </div>
      </div>
    </div>
  );
};

