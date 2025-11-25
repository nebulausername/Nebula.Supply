import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Ticket, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import type { TicketData } from './types';

interface SupportMetricsProps {
  tickets: TicketData[];
}

export const SupportMetrics = ({ tickets }: SupportMetricsProps) => {
  const [metrics, setMetrics] = useState({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    doneTickets: 0,
    totalMessages: 0,
    averageResponseTime: 0,
    categories: {} as Record<string, number>
  });

  useEffect(() => {
    const totalTickets = tickets.length;
    const openTickets = tickets.filter(t => t.status === 'open').length;
    const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
    const doneTickets = tickets.filter(t => t.status === 'done').length;
    const totalMessages = tickets.reduce((sum, t) => sum + t.messages.length, 0);
    
    // Calculate average response time (simulated)
    const averageResponseTime = tickets.length > 0 ? 
      Math.round(Math.random() * 120 + 30) : 0; // 30-150 minutes
    
    // Count by category
    const categories = tickets.reduce((acc, ticket) => {
      const category = ticket.category || 'Sonstiges';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setMetrics({
      totalTickets,
      openTickets,
      inProgressTickets,
      doneTickets,
      totalMessages,
      averageResponseTime,
      categories
    });
  }, [tickets]);

  const metricCards = [
    {
      title: 'Gesamt Tickets',
      value: metrics.totalTickets,
      icon: Ticket,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      title: 'Offen',
      value: metrics.openTickets,
      icon: AlertCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    {
      title: 'In Bearbeitung',
      value: metrics.inProgressTickets,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20'
    },
    {
      title: 'Erledigt',
      value: metrics.doneTickets,
      icon: CheckCircle,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    },
    {
      title: 'Nachrichten',
      value: metrics.totalMessages,
      icon: MessageSquare,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    {
      title: 'Ø Antwortzeit',
      value: `${metrics.averageResponseTime}min`,
      icon: Zap,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-2xl border ${card.borderColor} ${card.bgColor} p-4`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${card.color}`} />
                <span className="text-xs text-muted">{card.title}</span>
              </div>
              <div className={`text-2xl font-bold ${card.color}`}>
                {card.value}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Category Breakdown */}
      {Object.keys(metrics.categories).length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
          <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Tickets nach Kategorie
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(metrics.categories).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm text-muted">{category}</span>
                <span className="text-sm font-semibold text-text">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Insights */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
          <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Support Performance
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Lösungsrate</span>
              <span className="text-sm font-semibold text-emerald-400">
                {metrics.totalTickets > 0 ? Math.round((metrics.doneTickets / metrics.totalTickets) * 100) : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Aktive Tickets</span>
              <span className="text-sm font-semibold text-yellow-400">
                {metrics.openTickets + metrics.inProgressTickets}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Ø Nachrichten/Ticket</span>
              <span className="text-sm font-semibold text-blue-400">
                {metrics.totalTickets > 0 ? Math.round(metrics.totalMessages / metrics.totalTickets) : 0}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
          <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            <div className="text-sm text-muted">
              💡 <strong>Tipp:</strong> Nutze die Suchfunktion um Tickets schnell zu finden
            </div>
            <div className="text-sm text-muted">
              📱 <strong>Mobile:</strong> Alle Features sind touch-optimiert
            </div>
            <div className="text-sm text-muted">
              🔒 <strong>Sicher:</strong> 100% anonyme Kommunikation
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};