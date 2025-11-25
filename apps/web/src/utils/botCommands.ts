// 🤖 Bot Command Handler für Telegram Integration
import { useNavigate } from "react-router-dom";
import { useToastStore } from "../store/toast";

export interface BotCommand {
  command: string;
  description: string;
  action: () => void;
  keywords: string[];
}

export const useBotCommands = () => {
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const commands: BotCommand[] = [
    {
      command: "zahlung",
      description: "Zahlungsinformationen anzeigen",
      keywords: ["zahlung", "payment", "bezahlung", "bitte zahlung"],
      action: () => {
        navigate("/support");
        addToast({
          type: "info",
          title: "Zahlungsinformationen",
          message: "Hier findest du alle verfügbaren Zahlungsmethoden"
        });
      }
    },
    {
      command: "tickets",
      description: "Ticket-Status prüfen",
      keywords: ["tickets", "ticket", "status", "tickets status"],
      action: () => {
        navigate("/support");
        addToast({
          type: "info", 
          title: "Ticket-System",
          message: "Hier kannst du deine Tickets verwalten und den Status prüfen"
        });
      }
    },
    {
      command: "verifizierung",
      description: "Verifizierungsprozess anzeigen",
      keywords: ["verifizierung", "verify", "handzeichen"],
      action: () => {
        navigate("/support");
        addToast({
          type: "info",
          title: "Verifizierung",
          message: "Hier findest du alle Informationen zur Verifizierung"
        });
      }
    },
    {
      command: "einladungen",
      description: "Einladungssystem anzeigen",
      keywords: ["einladungen", "invite", "ränge", "ranks"],
      action: () => {
        navigate("/affiliate");
        addToast({
          type: "info",
          title: "Einladungssystem",
          message: "Hier kannst du deine Einladungen verwalten und Ränge einsehen"
        });
      }
    },
    {
      command: "shop",
      description: "Zum Shop navigieren",
      keywords: ["shop", "kaufen", "produkte"],
      action: () => {
        navigate("/shop");
        addToast({
          type: "success",
          title: "Willkommen im Shop!",
          message: "Entdecke unsere neuesten Produkte"
        });
      }
    },
    {
      command: "drops",
      description: "Zu den Drops navigieren",
      keywords: ["drops", "neu", "exklusiv"],
      action: () => {
        navigate("/drops");
        addToast({
          type: "success",
          title: "Exklusive Drops!",
          message: "Schaue dir unsere neuesten Drops an"
        });
      }
    },
    {
      command: "profil",
      description: "Zum Profil navigieren",
      keywords: ["profil", "profile", "account"],
      action: () => {
        navigate("/profile");
        addToast({
          type: "info",
          title: "Dein Profil",
          message: "Verwalte deine Einstellungen und Daten"
        });
      }
    },
    {
      command: "hilfe",
      description: "Hilfe anzeigen",
      keywords: ["hilfe", "help", "faq", "support"],
      action: () => {
        navigate("/support");
        addToast({
          type: "info",
          title: "Hilfe & Support",
          message: "Hier findest du Antworten auf häufige Fragen"
        });
      }
    }
  ];

  const executeCommand = (input: string) => {
    const normalizedInput = input.toLowerCase().trim();
    
    // Find matching command
    const matchingCommand = commands.find(command =>
      command.keywords.some(keyword => 
        normalizedInput.includes(keyword)
      )
    );

    if (matchingCommand) {
      matchingCommand.action();
      return {
        success: true,
        command: matchingCommand.command,
        message: `✅ ${matchingCommand.description}`
      };
    }

    // No command found
    addToast({
      type: "warning",
      title: "Command nicht gefunden",
      message: "Versuche: 'hilfe', 'zahlung', 'tickets', 'shop' oder 'drops'"
    });

    return {
      success: false,
      message: "❌ Command nicht erkannt. Tippe 'hilfe' für verfügbare Befehle."
    };
  };

  const getAvailableCommands = () => {
    return commands.map(cmd => ({
      command: cmd.command,
      description: cmd.description,
      keywords: cmd.keywords
    }));
  };

  return {
    commands,
    executeCommand,
    getAvailableCommands
  };
};

// Re-export for backward compatibility
export { useTelegramIntegration as useTelegramWebApp } from './telegramIntegration';
