import { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, X, Copy, Check, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';
import type { TicketCategory } from '@nebula/shared/types';

interface ReplyTemplate {
  id: string;
  name: string;
  content: string;
  category?: TicketCategory;
  tags?: string[];
  variables?: string[];
}

interface ReplyTemplatesProps {
  onSelect: (template: ReplyTemplate) => void;
  onClose?: () => void;
}

// Default templates
const defaultTemplates: ReplyTemplate[] = [
  {
    id: 'greeting',
    name: 'Begrüßung',
    content: 'Hallo {{customer_name}},\n\nvielen Dank für Ihre Anfrage. Wir bearbeiten Ihr Anliegen schnellstmöglich.\n\nMit freundlichen Grüßen\n{{agent_name}}',
    category: 'support',
    variables: ['customer_name', 'agent_name'],
  },
  {
    id: 'order-status',
    name: 'Bestellstatus',
    content: 'Hallo {{customer_name}},\n\nvielen Dank für Ihre Anfrage zu Ihrer Bestellung {{order_id}}.\n\nAktueller Status: {{order_status}}\n\nBei weiteren Fragen stehen wir Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen\n{{agent_name}}',
    category: 'order',
    variables: ['customer_name', 'order_id', 'order_status', 'agent_name'],
  },
  {
    id: 'shipping-delay',
    name: 'Lieferverzögerung',
    content: 'Hallo {{customer_name}},\n\nleider gibt es eine Verzögerung bei der Lieferung Ihrer Bestellung {{order_id}}.\n\nGrund: {{delay_reason}}\n\nErwartetes Lieferdatum: {{new_date}}\n\nWir entschuldigen uns für die Unannehmlichkeiten.\n\nMit freundlichen Grüßen\n{{agent_name}}',
    category: 'shipping',
    variables: ['customer_name', 'order_id', 'delay_reason', 'new_date', 'agent_name'],
  },
  {
    id: 'payment-received',
    name: 'Zahlung erhalten',
    content: 'Hallo {{customer_name}},\n\nvielen Dank! Wir haben Ihre Zahlung erhalten.\n\nBestellung: {{order_id}}\nBetrag: {{amount}}\n\nIhre Bestellung wird nun bearbeitet.\n\nMit freundlichen Grüßen\n{{agent_name}}',
    category: 'payment',
    variables: ['customer_name', 'order_id', 'amount', 'agent_name'],
  },
  {
    id: 'issue-resolved',
    name: 'Problem gelöst',
    content: 'Hallo {{customer_name}},\n\nwir haben Ihr Problem behoben.\n\nLösung: {{solution}}\n\nBitte bestätigen Sie, ob alles funktioniert. Bei weiteren Fragen stehen wir Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen\n{{agent_name}}',
    category: 'support',
    variables: ['customer_name', 'solution', 'agent_name'],
  },
  {
    id: 'refund-processed',
    name: 'Rückerstattung bearbeitet',
    content: 'Hallo {{customer_name}},\n\nIhre Rückerstattung wurde bearbeitet.\n\nBetrag: {{amount}}\nErwartete Gutschrift: {{refund_date}}\n\nBei Fragen stehen wir Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen\n{{agent_name}}',
    category: 'billing',
    variables: ['customer_name', 'amount', 'refund_date', 'agent_name'],
  },
];

export const ReplyTemplates = memo(function ReplyTemplates({ onSelect, onClose }: ReplyTemplatesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | 'all'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set<TicketCategory>();
    defaultTemplates.forEach(t => t.category && cats.add(t.category));
    return Array.from(cats);
  }, []);

  const filteredTemplates = useMemo(() => {
    return defaultTemplates.filter(template => {
      const matchesSearch = !searchQuery || 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleCopy = async (template: ReplyTemplate) => {
    await navigator.clipboard.writeText(template.content);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelect = (template: ReplyTemplate) => {
    onSelect(template);
    onClose?.();
  };

  return (
    <Card
      variant="glassmorphic"
      className={cn(
        'p-4',
        'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
        'backdrop-blur-xl border border-white/10'
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-text">Reply Templates</h3>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <Input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-surface/50 border-white/10"
        />
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
          className="h-7 text-xs"
        >
          All
        </Button>
        {categories.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="h-7 text-xs capitalize"
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Templates List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        <AnimatePresence>
          {filteredTemplates.length === 0 ? (
            <div className="text-center text-muted py-8">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No templates found</p>
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  'p-3 rounded-lg border border-white/10',
                  'bg-surface/30 hover:bg-surface/50',
                  'transition-all duration-200 cursor-pointer',
                  'hover:border-accent/30 hover:shadow-md'
                )}
                onClick={() => handleSelect(template)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-text">{template.name}</h4>
                      {template.category && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {template.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted line-clamp-2">
                      {template.content.split('\n')[0]}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(template);
                    }}
                    className="h-7 w-7 p-0"
                  >
                    {copiedId === template.id ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {template.variables && template.variables.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap mt-2">
                    <span className="text-xs text-muted">Variables:</span>
                    {template.variables.map(variable => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
});


