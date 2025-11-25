import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/auth';
import { useToastStore } from '../store/toast';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../utils/cn';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

declare global {
  interface Window {
    Telegram?: any; // Use any to avoid conflicts with detailed type definitions
    onTelegramAuth?: (user: TelegramUser) => void;
  }
}

interface TelegramLoginButtonProps {
  botUsername?: string;
  buttonSize?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  requestAccess?: 'write' | '';
  usePic?: boolean;
  dataOnauth?: string;
  className?: string;
}

type ErrorState = {
  message: string;
  type: 'error' | 'warning' | 'info';
} | null;

export const TelegramLoginButton = ({
  botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'NebulaOrderBot',
  buttonSize = 'large',
  cornerRadius = 20,
  requestAccess = 'write',
  usePic = true,
  className = ''
}: TelegramLoginButtonProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState<ErrorState>(null);
  const [successState, setSuccessState] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    // Define global callback
    window.onTelegramAuth = async (user: TelegramUser) => {
      setIsLoading(true);
      setErrorState(null);
      setSuccessState(false);
      
      try {
        // Validate user data
        if (!user.id || !user.first_name || !user.auth_date || !user.hash) {
          throw new Error('Ungültige Telegram-Daten. Bitte versuche es erneut.');
        }

        // Build initData string (Telegram.WebApp format)
        const params = new URLSearchParams({
          id: user.id.toString(),
          first_name: user.first_name,
          ...(user.last_name && { last_name: user.last_name }),
          ...(user.username && { username: user.username }),
          ...(user.photo_url && { photo_url: user.photo_url }),
          auth_date: user.auth_date.toString(),
          hash: user.hash
        });

        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/telegram/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: params.toString() })
        });

        const data = await response.json();

        if (!response.ok) {
          // Spezifische Fehlermeldungen basierend auf Status Code
          let errorMessage = 'Login fehlgeschlagen';
          
          if (response.status === 401) {
            errorMessage = 'Ungültige Authentifizierung. Bitte melde dich erneut im Telegram Bot an.';
          } else if (response.status === 403) {
            errorMessage = 'Zugriff verweigert. Stelle sicher, dass du einen gültigen Invite-Code hast.';
          } else if (response.status === 429) {
            errorMessage = 'Zu viele Versuche. Bitte warte einen Moment und versuche es erneut.';
          } else if (response.status >= 500) {
            errorMessage = 'Server-Fehler. Bitte versuche es später erneut.';
          } else if (data.error) {
            errorMessage = data.error;
          }
          
          throw new Error(errorMessage);
        }

        // Store token and telegramId
        localStorage.setItem('telegram_token', data.data.token);
        localStorage.setItem('telegram_id', data.data.user.telegramId.toString());

        // Update auth store (convert to UserProfile format)
        setUser({
          id: `tg:${data.data.user.telegramId}`,
          email: `${data.data.user.telegramId}@telegram.user`, // dummy
          username: data.data.user.username || data.data.user.firstName || `user${data.data.user.telegramId}`,
          inviteCode: null // will be populated later if needed
        });

        // Success State
        setSuccessState(true);
        
        addToast({
          type: 'success',
          title: `Willkommen, ${data.data.user.firstName || 'User'}! 🎉`
        });

        // Reset success state after 3 seconds
        setTimeout(() => {
          setSuccessState(false);
        }, 3000);
      } catch (error) {
        console.error('Telegram auth error:', error);
        
        // Set error state for visual feedback
        setErrorState({
          message: error instanceof Error ? error.message : 'Unbekannter Fehler beim Login',
          type: 'error'
        });
        
        addToast({
          type: 'error',
          title: 'Login fehlgeschlagen',
          description: error instanceof Error ? error.message : 'Unbekannter Fehler'
        });

        // Clear error after 5 seconds
        setTimeout(() => {
          setErrorState(null);
        }, 5000);
      } finally {
        setIsLoading(false);
      }
    };

    // Inject Telegram Widget script
    if (containerRef.current && !containerRef.current.querySelector('script')) {
      // Clean container first to avoid duplicate widgets
      containerRef.current.innerHTML = '';
      
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.async = true;
      script.setAttribute('data-telegram-login', botUsername);
      script.setAttribute('data-size', buttonSize);
      script.setAttribute('data-radius', cornerRadius.toString());
      if (requestAccess) {
        script.setAttribute('data-request-access', requestAccess);
      }
      if (usePic) {
        script.setAttribute('data-userpic', 'true');
      }
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      
      // Handle script load errors
      script.onerror = () => {
        setErrorState({
          message: 'Telegram Widget konnte nicht geladen werden. Bitte öffne den Bot direkt in Telegram.',
          type: 'warning'
        });
      };
      
      containerRef.current.appendChild(script);

      // Cleanup "Username invalid" messages after widget loads
      cleanupIntervalRef.current = setInterval(() => {
        if (containerRef.current) {
          const allElements = containerRef.current.querySelectorAll('*');
          allElements.forEach((el) => {
            const text = el.textContent || '';
            if (text.toLowerCase().includes('invalid') && text.toLowerCase().includes('username')) {
              el.remove();
            }
            // Also check for inline styles that might indicate errors
            if (el instanceof HTMLElement && 
                (el.style.color === 'red' || 
                 el.textContent?.toLowerCase().includes('error') ||
                 el.textContent?.toLowerCase().includes('invalid'))) {
              // Only remove if it's not the actual button
              if (!el.closest('iframe') && !el.closest('[data-telegram-login]')) {
                el.style.display = 'none';
                el.style.visibility = 'hidden';
              }
            }
          });
          
          // Stop cleanup after widget is loaded (iframe exists)
          if (containerRef.current.querySelector('iframe')) {
            if (cleanupIntervalRef.current) {
              clearInterval(cleanupIntervalRef.current);
              cleanupIntervalRef.current = null;
            }
          }
        }
      }, 100);

      // Stop cleanup after 5 seconds max
      setTimeout(() => {
        if (cleanupIntervalRef.current) {
          clearInterval(cleanupIntervalRef.current);
          cleanupIntervalRef.current = null;
        }
      }, 5000);
    }

    return () => {
      delete window.onTelegramAuth;
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
        cleanupIntervalRef.current = null;
      }
    };
  }, [botUsername, buttonSize, cornerRadius, requestAccess, usePic, setUser, addToast]);

  return (
    <div className={cn("relative w-full flex flex-col items-center gap-3", className)}>
      {/* Telegram Widget Container */}
      <div 
        ref={containerRef} 
        className={cn(
          "relative w-full min-h-[42px] flex items-center justify-center transition-opacity duration-300",
          isLoading && "opacity-50 pointer-events-none",
          successState && "opacity-75",
          // Hide any "Username invalid" or error text that Telegram Widget might inject
          "[&_iframe]:!block [&_iframe]:!w-full",
          "[&_*[style*='invalid']]:!hidden [&_*[style*='Invalid']]:!hidden",
          "[&_*:contains('invalid')]:!hidden [&_*:contains('Invalid')]:!hidden"
        )}
        aria-busy={isLoading}
        aria-live="polite"
      />
      
      {/* Fallback if Telegram Widget doesn't load */}
      {!containerRef.current?.querySelector('iframe') && !isLoading && (
        <div className="w-full flex flex-col items-center gap-3">
          <button
            onClick={() => {
              window.open(`https://t.me/${botUsername}?start=web`, '_blank');
            }}
            className={cn(
              "w-full rounded-lg bg-[#0088cc] hover:bg-[#0077b5] text-white",
              "px-6 py-3 font-semibold transition-all duration-300",
              "flex items-center justify-center gap-2 tap-target",
              "focus-visible-ring"
            )}
            aria-label="Mit Telegram anmelden"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.178 1.977-.943 6.769-.943 6.769-.119.889-.527 1.182-.971 1.182-.615 0-1.055-.381-1.635-.742-.2-.127-.358-.224-.538-.358-.24-.169-.05-.263.015-.414.085-.181 1.245-1.428 1.703-1.934.232-.257.428-.595.191-.928-.413-.582-1.154-1.358-1.746-1.855-.28-.238-.482-.41-.669-.513-.23-.134-.464-.22-.423-.465.034-.214.26-.405.54-.523.38-.16.85-.293 1.347-.293.394 0 .773.083 1.127.23.3.125.562.293.764.502.202.208.362.457.474.735.112.277.174.573.183.88.008.307-.037.624-.134.938z"/>
            </svg>
            <span>Mit Telegram anmelden</span>
          </button>
        </div>
      )}
      
      {/* Loading Overlay */}
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg backdrop-blur-sm z-10"
          role="status"
          aria-label="Anmeldung läuft"
        >
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
            <span className="text-xs text-muted">Anmeldung läuft...</span>
          </div>
        </div>
      )}

      {/* Success State */}
      {successState && !isLoading && (
        <div 
          className="flex items-center gap-2 text-sm text-green-400 animate-in fade-in slide-in-from-top-2 duration-300"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Anmeldung erfolgreich!</span>
        </div>
      )}

      {/* Error Message */}
      {errorState && !isLoading && (
        <div 
          className={cn(
            "flex items-start gap-2 text-sm p-3 rounded-lg border animate-in fade-in slide-in-from-top-2 duration-300 max-w-md w-full",
            errorState.type === 'error' && "text-red-400 bg-red-500/10 border-red-500/30",
            errorState.type === 'warning' && "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
            errorState.type === 'info' && "text-blue-400 bg-blue-500/10 border-blue-500/30"
          )}
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span className="text-left">{errorState.message}</span>
        </div>
      )}
    </div>
  );
};



