// 🤖 Bot Command Handler für direkte URL-Integration
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../store/toast';

export interface BotCommandResult {
  success: boolean;
  message: string;
  action?: () => void;
}

export const useBotCommandHandler = () => {
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const executeCommand = (command: string): BotCommandResult => {
    const normalizedCommand = command.toLowerCase().trim();
    
    // Payment commands
    if (normalizedCommand.includes('zahlung') || normalizedCommand.includes('payment') || normalizedCommand.includes('bitte zahlung')) {
      return {
        success: true,
        message: 'Zahlungsinformationen werden geladen...',
        action: () => {
          navigate('/support?command=zahlung');
          addToast({
            type: 'info',
            title: 'Zahlungsinformationen',
            message: 'Hier findest du alle verfügbaren Zahlungsmethoden'
          });
        }
      };
    }
    
    // Ticket commands
    if (normalizedCommand.includes('ticket') || normalizedCommand.includes('tickets') || normalizedCommand.includes('tickets status')) {
      return {
        success: true,
        message: 'Ticket-Status wird geladen...',
        action: () => {
          navigate('/support?command=tickets');
          addToast({
            type: 'info',
            title: 'Ticket-System',
            message: 'Hier kannst du deine Tickets verwalten und den Status prüfen'
          });
        }
      };
    }
    
    // Verification commands
    if (normalizedCommand.includes('verifizierung') || normalizedCommand.includes('verify') || normalizedCommand.includes('handzeichen')) {
      return {
        success: true,
        message: 'Verifizierungsinformationen werden geladen...',
        action: () => {
          navigate('/support?command=verifizierung');
          addToast({
            type: 'info',
            title: 'Verifizierung',
            message: 'Hier findest du alle Informationen zur Verifizierung'
          });
        }
      };
    }
    
    // Invitation commands
    if (normalizedCommand.includes('einladung') || normalizedCommand.includes('invite') || normalizedCommand.includes('ränge') || normalizedCommand.includes('ranks')) {
      return {
        success: true,
        message: 'Einladungssystem wird geladen...',
        action: () => {
          navigate('/affiliate?command=einladungen');
          addToast({
            type: 'info',
            title: 'Einladungssystem',
            message: 'Hier kannst du deine Einladungen verwalten und Ränge einsehen'
          });
        }
      };
    }
    
    // Shop commands
    if (normalizedCommand.includes('shop') || normalizedCommand.includes('kaufen') || normalizedCommand.includes('produkte')) {
      return {
        success: true,
        message: 'Shop wird geladen...',
        action: () => {
          navigate('/shop?command=shop');
          addToast({
            type: 'success',
            title: 'Willkommen im Shop!',
            message: 'Entdecke unsere neuesten Produkte'
          });
        }
      };
    }
    
    // Drops commands
    if (normalizedCommand.includes('drop') || normalizedCommand.includes('drops') || normalizedCommand.includes('neu') || normalizedCommand.includes('exklusiv')) {
      return {
        success: true,
        message: 'Drops werden geladen...',
        action: () => {
          navigate('/drops?command=drops');
          addToast({
            type: 'success',
            title: 'Exklusive Drops!',
            message: 'Schaue dir unsere neuesten Drops an'
          });
        }
      };
    }
    
    // Profile commands
    if (normalizedCommand.includes('profil') || normalizedCommand.includes('profile') || normalizedCommand.includes('account')) {
      return {
        success: true,
        message: 'Profil wird geladen...',
        action: () => {
          navigate('/profile?command=profil');
          addToast({
            type: 'info',
            title: 'Dein Profil',
            message: 'Verwalte deine Einstellungen und Daten'
          });
        }
      };
    }
    
    // Help commands
    if (normalizedCommand.includes('hilfe') || normalizedCommand.includes('help') || normalizedCommand.includes('faq') || normalizedCommand.includes('support')) {
      return {
        success: true,
        message: 'Hilfe wird geladen...',
        action: () => {
          navigate('/support?command=hilfe');
          addToast({
            type: 'info',
            title: 'Hilfe & Support',
            message: 'Hier findest du Antworten auf häufige Fragen'
          });
        }
      };
    }
    
    // No command found
    return {
      success: false,
      message: 'Command nicht gefunden. Verfügbare Befehle: zahlung, tickets, shop, drops, profil, hilfe'
    };
  };

  return { executeCommand };
};




