import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Plus, MessageSquare, Shield, Zap, Bot, Clock, CheckCircle, AlertCircle, CreditCard, QrCode } from 'lucide-react';
import { Header } from '../layout/Header';
import { TicketList } from '../components/support/TicketList';
import { TicketCreate } from '../components/support/TicketCreate';
import { TicketDetail } from '../components/support/TicketDetail';
import { SupportMetrics } from '../components/support/SupportMetrics';
import { QuickActions } from '../components/support/QuickActions';
import { useBotCommandHandler } from '../utils/botCommandHandler';
import type { TicketData, Message } from '../components/support/types';
import { useVipStore } from '../store/vip';
import { useRealtimeTickets } from '../hooks/useRealtimeTickets';

export const SupportPage: React.FC = () => {
  const [view, setView] = useState<'list' | 'create' | 'detail' | 'payment' | 'tickets'>('list');
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sessionId, setSessionId] = useState<string>('');
  const { executeCommand } = useBotCommandHandler();
  const { currentTier } = useVipStore();
  const isVip = currentTier !== 'Comet';
  
  // Get Telegram User ID if available
  const telegramUserId = typeof window !== 'undefined' 
    ? localStorage.getItem('telegram_id') || undefined 
    : undefined;
  
  // Real-time ticket updates
  const { isConnected: realtimeConnected } = useRealtimeTickets({
    telegramUserId,
    enabled: true,
    onTicketCreated: (ticket) => {
      // Add new ticket to list
      setTickets(prev => {
        const exists = prev.find(t => t.id === ticket.id);
        if (!exists) {
          const newTickets = [ticket, ...prev];
          saveTickets(newTickets);
          return newTickets;
        }
        return prev;
      });
    },
    onTicketUpdated: (ticket) => {
      // Update existing ticket
      setTickets(prev => {
        const updated = prev.map(t => t.id === ticket.id ? ticket : t);
        saveTickets(updated);
        
        // Update selected ticket if it's the same one
        if (selectedTicket?.id === ticket.id) {
          setSelectedTicket(ticket);
        }
        
        return updated;
      });
    },
    onTicketStatusChanged: (ticketId, oldStatus, newStatus) => {
      // Update ticket status
      setTickets(prev => {
        const updated = prev.map(t => 
          t.id === ticketId ? { ...t, status: newStatus as any } : t
        );
        saveTickets(updated);
        
        // Update selected ticket if it's the same one
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status: newStatus as any });
        }
        
        return updated;
      });
    },
    onMessageAdded: (ticketId, message) => {
      // Add new message to ticket
      setTickets(prev => {
        const updated = prev.map(t => {
          if (t.id === ticketId) {
            const messages = t.messages || [];
            return {
              ...t,
              messages: [...messages, message],
              updatedAt: message.timestamp
            };
          }
          return t;
        });
        saveTickets(updated);
        
        // Update selected ticket if it's the same one
        if (selectedTicket?.id === ticketId) {
          const messages = selectedTicket.messages || [];
          setSelectedTicket({
            ...selectedTicket,
            messages: [...messages, message],
            updatedAt: message.timestamp
          });
        }
        
        return updated;
      });
    }
  });
  
  useEffect(() => {
    // Get or create anonymous session
    let session = localStorage.getItem('nebula_support_session');
    if (!session) {
      session = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('nebula_support_session', session);
    }
    setSessionId(session);
    loadUserTickets(session);

    // Check for bot commands in URL
    const urlParams = new URLSearchParams(window.location.search);
    const command = urlParams.get('command');
    if (command) {
      const result = executeCommand(command);
      if (result.success) {
        // Auto-navigate based on command
        if (command.includes('zahlung') || command.includes('payment')) {
          setView('payment');
        } else if (command.includes('ticket') || command.includes('qr')) {
          setView('tickets');
        } else if (command.includes('hilfe') || command.includes('help')) {
          setView('list');
        }
      }
    }

    // Listen for bot commands
    const handleBotCommand = (event: CustomEvent) => {
      const result = executeCommand(event.detail.command);
      if (result.success) {
        console.log('Bot command executed:', result.message);
        
        // Auto-navigate based on command
        const command = event.detail.command.toLowerCase();
        if (command.includes('zahlung') || command.includes('payment')) {
          setView('payment');
        } else if (command.includes('ticket') || command.includes('qr')) {
          setView('tickets');
        } else if (command.includes('hilfe') || command.includes('help')) {
          setView('list');
        }
      }
    };

    window.addEventListener('bot-command', handleBotCommand as EventListener);
    
    return () => {
      window.removeEventListener('bot-command', handleBotCommand as EventListener);
    };
  }, [executeCommand]);

  const loadUserTickets = (session: string) => {
    const stored = localStorage.getItem(`nebula_tickets_${session}`);
    if (stored) {
      setTickets(JSON.parse(stored));
    }
  };

  const saveTickets = (newTickets: TicketData[]) => {
    setTickets(newTickets);
    localStorage.setItem(`nebula_tickets_${sessionId}`, JSON.stringify(newTickets));
  };

  const handleCreateTicket = (newTicket: TicketData) => {
    const updatedTickets = [newTicket, ...tickets];
    saveTickets(updatedTickets);
    setView('list');

    // Show success and redirect to detail view
    setTimeout(() => {
      setSelectedTicket(newTicket);
      setView('detail');
    }, 500);
  };

  const handleSelectTicket = (ticket: TicketData) => {
    setSelectedTicket(ticket);
    setView('detail');
  };

  const handleSendMessage = async (messageText: string) => {
    if (!selectedTicket) return;

    const message: Message = {
      id: `MSG-${Date.now()}`,
      text: messageText,
      from: 'user',
      timestamp: new Date().toISOString(),
      senderName: localStorage.getItem('nebula_user_name') || 'Anonymer Nutzer'
    };

    const updatedTicket = {
      ...selectedTicket,
      messages: [...selectedTicket.messages, message]
    };

    const updatedTickets = tickets.map(t => 
      t.id === selectedTicket.id ? updatedTicket : t
    );

    saveTickets(updatedTickets);
    setSelectedTicket(updatedTicket);

    // Simulate support response
    setTimeout(() => {
      const supportMessage: Message = {
        id: `MSG-${Date.now()}`,
        text: 'Vielen Dank für deine Nachricht! Unser Support-Team hat deine Anfrage erhalten und wird sich schnellstmöglich bei dir melden. 🎧',
        from: 'agent',
        timestamp: new Date().toISOString(),
        senderName: 'Support Team'
      };

      const withResponse = {
        ...updatedTicket,
        messages: [...updatedTicket.messages, supportMessage],
        status: 'in_progress' as const
      };

      const finalTickets = tickets.map(t => 
        t.id === selectedTicket.id ? withResponse : t
      );

      saveTickets(finalTickets);
      setSelectedTicket(withResponse);
    }, 2000 + Math.random() * 2000);
  };

  const handleMarkDone = async () => {
    if (!selectedTicket) return;

    const updatedTicket = {
      ...selectedTicket,
      status: 'done' as const
    };

    const updatedTickets = tickets.map(t => 
      t.id === selectedTicket.id ? updatedTicket : t
    );

    saveTickets(updatedTickets);
    setSelectedTicket(updatedTicket);
  };

  // Calculate support metrics
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
  const totalMessages = tickets.reduce((sum, t) => sum + t.messages.length, 0);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 pb-24">
      <Header
        coins={420} // Mock coins for support
        eyebrow="Nebula Support"
        title="Support & Tickets"
        description={`Anonymer Support für alle deine Fragen. Jede Nachricht synchronisiert sich mit dem Telegram Bot – schnelle Hilfe garantiert.${isVip ? " VIP: Zugriff auf Echtzeit-Chat." : ""}`}
        highlights={[
          {
            title: "Support aktiv",
            description: `Du hast ${openTickets} offene und ${inProgressTickets} Tickets in Bearbeitung. ${totalMessages} Nachrichten gesendet.`,
            tone: "accent"
          },
          {
            title: "Support Features",
            description: isVip ? "100% Anonym • Schnelle Antwort • Telegram Integration • Echtzeit-Chat" : "100% Anonym • Schnelle Antwort • Telegram Integration",
            ...(realtimeConnected && {
              badge: "Live"
            })
          }
        ]}
      />

      {/* View Switcher */}
      {view !== 'detail' && (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('list')}
                className={`group relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  view === 'list'
                    ? "bg-accent/20 text-accent shadow-[0_0_20px_rgba(11,247,188,0.3)]"
                    : "text-muted hover:text-text hover:bg-white/5 hover:shadow-lg"
                }`}
              >
                <Ticket className="h-4 w-4 transition-all duration-300 group-hover:scale-110" />
                <span>Meine Tickets ({tickets.length})</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('create')}
                className={`group relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  view === 'create'
                    ? "bg-accent/20 text-accent shadow-[0_0_20px_rgba(11,247,188,0.3)]"
                    : "text-muted hover:text-text hover:bg-white/5 hover:shadow-lg"
                }`}
              >
                <Plus className="h-4 w-4 transition-all duration-300 group-hover:scale-110" />
                <span>Neues Ticket</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('payment')}
                className={`group relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  view === 'payment'
                    ? "bg-accent/20 text-accent shadow-[0_0_20px_rgba(11,247,188,0.3)]"
                    : "text-muted hover:text-text hover:bg-white/5 hover:shadow-lg"
                }`}
              >
                <CreditCard className="h-4 w-4 transition-all duration-300 group-hover:scale-110" />
                <span>Zahlungen</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('tickets')}
                className={`group relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  view === 'tickets'
                    ? "bg-accent/20 text-accent shadow-[0_0_20px_rgba(11,247,188,0.3)]"
                    : "text-muted hover:text-text hover:bg-white/5 hover:shadow-lg"
                }`}
              >
                <QrCode className="h-4 w-4 transition-all duration-300 group-hover:scale-110" />
                <span>QR-Codes</span>
              </motion.button>
            </div>
            
            {view === 'list' && (
              <div className="flex items-center gap-4 text-xs text-muted">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>{openTickets} Offen</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                  <span>{inProgressTickets} In Bearbeitung</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <span>{tickets.filter(t => t.status === 'done').length} Erledigt</span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {view === 'list' && (
          <div className="space-y-6">
            <QuickActions
              onNewTicket={() => setView('create')}
              onSearch={() => (document.querySelector('input[type="search"]') as HTMLInputElement)?.focus?.()}
              onFilter={() => document.querySelector('select')?.focus()}
              totalTickets={tickets.length}
              openTickets={openTickets}
            />
            <SupportMetrics tickets={tickets} />
            <TicketList
              key="list"
              tickets={tickets}
              onSelectTicket={handleSelectTicket}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterStatus={filterStatus}
              onFilterChange={setFilterStatus}
            />
          </div>
        )}

        {view === 'create' && (
          <TicketCreate
            key="create"
            sessionId={sessionId}
            onSubmit={handleCreateTicket}
            onCancel={() => setView('list')}
          />
        )}

        {view === 'detail' && selectedTicket && (
          <TicketDetail
            key="detail"
            ticket={selectedTicket}
            onBack={() => setView('list')}
            onSendMessage={handleSendMessage}
            onMarkDone={handleMarkDone}
          />
        )}

        {view === 'payment' && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-accent" />
                Zahlungsmethoden
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-semibold text-accent">Akzeptierte Zahlungsmethoden:</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      Kreditkarte (Visa, Mastercard)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      PayPal
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      Apple Pay / Google Pay
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      SEPA Überweisung
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      Kryptowährungen (BTC, ETH)
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-accent">Sicherheit:</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-400" />
                      256-bit SSL Verschlüsselung
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-400" />
                      PCI DSS konform
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-400" />
                      Keine Speicherung von Zahlungsdaten
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'tickets' && (
          <motion.div
            key="tickets"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <QrCode className="h-6 w-6 text-accent" />
                QR-Codes & Tickets
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-semibold text-accent">Ticket-Status prüfen:</h4>
                  <p className="text-sm text-gray-300">
                    Scanne deinen QR-Code oder gib deine Ticket-ID ein, um den aktuellen Status zu prüfen.
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span>Bestätigt - Ticket ist gültig</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                      <span>Ausstehend - Warte auf Bestätigung</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-2 w-2 rounded-full bg-red-500"></div>
                      <span>Abgelehnt - Ticket ist ungültig</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-accent">Verfügbare Aktionen:</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-accent" />
                      QR-Code scannen
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-accent" />
                      Ticket-ID eingeben
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-accent" />
                      Status-Update erhalten
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-accent" />
                      Support kontaktieren
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Default export for lazy loading
export default SupportPage;