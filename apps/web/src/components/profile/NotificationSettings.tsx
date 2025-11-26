import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  MessageSquare,
  AlertCircle,
  UserPlus,
  Filter,
  Smartphone,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../store/auth';

interface NotificationPreferences {
  ticketMessages: boolean;
  ticketStatusChanges: boolean;
  ticketAssignments: boolean;
  onlyMyTickets: boolean;
  telegramEnabled: boolean;
}

interface NotificationSettingsProps {
  className?: string;
}

export const NotificationSettings = ({ className }: NotificationSettingsProps) => {
  const { user } = useAuthStore();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    ticketMessages: true,
    ticketStatusChanges: true,
    ticketAssignments: false,
    onlyMyTickets: true,
    telegramEnabled: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Get user ID (telegram_id or id)
  const userId = user?.telegram_id || user?.id || 
    (typeof window !== 'undefined' ? localStorage.getItem('telegram_id') : null);

  // Fetch preferences on mount
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchPreferences = async () => {
      try {
        const response = await fetch(`/api/users/me/notification-preferences?userId=${userId}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setPreferences(data.data);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch notification preferences', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [userId]);

  // Save preferences
  const savePreferences = async (newPreferences: NotificationPreferences) => {
    if (!userId) return;

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const response = await fetch('/api/users/me/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...newPreferences,
          userId
        })
      });

      if (response.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Failed to save notification preferences', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key]
    };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  const settings = [
    {
      key: 'telegramEnabled' as const,
      label: 'Telegram-Benachrichtigungen',
      description: 'Aktiviere oder deaktiviere alle Telegram-Benachrichtigungen',
      icon: Smartphone,
      color: 'text-blue-400'
    },
    {
      key: 'ticketMessages' as const,
      label: 'Neue Nachrichten',
      description: 'Benachrichtigungen bei neuen Nachrichten zu deinen Tickets',
      icon: MessageSquare,
      color: 'text-green-400',
      requiresTelegram: true
    },
    {
      key: 'ticketStatusChanges' as const,
      label: 'Status-Änderungen',
      description: 'Benachrichtigungen wenn sich der Status deines Tickets ändert',
      icon: AlertCircle,
      color: 'text-yellow-400',
      requiresTelegram: true
    },
    {
      key: 'ticketAssignments' as const,
      label: 'Ticket-Zuweisungen',
      description: 'Benachrichtigungen wenn ein Ticket einem Agenten zugewiesen wird',
      icon: UserPlus,
      color: 'text-purple-400',
      requiresTelegram: true
    },
    {
      key: 'onlyMyTickets' as const,
      label: 'Nur eigene Tickets',
      description: 'Erhalte nur Benachrichtigungen für deine eigenen Tickets',
      icon: Filter,
      color: 'text-orange-400',
      requiresTelegram: true
    }
  ];

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-accent/20 to-purple-500/20 border border-accent/30">
            <Bell className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text">Benachrichtigungseinstellungen</h3>
            <p className="text-sm text-muted">Verwalte deine Ticket-Benachrichtigungen</p>
          </div>
        </div>
        
        {/* Save Status Indicator */}
        <AnimatePresence>
          {saveStatus === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20"
            >
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span className="text-xs text-green-400 font-medium">Gespeichert</span>
            </motion.div>
          )}
          {saveStatus === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20"
            >
              <XCircle className="h-4 w-4 text-red-400" />
              <span className="text-xs text-red-400 font-medium">Fehler</span>
            </motion.div>
          )}
          {isSaving && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface/50 border border-white/10"
            >
              <Loader2 className="h-4 w-4 animate-spin text-muted" />
              <span className="text-xs text-muted">Speichere...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Settings List */}
      <div className="space-y-3">
        {settings.map((setting, index) => {
          const Icon = setting.icon;
          const isDisabled = setting.requiresTelegram && !preferences.telegramEnabled;
          const value = preferences[setting.key];

          return (
            <motion.div
              key={setting.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'rounded-xl border p-4 transition-all',
                'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
                'backdrop-blur-xl border-white/10',
                isDisabled && 'opacity-50'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={cn(
                    'p-2 rounded-lg bg-white/5 border border-white/10',
                    setting.color
                  )}>
                    <Icon className={cn('h-4 w-4', setting.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-text">{setting.label}</h4>
                      {setting.requiresTelegram && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Telegram
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted leading-relaxed">{setting.description}</p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => !isDisabled && handleToggle(setting.key)}
                  disabled={isDisabled}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors ml-4',
                    'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-surface',
                    value
                      ? 'bg-gradient-to-r from-accent to-purple-500'
                      : 'bg-slate-600/50',
                    isDisabled && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <motion.span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform'
                    )}
                    animate={{
                      x: value ? 22 : 4
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30
                    }}
                  />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: settings.length * 0.05 }}
        className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4"
      >
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-400 mb-1">Wie funktionieren Benachrichtigungen?</h4>
            <p className="text-xs text-blue-300/80 leading-relaxed">
              Wenn Telegram-Benachrichtigungen aktiviert sind, erhältst du automatisch Nachrichten im Telegram-Bot, 
              wenn ein Agent auf dein Ticket antwortet oder sich der Status ändert. Du kannst jederzeit einzelne 
              Benachrichtigungstypen anpassen.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

