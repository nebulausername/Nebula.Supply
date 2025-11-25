// 🏅 PRIZE MANAGEMENT - Vollständiges Preis-Management!

import { useState, useMemo } from 'react';
import { motion, Reorder } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Coins,
  Award,
  Save,
  X,
  Copy,
  Check
} from 'lucide-react';

const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export interface Prize {
  position: number;
  coins: number;
  premiumInvites?: number;
  exclusiveUpgrade?: string;
}

interface PrizeManagementProps {
  prizes: Prize[];
  onPrizesChange: (prizes: Prize[]) => void;
  contestType?: 'monthly' | 'weekly' | 'daily' | 'seasonal';
}

// 🏅 PRIZE MANAGEMENT - MAXIMIERT & PREMIUM!
export const PrizeManagement = ({ prizes, onPrizesChange, contestType = 'monthly' }: PrizeManagementProps) => {
  const [editingPrize, setEditingPrize] = useState<number | null>(null);
  const [newPrize, setNewPrize] = useState<Partial<Prize>>({
    position: prizes.length > 0 ? Math.max(...prizes.map(p => p.position)) + 1 : 1,
    coins: 0,
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Prize templates for quick setup
  const prizeTemplates = useMemo(() => {
    const templates = {
      monthly: [
        { position: 1, coins: 50000, premiumInvites: 10 },
        { position: 2, coins: 30000, premiumInvites: 5 },
        { position: 3, coins: 20000, premiumInvites: 3 },
        { position: 4, coins: 10000, premiumInvites: 2 },
        { position: 5, coins: 5000, premiumInvites: 1 },
        { position: 6, coins: 3000 },
        { position: 7, coins: 2000 },
        { position: 8, coins: 1000 },
        { position: 9, coins: 500 },
        { position: 10, coins: 300 },
      ],
      weekly: [
        { position: 1, coins: 10000, premiumInvites: 3 },
        { position: 2, coins: 6000, premiumInvites: 2 },
        { position: 3, coins: 4000, premiumInvites: 1 },
        { position: 4, coins: 2000 },
        { position: 5, coins: 1000 },
      ],
      daily: [
        { position: 1, coins: 2000, premiumInvites: 1 },
        { position: 2, coins: 1000 },
        { position: 3, coins: 500 },
      ],
      seasonal: [
        { position: 1, coins: 100000, premiumInvites: 20 },
        { position: 2, coins: 75000, premiumInvites: 15 },
        { position: 3, coins: 50000, premiumInvites: 10 },
        { position: 4, coins: 25000, premiumInvites: 5 },
        { position: 5, coins: 15000, premiumInvites: 3 },
        { position: 6, coins: 10000, premiumInvites: 2 },
        { position: 7, coins: 5000, premiumInvites: 1 },
        { position: 8, coins: 3000 },
        { position: 9, coins: 2000 },
        { position: 10, coins: 1000 },
      ],
    };
    return templates[contestType] || templates.monthly;
  }, [contestType]);

  const totalCoins = useMemo(() => prizes.reduce((sum, p) => sum + p.coins, 0), [prizes]);
  const totalPremiumInvites = useMemo(() => prizes.reduce((sum, p) => sum + (p.premiumInvites || 0), 0), [prizes]);

  const handleAddPrize = () => {
    if (!newPrize.position || !newPrize.coins) return;

    const prize: Prize = {
      position: newPrize.position,
      coins: newPrize.coins,
      premiumInvites: newPrize.premiumInvites,
      exclusiveUpgrade: newPrize.exclusiveUpgrade,
    };

    onPrizesChange([...prizes, prize].sort((a, b) => a.position - b.position));
    setNewPrize({ position: Math.max(...prizes.map(p => p.position), 0) + 1, coins: 0 });
    setShowAddForm(false);
  };

  const handleEditPrize = (index: number) => {
    setEditingPrize(index);
  };

  const handleSavePrize = (index: number, updatedPrize: Prize) => {
    const updated = [...prizes];
    updated[index] = updatedPrize;
    onPrizesChange(updated.sort((a, b) => a.position - b.position));
    setEditingPrize(null);
  };

  const handleDeletePrize = (index: number) => {
    if (!confirm(`Möchtest du den Preis für Platz ${prizes[index].position} wirklich löschen?`)) return;
    const updated = prizes.filter((_, i) => i !== index);
    onPrizesChange(updated);
  };

  const handleApplyTemplate = () => {
    if (!confirm('Möchtest du die Vorlage anwenden? Alle bestehenden Preise werden ersetzt.')) return;
    onPrizesChange([...prizeTemplates]);
    setShowTemplates(false);
  };

  const handleDuplicatePrize = (prize: Prize) => {
    const newPrize: Prize = {
      ...prize,
      position: Math.max(...prizes.map(p => p.position), 0) + 1,
    };
    onPrizesChange([...prizes, newPrize].sort((a, b) => a.position - b.position));
  };

  const sortedPrizes = useMemo(() => [...prizes].sort((a, b) => a.position - b.position), [prizes]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-400" />
            Preis-Verwaltung
          </h2>
          <p className="text-white/60 text-sm mt-1">
            {prizes.length} Preise · {totalCoins.toLocaleString()} Coins · {totalPremiumInvites} Premium Invites
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={() => setShowTemplates(true)}
            className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Copy className="w-4 h-4" />
            Vorlagen
          </motion.button>
          <motion.button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4" />
            Preis hinzufügen
          </motion.button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
          <div className="flex items-center gap-2 text-yellow-400 mb-2">
            <Award className="w-5 h-5" />
            <span className="text-sm font-medium">Gesamt Preise</span>
          </div>
          <div className="text-3xl font-bold text-white">{prizes.length}</div>
        </div>
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Coins className="w-5 h-5" />
            <span className="text-sm font-medium">Gesamt Coins</span>
          </div>
          <div className="text-3xl font-bold text-white">{totalCoins.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <Award className="w-5 h-5" />
            <span className="text-sm font-medium">Premium Invites</span>
          </div>
          <div className="text-3xl font-bold text-white">{totalPremiumInvites}</div>
        </div>
      </div>

      {/* Prize List */}
      <div className="space-y-2">
        {sortedPrizes.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-white/10 bg-white/5">
            <Award className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">Noch keine Preise hinzugefügt</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
            >
              Ersten Preis hinzufügen
            </button>
          </div>
        ) : (
          sortedPrizes.map((prize, index) => (
            <PrizeItem
              key={`${prize.position}-${index}`}
              prize={prize}
              index={index}
              isEditing={editingPrize === index}
              onEdit={() => handleEditPrize(index)}
              onSave={(updated) => handleSavePrize(index, updated)}
              onCancel={() => setEditingPrize(null)}
              onDelete={() => handleDeletePrize(index)}
              onDuplicate={() => handleDuplicatePrize(prize)}
            />
          ))
        )}
      </div>

      {/* Add Prize Form */}
      {showAddForm && (
        <AddPrizeForm
          newPrize={newPrize}
          onPrizeChange={setNewPrize}
          onSave={handleAddPrize}
          onCancel={() => {
            setShowAddForm(false);
            setNewPrize({ position: Math.max(...prizes.map(p => p.position), 0) + 1, coins: 0 });
          }}
        />
      )}

      {/* Template Modal */}
      {showTemplates && (
        <TemplateModal
          templates={prizeTemplates}
          onApply={handleApplyTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
};

// Prize Item Component
const PrizeItem = ({
  prize,
  index,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onDuplicate,
}: {
  prize: Prize;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (prize: Prize) => void;
  onCancel: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) => {
  const [editedPrize, setEditedPrize] = useState<Prize>(prize);

  if (isEditing) {
    return (
      <motion.div
        className="rounded-xl border-2 border-blue-500/50 bg-blue-500/10 p-4"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-white/60 mb-1 block">Platz</label>
            <input
              type="number"
              value={editedPrize.position}
              onChange={(e) => setEditedPrize({ ...editedPrize, position: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
            />
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">Coins</label>
            <input
              type="number"
              value={editedPrize.coins}
              onChange={(e) => setEditedPrize({ ...editedPrize, coins: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
            />
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">Premium Invites</label>
            <input
              type="number"
              value={editedPrize.premiumInvites || ''}
              onChange={(e) => setEditedPrize({ ...editedPrize, premiumInvites: parseInt(e.target.value) || undefined })}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
            />
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">Exclusive Upgrade</label>
            <input
              type="text"
              value={editedPrize.exclusiveUpgrade || ''}
              onChange={(e) => setEditedPrize({ ...editedPrize, exclusiveUpgrade: e.target.value || undefined })}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
              placeholder="Optional"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Abbrechen
          </button>
          <motion.button
            onClick={() => onSave(editedPrize)}
            className="px-4 py-2 rounded-lg bg-green-500 text-white font-bold flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Check className="w-4 h-4" />
            Speichern
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg",
            prize.position === 1 ? "bg-yellow-500/20 text-yellow-400" :
            prize.position === 2 ? "bg-gray-400/20 text-gray-400" :
            prize.position === 3 ? "bg-orange-500/20 text-orange-400" :
            "bg-white/10 text-white/60"
          )}>
            {prize.position}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="font-bold">{prize.coins.toLocaleString()} Coins</span>
              </div>
              {prize.premiumInvites && (
                <div className="flex items-center gap-2 text-white">
                  <Award className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold">{prize.premiumInvites} Premium Invites</span>
                </div>
              )}
              {prize.exclusiveUpgrade && (
                <div className="text-xs text-white/60 bg-blue-500/20 px-2 py-1 rounded">
                  {prize.exclusiveUpgrade}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={onDuplicate}
            className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Duplizieren"
          >
            <Copy className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={onEdit}
            className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Bearbeiten"
          >
            <Edit className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={onDelete}
            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Löschen"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// Add Prize Form
const AddPrizeForm = ({
  newPrize,
  onPrizeChange,
  onSave,
  onCancel,
}: {
  newPrize: Partial<Prize>;
  onPrizeChange: (prize: Partial<Prize>) => void;
  onSave: () => void;
  onCancel: () => void;
}) => {
  return (
    <motion.div
      className="rounded-xl border-2 border-green-500/50 bg-green-500/10 p-6"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5 text-green-400" />
        Neuen Preis hinzufügen
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="text-xs text-white/60 mb-1 block">Platz *</label>
          <input
            type="number"
            value={newPrize.position || ''}
            onChange={(e) => onPrizeChange({ ...newPrize, position: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
            placeholder="1"
          />
        </div>
        <div>
          <label className="text-xs text-white/60 mb-1 block">Coins *</label>
          <input
            type="number"
            value={newPrize.coins || ''}
            onChange={(e) => onPrizeChange({ ...newPrize, coins: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
            placeholder="0"
          />
        </div>
        <div>
          <label className="text-xs text-white/60 mb-1 block">Premium Invites</label>
          <input
            type="number"
            value={newPrize.premiumInvites || ''}
            onChange={(e) => onPrizeChange({ ...newPrize, premiumInvites: parseInt(e.target.value) || undefined })}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="text-xs text-white/60 mb-1 block">Exclusive Upgrade</label>
          <input
            type="text"
            value={newPrize.exclusiveUpgrade || ''}
            onChange={(e) => onPrizeChange({ ...newPrize, exclusiveUpgrade: e.target.value || undefined })}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
            placeholder="Optional"
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 mt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          Abbrechen
        </button>
        <motion.button
          onClick={onSave}
          disabled={!newPrize.position || !newPrize.coins}
          className="px-4 py-2 rounded-lg bg-green-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Hinzufügen
        </motion.button>
      </div>
    </motion.div>
  );
};

// Template Modal
const TemplateModal = ({
  templates,
  onApply,
  onClose,
}: {
  templates: Prize[];
  onApply: () => void;
  onClose: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        className="w-full max-w-2xl rounded-3xl border border-purple-500/30 bg-gradient-to-br from-gray-900 to-black p-8"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Preis-Vorlagen</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            ×
          </button>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {templates.map((prize, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold">
                  {prize.position}
                </div>
                <div>
                  <div className="text-white font-semibold">{prize.coins.toLocaleString()} Coins</div>
                  {prize.premiumInvites && (
                    <div className="text-sm text-white/60">{prize.premiumInvites} Premium Invites</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            Abbrechen
          </button>
          <motion.button
            onClick={onApply}
            className="px-6 py-3 rounded-lg bg-purple-500 text-white font-bold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Vorlage anwenden
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

