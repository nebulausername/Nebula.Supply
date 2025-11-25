import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  MessageSquare, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react';

interface QuickActionsProps {
  onNewTicket: () => void;
  onSearch: () => void;
  onFilter: () => void;
  totalTickets: number;
  openTickets: number;
}

export const QuickActions = ({ 
  onNewTicket, 
  onSearch, 
  onFilter, 
  totalTickets, 
  openTickets 
}: QuickActionsProps) => {
  const actions = [
    {
      title: 'Neues Ticket',
      description: 'Support-Anfrage erstellen',
      icon: Plus,
      onClick: onNewTicket,
      color: 'from-accent to-emerald-400',
      bgColor: 'bg-accent/10',
      borderColor: 'border-accent/30'
    },
    {
      title: 'Suchen',
      description: 'Tickets durchsuchen',
      icon: Search,
      onClick: onSearch,
      color: 'from-blue-500 to-cyan-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30'
    },
    {
      title: 'Filter',
      description: 'Nach Status filtern',
      icon: Filter,
      onClick: onFilter,
      color: 'from-purple-500 to-pink-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30'
    }
  ];

  const stats = [
    {
      label: 'Gesamt',
      value: totalTickets,
      icon: MessageSquare,
      color: 'text-blue-400'
    },
    {
      label: 'Offen',
      value: openTickets,
      icon: AlertCircle,
      color: 'text-green-400'
    },
    {
      label: 'Schnell',
      value: '< 2h',
      icon: Zap,
      color: 'text-yellow-400'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={action.onClick}
              className={`group relative overflow-hidden rounded-2xl border ${action.borderColor} ${action.bgColor} p-6 transition-all duration-300 hover:shadow-lg`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${action.color} text-black`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-text group-hover:text-accent transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-muted">
                    {action.description}
                  </p>
                </div>
              </div>
              
              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </motion.button>
          );
        })}
      </div>

      {/* Stats Overview */}
      <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
        <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Support Übersicht
        </h3>
        
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-2`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                  {stat.value}
                </div>
                <div className="text-xs text-muted">
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Tips & Tricks */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <h4 className="font-semibold text-emerald-400 mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Pro Tipp
          </h4>
          <p className="text-sm text-emerald-200">
            Nutze aussagekräftige Betreffzeilen für schnellere Hilfe. 
            Screenshots können als Text-Beschreibung hinzugefügt werden.
          </p>
        </div>
        
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
          <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Schnellhilfe
          </h4>
          <p className="text-sm text-blue-200">
            FAQ durchsuchen vor Ticket-Erstellung. 
            Häufige Fragen werden oft sofort beantwortet.
          </p>
        </div>
      </div>
    </div>
  );
};

