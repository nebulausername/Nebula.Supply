// 🎯 Command Palette Component for Admin Dashboard
import { motion, AnimatePresence } from "framer-motion";
import { Search, Command } from "lucide-react";
import { useCommandPalette } from "../hooks/useKeyboardShortcuts";
import { springConfigs } from "../utils/springConfigs";

export const CommandPalette = () => {
  const {
    isOpen,
    query,
    setQuery,
    selectedIndex,
    filteredCommands,
    closePalette,
    executeCommand
  } = useCommandPalette();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={springConfigs.gentle}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={closePalette}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Command Palette */}
        <motion.div
          className="relative w-full max-w-2xl mx-4"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={springConfigs.smooth}
        >
          <div className="glass rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 p-4 border-b border-white/10">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
                autoFocus
              />
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
            </div>

            {/* Commands List */}
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {filteredCommands.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No commands found</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </div>
              ) : (
                <div className="py-2">
                  {filteredCommands.map((command, index) => (
                    <motion.button
                      key={command.id}
                      onClick={() => executeCommand(command)}
                      className={`w-full px-4 py-3 text-left transition-colors ${
                        index === selectedIndex
                          ? 'bg-accent/20 text-accent'
                          : 'text-gray-300 hover:bg-white/5'
                      }`}
                      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{command.label}</span>
                        {index === selectedIndex && (
                          <motion.div
                            className="w-2 h-2 bg-accent rounded-full"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={springConfigs.bouncy}
                          />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-white/10 bg-black/20">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-white/10 rounded text-xs">↑</kbd>
                    <kbd className="px-1 py-0.5 bg-white/10 rounded text-xs">↓</kbd>
                    <span>Navigate</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-white/10 rounded text-xs">Enter</kbd>
                    <span>Select</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-white/10 rounded text-xs">Esc</kbd>
                    <span>Close</span>
                  </span>
                </div>
                <span>{filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};




