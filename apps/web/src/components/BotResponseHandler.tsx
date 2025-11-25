import { useEffect } from 'react';
import { useBotCommands } from '../utils/botCommands';
import { useToastStore } from '../store/toast';

export const BotResponseHandler = () => {
  const { executeCommand } = useBotCommands();
  const { addToast } = useToastStore();

  useEffect(() => {
    // Handle bot responses from URL parameters
    const handleUrlCommands = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const command = urlParams.get('command');
      const message = urlParams.get('message');
      
      if (command) {
        const result = executeCommand(command);
        
        if (result.success) {
          addToast({
            type: 'success',
            title: 'Bot Command',
            message: result.message
          });
        } else {
          addToast({
            type: 'warning',
            title: 'Command nicht gefunden',
            message: result.message
          });
        }
        
        // Clean URL after processing
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('command');
        newUrl.searchParams.delete('message');
        window.history.replaceState({}, '', newUrl.toString());
      }
      
      if (message) {
        addToast({
          type: 'info',
          title: 'Bot Nachricht',
          message: decodeURIComponent(message)
        });
        
        // Clean URL after processing
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('message');
        window.history.replaceState({}, '', newUrl.toString());
      }
    };

    // Handle custom bot events
    const handleBotEvent = (event: CustomEvent) => {
      const { type, data } = event.detail;
      
      switch (type) {
        case 'command':
          const result = executeCommand(data.command);
          if (result.success) {
            addToast({
              type: 'success',
              title: 'Bot Command',
              message: result.message
            });
          }
          break;
          
        case 'message':
          addToast({
            type: 'info',
            title: 'Bot Nachricht',
            message: data.message
          });
          break;
          
        case 'error':
          addToast({
            type: 'error',
            title: 'Bot Fehler',
            message: data.message
          });
          break;
          
        case 'success':
          addToast({
            type: 'success',
            title: 'Bot Erfolg',
            message: data.message
          });
          break;
      }
    };

    // Handle keyboard shortcuts for bot commands
    const handleKeyboardShortcuts = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + B for bot help
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        executeCommand('hilfe');
      }
      
      // Ctrl/Cmd + Shift + S for shop
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        executeCommand('shop');
      }
      
      // Ctrl/Cmd + Shift + D for drops
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        executeCommand('drops');
      }
    };

    // Initial URL command processing
    handleUrlCommands();

    // Add event listeners
    window.addEventListener('bot-response', handleBotEvent as EventListener);
    window.addEventListener('keydown', handleKeyboardShortcuts);

    return () => {
      window.removeEventListener('bot-response', handleBotEvent as EventListener);
      window.removeEventListener('keydown', handleKeyboardShortcuts);
    };
  }, [executeCommand, addToast]);

  return null; // This component doesn't render anything
};




