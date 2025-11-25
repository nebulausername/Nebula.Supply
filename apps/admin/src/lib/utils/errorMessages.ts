// Enhanced error messages with solution suggestions

export interface ErrorSolution {
  title: string;
  description: string;
  actions: Array<{
    label: string;
    action: () => void | Promise<void>;
  }>;
}

export function getErrorSolution(error: any, context?: string): ErrorSolution | null {
  const status = error?.status || error?.response?.status;
  const message = error?.message || String(error);
  const code = error?.code;

  // Network errors
  if (
    !status ||
    message?.includes('fetch') ||
    message?.includes('network') ||
    message?.includes('Failed to fetch') ||
    message?.includes('NetworkError') ||
    message?.includes('Keine Internetverbindung')
  ) {
    return {
      title: 'Netzwerkfehler',
      description: 'Es konnte keine Verbindung zum Server hergestellt werden.',
      actions: [
        {
          label: 'Internetverbindung überprüfen',
          action: () => {
            if (typeof window !== 'undefined') {
              window.open('https://www.google.com', '_blank');
            }
          },
        },
        {
          label: 'Seite neu laden',
          action: () => {
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          },
        },
        {
          label: 'Cache leeren',
          action: async () => {
            if (typeof window !== 'undefined' && 'caches' in window) {
              const cacheNames = await caches.keys();
              await Promise.all(cacheNames.map(name => caches.delete(name)));
              window.location.reload();
            }
          },
        },
      ],
    };
  }

  // Authentication errors
  if (status === 401 || message?.includes('Authentifizierung') || message?.includes('Unauthorized')) {
    // Check if in demo mode
    const token = typeof window !== 'undefined' ? localStorage.getItem('nebula_access_token') : null;
    const isDemo = token?.startsWith('demo-') || false;
    
    return {
      title: 'Authentifizierungsfehler',
      description: isDemo 
        ? 'Deine Demo-Sitzung ist abgelaufen. Bitte melde dich erneut an.\n\nDemo-Zugangsdaten:\nEmail: admin@nebula.local\nPasswort: admin123'
        : 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',
      actions: [
        {
          label: 'Zur Anmeldung',
          action: () => {
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          },
        },
        {
          label: 'Seite neu laden',
          action: () => {
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          },
        },
      ],
    };
  }

  // Permission errors
  if (status === 403 || message?.includes('Berechtigung') || message?.includes('Forbidden')) {
    return {
      title: 'Berechtigungsfehler',
      description: 'Du hast keine Berechtigung für diese Aktion.',
      actions: [
        {
          label: 'Zum Dashboard',
          action: () => {
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            }
          },
        },
        {
          label: 'Support kontaktieren',
          action: () => {
            if (typeof window !== 'undefined') {
              window.open('mailto:support@nebula.supply', '_blank');
            }
          },
        },
      ],
    };
  }

  // Not found errors
  if (status === 404 || message?.includes('nicht gefunden') || message?.includes('Not Found')) {
    return {
      title: 'Ressource nicht gefunden',
      description: 'Die angeforderte Ressource existiert nicht oder wurde entfernt.',
      actions: [
        {
          label: 'Zurück',
          action: () => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              window.history.back();
            }
          },
        },
        {
          label: 'Zum Dashboard',
          action: () => {
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            }
          },
        },
      ],
    };
  }

  // Rate limiting
  if (status === 429 || message?.includes('rate limit') || message?.includes('zu viele Anfragen')) {
    return {
      title: 'Zu viele Anfragen',
      description: 'Bitte warte einen Moment, bevor du es erneut versuchst.',
      actions: [
        {
          label: 'In 30 Sekunden erneut versuchen',
          action: async () => {
            await new Promise(resolve => setTimeout(resolve, 30000));
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          },
        },
        {
          label: 'Später versuchen',
          action: () => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              window.history.back();
            }
          },
        },
      ],
    };
  }

  // Server errors
  if (status >= 500 || message?.includes('Serverfehler') || message?.includes('Internal Server Error')) {
    return {
      title: 'Serverfehler',
      description: 'Der Server hat einen Fehler verursacht. Unser Team wurde benachrichtigt.',
      actions: [
        {
          label: 'Erneut versuchen',
          action: () => {
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          },
        },
        {
          label: 'Später versuchen',
          action: () => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              window.history.back();
            }
          },
        },
        {
          label: 'Support kontaktieren',
          action: () => {
            if (typeof window !== 'undefined') {
              window.open('mailto:support@nebula.supply', '_blank');
            }
          },
        },
      ],
    };
  }

  // Timeout errors
  if (
    status === 408 ||
    message?.includes('timeout') ||
    message?.includes('Zeitüberschreitung') ||
    message?.includes('Request timeout')
  ) {
    return {
      title: 'Zeitüberschreitung',
      description: 'Die Anfrage hat zu lange gedauert. Bitte versuche es erneut.',
      actions: [
        {
          label: 'Erneut versuchen',
          action: () => {
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          },
        },
        {
          label: 'Verbindung überprüfen',
          action: () => {
            if (typeof window !== 'undefined') {
              window.open('https://www.google.com', '_blank');
            }
          },
        },
      ],
    };
  }

  // Generic error
  return {
    title: 'Ein Fehler ist aufgetreten',
    description: message || 'Ein unerwarteter Fehler ist aufgetreten.',
    actions: [
      {
        label: 'Erneut versuchen',
        action: () => {
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        },
      },
      {
        label: 'Zurück',
        action: () => {
          if (typeof window !== 'undefined' && window.history.length > 1) {
            window.history.back();
          }
        },
      },
    ],
  };
}

