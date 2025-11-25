import { motion } from 'framer-motion';
import { Ticket, Clock, MessageSquare, ChevronRight, Search, Filter, AlertCircle, CheckCircle } from 'lucide-react';
import type { TicketData, TicketStatus } from './types';
import { cn } from '../../utils/cn';

const statusConfig = {
  open: { label: 'Offen', color: 'bg-green-500', icon: AlertCircle },
  in_progress: { label: 'In Bearbeitung', color: 'bg-yellow-500', icon: Clock },
  waiting: { label: 'Wartet', color: 'bg-orange-500', icon: Clock },
  done: { label: 'Erledigt', color: 'bg-blue-500', icon: CheckCircle }
};

const priorityConfig = {
  low: { label: 'Niedrig', color: 'text-gray-400' },
  medium: { label: 'Mittel', color: 'text-yellow-400' },
  high: { label: 'Hoch', color: 'text-orange-400' },
  critical: { label: 'Kritisch', color: 'text-red-400' }
};

const categories = [
  { id: 'order', name: 'Bestellung', icon: '🛒' },
  { id: 'payment', name: 'Zahlung', icon: '💳' },
  { id: 'shipping', name: 'Versand', icon: '📦' },
  { id: 'return', name: 'Rückgabe', icon: '🔄' },
  { id: 'technical', name: 'Technisch', icon: '🐛' },
  { id: 'other', name: 'Sonstiges', icon: '💬' }
];

interface TicketListProps {
  tickets: TicketData[];
  onSelectTicket: (ticket: TicketData) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterStatus: string;
  onFilterChange: (status: string) => void;
}

export const TicketList = ({
  tickets,
  onSelectTicket,
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange
}: TicketListProps) => {
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || ticket.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <section className="space-y-4">
      {/* Search & Filter */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Suche nach Ticket-ID oder Betreff"
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none md:max-w-lg"
        />
        <select
          value={filterStatus}
          onChange={(e) => onFilterChange(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-text focus:border-accent focus:outline-none md:w-auto"
        >
          <option value="all">Alle Tickets</option>
          <option value="open">Offen</option>
          <option value="in_progress">In Bearbeitung</option>
          <option value="waiting">Wartet</option>
          <option value="done">Erledigt</option>
        </select>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-muted">
          {tickets.length === 0 
            ? 'Noch keine Tickets vorhanden. Erstelle dein erstes Ticket!' 
            : 'Keine Tickets gefunden.'}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredTickets.map((ticket, index) => {
            const category = categories.find(c => c.name === ticket.category);
            const StatusIcon = statusConfig[ticket.status].icon;
            
            return (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => onSelectTicket(ticket)}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-6 transition-all duration-300 hover:border-accent/40 hover:bg-black/50 hover:shadow-[0_0_20px_rgba(11,247,188,0.1)] cursor-pointer"
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[ticket.status].color} text-white`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig[ticket.status].label}
                  </span>
                </div>

                {/* Category Icon */}
                {category && (
                  <div className="mb-4 text-3xl">{category.icon}</div>
                )}

                {/* Ticket ID and Channel */}
                <div className="mb-2 flex items-center gap-2">
                  <div className="text-xs font-mono text-muted">{ticket.id}</div>
                  {(ticket as any).channel && (
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      (ticket as any).channel === 'telegram' 
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    )}>
                      {(ticket as any).channel === 'telegram' ? '📱 Telegram' : '🌐 Web'}
                    </span>
                  )}
                </div>
                
                {/* Subject */}
                <h3 className="mb-3 text-lg font-semibold text-text group-hover:text-accent transition-colors">
                  {ticket.subject}
                </h3>
                
                {/* Description */}
                <p className="mb-4 text-sm text-muted line-clamp-2">
                  {ticket.description}
                </p>
                
                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs text-muted">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(ticket.createdAt).toLocaleDateString('de-DE')}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {ticket.messages.length}
                    </span>
                  </div>
                  <span className={priorityConfig[ticket.priority].color}>
                    ⚡ {priorityConfig[ticket.priority].label}
                  </span>
                </div>

                {/* Hover Arrow */}
                <ChevronRight className="absolute bottom-4 right-4 w-4 h-4 text-muted group-hover:text-accent group-hover:translate-x-1 transition-all" />
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
};