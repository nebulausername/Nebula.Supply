import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { categories, type TicketData } from './types';

interface TicketCreateProps {
  onSubmit: (ticket: TicketData) => void;
  onCancel: () => void;
  sessionId: string;
}

const TICKET_TEMPLATES = [
  {
    id: 'bug',
    name: 'Bug Report',
    subject: 'Bug gefunden',
    description: 'Beschreibe den Bug hier:\n\n1. Was ist passiert?\n2. Was sollte passieren?\n3. Schritte zum Reproduzieren:\n   - Schritt 1\n   - Schritt 2\n   - Schritt 3\n\nScreenshots oder weitere Informationen:',
    category: 'bug'
  },
  {
    id: 'feature',
    name: 'Feature Request',
    subject: 'Feature-Anfrage',
    description: 'Ich würde gerne folgendes Feature haben:\n\nBeschreibung:\n\nWarum ist das wichtig?\n\nVorschlag zur Umsetzung:',
    category: 'feature'
  },
  {
    id: 'question',
    name: 'Frage',
    subject: 'Frage',
    description: 'Ich habe eine Frage zu:\n\nMeine Frage:\n\nKontext:',
    category: 'question'
  },
  {
    id: 'account',
    name: 'Account Problem',
    subject: 'Account Problem',
    description: 'Ich habe ein Problem mit meinem Account:\n\nBeschreibung des Problems:\n\nWas habe ich bereits versucht?',
    category: 'account'
  }
];

export const TicketCreate = ({ onSubmit, onCancel, sessionId }: TicketCreateProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [userName, setUserName] = useState(localStorage.getItem('nebula_user_name') || '');
  const [userEmail, setUserEmail] = useState(localStorage.getItem('nebula_user_email') || '');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!ticketSubject || !ticketDescription || !selectedCategory) {
      alert('Bitte fülle alle Felder aus');
      return;
    }

    const category = categories.find(c => c.id === selectedCategory);
    const newTicket: TicketData = {
      id: `TK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      userId: sessionId,
      subject: ticketSubject,
      description: ticketDescription,
      status: 'open',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      category: category?.name,
      messages: [{
        id: `MSG-${Date.now()}`,
        text: ticketDescription,
        from: 'user',
        timestamp: new Date().toISOString(),
        senderName: userName || 'Anonymer Nutzer'
      }]
    };

    // Save user info
    if (userName) localStorage.setItem('nebula_user_name', userName);
    if (userEmail) localStorage.setItem('nebula_user_email', userEmail);

    onSubmit(newTicket);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-[#041612] via-[#03211A] to-[#020b0a] px-6 py-10 text-sm text-muted shadow-[0_40px_120px_rgba(11,247,188,0.22)]">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-[140px]" />
        <div className="pointer-events-none absolute right-[-10%] top-1/3 h-72 w-72 rounded-full bg-emerald-300/10 blur-[160px]" />
        
        <div className="relative z-10">
          <h2 className="text-4xl font-semibold tracking-tight text-text mb-6">Neues Ticket erstellen</h2>
        
          {/* Ticket Templates */}
          <div className="mb-6">
            <label className="block text-text font-semibold mb-3">Schnellvorlagen (optional)</label>
            <div className="flex flex-wrap gap-2">
              {TICKET_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    setTicketSubject(template.subject);
                    setTicketDescription(template.description);
                    const category = categories.find(c => c.id === template.category);
                    if (category) {
                      setSelectedCategory(category.id);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all touch-target ${
                    selectedTemplate === template.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-black/30 text-muted border border-white/10 hover:border-emerald-500/30'
                  }`}
                  aria-label={`Vorlage verwenden: ${template.name}`}
                  aria-pressed={selectedTemplate === template.id}
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>
        
          {/* Category Selection */}
          <div className="mb-8">
            <label className="block text-text font-semibold mb-4">Kategorie wählen *</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((category) => (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 ${
                    selectedCategory === category.id
                      ? `border-accent/40 bg-accent/10 shadow-[0_0_20px_rgba(11,247,188,0.2)]`
                      : 'border-white/10 bg-black/30 hover:border-accent/30 hover:bg-black/50'
                  }`}
                >
                  <div className="text-3xl mb-2">{category.icon}</div>
                  <div className="font-semibold text-sm text-text">{category.name}</div>
                  {selectedCategory === category.id && (
                    <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-accent animate-pulse" />
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* User Info (Optional) */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-text font-semibold mb-2">Name (optional)</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Dein Name"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-text font-semibold mb-2">E-Mail (optional)</label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="deine@email.com"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Subject */}
          <div className="mb-6">
            <label className="block text-text font-semibold mb-2">Betreff *</label>
            <input
              type="text"
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              placeholder="Kurze Beschreibung deines Anliegens"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-text font-semibold mb-2">Beschreibung *</label>
            <textarea
              value={ticketDescription}
              onChange={(e) => setTicketDescription(e.target.value)}
              placeholder="Beschreibe dein Anliegen so detailliert wie möglich..."
              rows={6}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none resize-none"
            />
          </div>

          {/* Info Box */}
          <div className="mb-6 rounded-2xl border border-accent/40 bg-accent/10 p-4">
            <p className="text-sm text-accent">
              🔒 <strong>100% Anonym:</strong> Du musst keine persönlichen Daten angeben. 
              Alle Tickets werden anonym verwaltet.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-accent to-emerald-400 text-black font-semibold py-4 rounded-2xl hover:shadow-[0_0_20px_rgba(11,247,188,0.3)] transition-all"
            >
              <Plus className="inline w-5 h-5 mr-2" />
              Ticket erstellen
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCancel}
              className="px-8 bg-black/30 text-text font-semibold py-4 rounded-2xl border border-white/10 hover:border-accent/30 hover:bg-black/50 transition-all"
            >
              Abbrechen
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
