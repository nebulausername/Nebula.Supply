import { useEffect } from 'react';
import { useBotCommands } from '../utils/botCommands';

export const BotCommandHandler = () => {
  const { executeCommand } = useBotCommands();

  useEffect(() => {
    // Handle URL commands
    const handleUrlCommand = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const command = urlParams.get('command');
      if (command) {
        executeCommand(command);
        // Clean URL after command execution
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('command');
        window.history.replaceState({}, '', newUrl.toString());
      }
    };

    // Handle custom events from Telegram or other sources
    const handleCustomCommand = (event: CustomEvent) => {
      const result = executeCommand(event.detail.command);
      if (result.success) {
        console.log('Bot command executed:', result.message);
      }
    };

    // Handle keyboard shortcuts for commands
    const handleKeyboardCommand = (event: KeyboardEvent) => {
      // Check for specific command patterns
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'h':
            event.preventDefault();
            executeCommand('hilfe');
            break;
          case 's':
            event.preventDefault();
            executeCommand('shop');
            break;
          case 'd':
            event.preventDefault();
            executeCommand('drops');
            break;
          case 'p':
            event.preventDefault();
            executeCommand('profil');
            break;
        }
      }
    };

    // Initial URL command check
    handleUrlCommand();

    // Add event listeners
    window.addEventListener('bot-command', handleCustomCommand as EventListener);
    window.addEventListener('keydown', handleKeyboardCommand);

    return () => {
      window.removeEventListener('bot-command', handleCustomCommand as EventListener);
      window.removeEventListener('keydown', handleKeyboardCommand);
    };
  }, [executeCommand]);

  return null; // This component doesn't render anything
};




