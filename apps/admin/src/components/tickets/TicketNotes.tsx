import { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Edit2, Trash2, Search, X, Save } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useTicketNotes } from '../../lib/api/hooks';
import { useToast } from '../ui/Toast';
import { logger } from '../../lib/logger';
import { cn } from '../../utils/cn';

interface TicketNote {
  id: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

interface TicketNotesProps {
  ticketId: string;
  notes?: TicketNote[];
}

export const TicketNotes = memo(function TicketNotes({
  ticketId,
  notes: initialNotes = [],
}: TicketNotesProps) {
  const [notes, setNotes] = useState<TicketNote[]>(initialNotes);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [editNote, setEditNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { addNote, updateNote, deleteNote } = useTicketNotes();
  const toast = useToast();

  useEffect(() => {
    if (isAdding && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isAdding]);

  const filteredNotes = notes.filter((note) =>
    note.note.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const result = await addNote.mutateAsync({
        ticketId,
        note: newNote.trim(),
      });
      
      // Add note to local state (optimistic update)
      const newNoteObj: TicketNote = {
        id: result.data?.id || `note-${Date.now()}`,
        note: newNote.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setNotes([newNoteObj, ...notes]);
      setNewNote('');
      setIsAdding(false);
      toast.success('Notiz hinzugefügt', 'Die interne Notiz wurde erfolgreich gespeichert');
      logger.logUserAction('ticket_note_added', { ticketId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Hinzufügen der Notiz';
      logger.error('Failed to add note', error);
      toast.error('Fehler', errorMessage);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editNote.trim()) return;

    try {
      await updateNote.mutateAsync({
        ticketId,
        noteId,
        note: editNote.trim(),
      });
      
      setNotes(notes.map((n) =>
        n.id === noteId
          ? { ...n, note: editNote.trim(), updatedAt: new Date().toISOString() }
          : n
      ));
      setEditingId(null);
      setEditNote('');
      toast.success('Notiz aktualisiert', 'Die Notiz wurde erfolgreich aktualisiert');
      logger.logUserAction('ticket_note_updated', { ticketId, noteId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Aktualisieren der Notiz';
      logger.error('Failed to update note', error);
      toast.error('Fehler', errorMessage);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Möchten Sie diese Notiz wirklich löschen?')) return;

    try {
      await deleteNote.mutateAsync({
        ticketId,
        noteId,
      });
      
      setNotes(notes.filter((n) => n.id !== noteId));
      toast.success('Notiz gelöscht', 'Die Notiz wurde erfolgreich gelöscht');
      logger.logUserAction('ticket_note_deleted', { ticketId, noteId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Löschen der Notiz';
      logger.error('Failed to delete note', error);
      toast.error('Fehler', errorMessage);
    }
  };

  const startEditing = (note: TicketNote) => {
    setEditingId(note.id);
    setEditNote(note.note);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditNote('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted" />
          <h3 className="text-sm font-semibold text-text">Interne Notizen</h3>
          <Badge variant="outline" className="text-xs">
            {notes.length}
          </Badge>
        </div>
        {!isAdding && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="h-7 px-2 text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Hinzufügen
          </Button>
        )}
      </div>

      {/* Search */}
      {notes.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <Input
            type="text"
            placeholder="Notizen durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'pl-9',
              'bg-surface/50 border-white/10',
              'focus:border-accent/50 focus:ring-2 focus:ring-accent/20'
            )}
          />
        </div>
      )}

      {/* Add Note Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card
              variant="glassmorphic"
              className={cn(
                'p-4',
                'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
                'backdrop-blur-xl border border-white/10'
              )}
            >
              <Textarea
                ref={textareaRef}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Interne Notiz eingeben... (nur für Team sichtbar)"
                className={cn(
                  'min-h-[100px] mb-3',
                  'bg-surface/50 border-white/10',
                  'focus:border-accent/50 focus:ring-2 focus:ring-accent/20'
                )}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || addNote.isPending}
                  className="flex-1"
                >
                  <Save className="h-3.5 w-3.5 mr-2" />
                  Speichern
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAdding(false);
                    setNewNote('');
                  }}
                  className="flex-1"
                >
                  <X className="h-3.5 w-3.5 mr-2" />
                  Abbrechen
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted">
            {searchQuery ? 'Keine Notizen gefunden' : 'Noch keine Notizen'}
          </div>
        ) : (
          filteredNotes.map((note) => (
            <Card
              key={note.id}
              variant="glassmorphic"
              className={cn(
                'p-3',
                'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
                'backdrop-blur-xl border border-white/10',
                'hover:border-accent/30 transition-all duration-200'
              )}
            >
              {editingId === note.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    className={cn(
                      'min-h-[80px]',
                      'bg-surface/50 border-white/10',
                      'focus:border-accent/50 focus:ring-2 focus:ring-accent/20'
                    )}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdateNote(note.id)}
                      disabled={!editNote.trim() || updateNote.isPending}
                      className="flex-1"
                    >
                      <Save className="h-3.5 w-3.5 mr-2" />
                      Speichern
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelEditing}
                      className="flex-1"
                    >
                      <X className="h-3.5 w-3.5 mr-2" />
                      Abbrechen
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-text whitespace-pre-wrap">{note.note}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-xs text-muted">
                      {new Date(note.createdAt).toLocaleString('de-DE')}
                      {note.updatedAt !== note.createdAt && ' (bearbeitet)'}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(note)}
                        className="h-6 w-6 p-0"
                        title="Notiz bearbeiten"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                        className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        title="Notiz löschen"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
});

