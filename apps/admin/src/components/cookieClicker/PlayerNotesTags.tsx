import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tag, Plus, X, Edit, Trash2, Save, MessageSquare, Hash } from 'lucide-react';
import { getCookiePlayerNotes, addCookiePlayerNote, updateCookiePlayerNote, deleteCookiePlayerNote, getCookiePlayerTags, addCookiePlayerTag, removeCookiePlayerTag, type PlayerNote, type PlayerTag } from '../../lib/api/cookieClicker';
import { cn } from '../../utils/cn';

interface PlayerNotesTagsProps {
  userId: string;
}

const COMMON_TAGS = ['VIP', 'Suspicious', 'Whale', 'Active', 'Inactive', 'Cheater', 'Moderator', 'Beta Tester'];

export const PlayerNotesTags = ({ userId }: PlayerNotesTagsProps) => {
  const [notes, setNotes] = useState<PlayerNote[]>([]);
  const [tags, setTags] = useState<PlayerTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newTag, setNewTag] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [notesData, tagsData] = await Promise.all([
        getCookiePlayerNotes(userId),
        getCookiePlayerTags(userId)
      ]);
      setNotes(notesData);
      setTags(tagsData);
    } catch (error) {
      console.error('Failed to load notes and tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      const note = await addCookiePlayerNote(userId, newNote);
      setNotes(prev => [note, ...prev]);
      setNewNote('');
    } catch (error) {
      console.error('Failed to add note:', error);
      alert('Failed to add note');
    }
  };

  const handleUpdateNote = async (noteId: number) => {
    if (!editingNoteText.trim()) return;
    
    try {
      await updateCookiePlayerNote(noteId, editingNoteText);
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, note: editingNoteText, updatedAt: new Date().toISOString() } : n));
      setEditingNoteId(null);
      setEditingNoteText('');
    } catch (error) {
      console.error('Failed to update note:', error);
      alert('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await deleteCookiePlayerNote(noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (error) {
      console.error('Failed to delete note:', error);
      alert('Failed to delete note');
    }
  };

  const handleAddTag = async (tag: string) => {
    if (!tag.trim()) return;
    
    try {
      const newTagData = await addCookiePlayerTag(userId, tag);
      setTags(prev => [...prev, newTagData]);
      setNewTag('');
      setShowTagInput(false);
    } catch (error) {
      console.error('Failed to add tag:', error);
      alert('Failed to add tag');
    }
  };

  const handleRemoveTag = async (tag: string) => {
    try {
      await removeCookiePlayerTag(userId, tag);
      setTags(prev => prev.filter(t => t.tag !== tag));
    } catch (error) {
      console.error('Failed to remove tag:', error);
      alert('Failed to remove tag');
    }
  };

  const startEditingNote = (note: PlayerNote) => {
    setEditingNoteId(note.id);
    setEditingNoteText(note.note);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  const getTagColor = (tag: string): string => {
    const tagLower = tag.toLowerCase();
    if (tagLower.includes('vip')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (tagLower.includes('suspicious') || tagLower.includes('cheater')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (tagLower.includes('whale')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (tagLower.includes('active')) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (tagLower.includes('inactive')) return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="inline-block w-6 h-6 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-2" />
          <p className="text-sm text-gray-400">Loading notes and tags...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tags Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-white flex items-center gap-2">
            <Hash className="w-5 h-5 text-orange-400" />
            Tags ({tags.length})
          </h4>
          {!showTagInput && (
            <button
              onClick={() => setShowTagInput(true)}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Tag
            </button>
          )}
        </div>

        {/* Add Tag Input */}
        {showTagInput && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700"
          >
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTag(newTag);
                  } else if (e.key === 'Escape') {
                    setShowTagInput(false);
                    setNewTag('');
                  }
                }}
                placeholder="Enter tag name..."
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                autoFocus
              />
              <button
                onClick={() => handleAddTag(newTag)}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowTagInput(false);
                  setNewTag('');
                }}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
            <div className="text-xs text-gray-400 mb-2">Common tags:</div>
            <div className="flex flex-wrap gap-2">
              {COMMON_TAGS.filter(tag => !tags.some(t => t.tag.toLowerCase() === tag.toLowerCase())).map(tag => (
                <button
                  key={tag}
                  onClick={() => handleAddTag(tag)}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tags List */}
        {tags.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">
            <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No tags assigned</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <motion.div
                key={tag.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm",
                  getTagColor(tag.tag)
                )}
              >
                <span>{tag.tag}</span>
                <button
                  onClick={() => handleRemoveTag(tag.tag)}
                  className="p-0.5 hover:bg-black/20 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-orange-400" />
            Notes ({notes.length})
          </h4>
        </div>

        {/* Add Note Input */}
        <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note about this player..."
            rows={3}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500 resize-none"
          />
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Note
            </button>
          </div>
        </div>

        {/* Notes List */}
        {notes.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No notes yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
              >
                {editingNoteId === note.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editingNoteText}
                      onChange={(e) => setEditingNoteText(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500 resize-none"
                      autoFocus
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={cancelEditing}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdateNote(note.id)}
                        disabled={!editingNoteText.trim()}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm transition-colors flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-white text-sm whitespace-pre-wrap mb-2">{note.note}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>
                        {new Date(note.createdAt).toLocaleString()}
                        {note.updatedAt !== note.createdAt && (
                          <span className="ml-2">(edited)</span>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditingNote(note)}
                          className="p-1 hover:bg-slate-700 rounded transition-colors"
                          title="Edit note"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 hover:bg-slate-700 rounded transition-colors"
                          title="Delete note"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

