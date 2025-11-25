import React, { useState, useEffect, useCallback } from 'react';
import { Heart, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '../utils/cn';

// 🎯 External Interest Button Props
interface ExternalInterestButtonProps {
  dropId: string;
  dropName?: string;
  variant?: 'default' | 'minimal' | 'floating';
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark' | 'auto';
  showCount?: boolean;
  className?: string;
  onInterestChange?: (interested: boolean, count: number) => void;
  apiBaseUrl?: string;
}

// 🎯 API response types
interface InterestStatus {
  success: boolean;
  data: {
    dropId: string;
    totalInterest: number;
    recentInterest: number;
    lastInterest: string | null;
    sources: string[];
  };
}

interface InterestResponse {
  success: boolean;
  message: string;
  data: {
    dropId: string;
    interestId: string;
    timestamp: string;
  };
}

// 🎯 Nebula API client
class NebulaAPI {
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:3001/api') {
    this.baseUrl = baseUrl;
  }

  async getInterestStatus(dropId: string): Promise<InterestStatus> {
    const response = await fetch(`${this.baseUrl}/drops/${dropId}/interest/status`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async toggleInterest(dropId: string, source = 'external'): Promise<InterestResponse> {
    const response = await fetch(`${this.baseUrl}/drops/${dropId}/interest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ source }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
}

// 🎯 Main External Interest Button Component
export const ExternalInterestButton: React.FC<ExternalInterestButtonProps> = ({
  dropId,
  dropName,
  variant = 'default',
  size = 'md',
  theme = 'auto',
  showCount = true,
  className,
  onInterestChange,
  apiBaseUrl = 'http://localhost:3001/api'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [interestCount, setInterestCount] = useState(0);
  const [isInterested, setIsInterested] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = new NebulaAPI(apiBaseUrl);

  // 🎯 Load initial interest status
  const loadInterestStatus = useCallback(async () => {
    try {
      setError(null);
      const status = await api.getInterestStatus(dropId);
      setInterestCount(status.data.totalInterest);
      setIsInterested(status.data.recentInterest > 0);
    } catch (err) {
      console.error('Failed to load interest status:', err);
      setError('Failed to load interest status');
    }
  }, [dropId, api]);

  useEffect(() => {
    loadInterestStatus();

    // Refresh status every 30 seconds
    const interval = setInterval(loadInterestStatus, 30000);
    return () => clearInterval(interval);
  }, [loadInterestStatus]);

  // 🎯 Handle interest toggle
  const handleToggleInterest = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await api.toggleInterest(dropId, 'external-widget');
      await loadInterestStatus(); // Refresh status after toggle
      onInterestChange?.(isInterested, interestCount);
    } catch (err) {
      console.error('Failed to toggle interest:', err);
      setError('Failed to update interest');
    } finally {
      setIsLoading(false);
    }
  };

  // 🎯 Determine theme classes
  const getThemeClasses = () => {
    if (theme === 'auto') {
      return 'theme-auto';
    }
    return theme === 'dark' ? 'bg-gray-900 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300';
  };

  // 🎯 Size variants
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  // 🎯 Variant styles
  const getVariantClasses = () => {
    const baseClasses = cn(
      'inline-flex items-center gap-2 rounded-lg border font-medium transition-all duration-200',
      'hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      sizeClasses[size],
      getThemeClasses(),
      className
    );

    switch (variant) {
      case 'minimal':
        return cn(baseClasses, 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800');
      case 'floating':
        return cn(
          baseClasses,
          'fixed bottom-6 right-6 z-50 shadow-lg backdrop-blur-sm',
          'bg-white/90 dark:bg-gray-900/90 border-white/20 dark:border-gray-700/50'
        );
      default:
        return cn(baseClasses, 'border-current');
    }
  };

  return (
    <button
      onClick={handleToggleInterest}
      disabled={isLoading}
      className={getVariantClasses()}
      title={dropName ? `Show interest in ${dropName}` : 'Show interest'}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart
          className={cn(
            'h-4 w-4 transition-colors',
            isInterested ? 'fill-current text-red-500' : 'text-current'
          )}
        />
      )}

      {showCount && (
        <span className="font-semibold">
          {interestCount}
        </span>
      )}

      <span className="hidden sm:inline">
        {isInterested ? 'Interested' : 'Show Interest'}
      </span>

      {error && (
        <span className="text-xs text-red-500 ml-2" title={error}>
          ⚠️
        </span>
      )}
    </button>
  );
};

// 🎯 Web Component version for non-React sites
export class NebulaInterestButton extends HTMLElement {
  private api: NebulaAPI;
  private dropId: string;
  private apiBaseUrl: string;

  constructor() {
    super();
    this.api = new NebulaAPI();
    this.dropId = this.getAttribute('drop-id') || '';
    this.apiBaseUrl = this.getAttribute('api-url') || 'http://localhost:3001/api';
    this.api = new NebulaAPI(this.apiBaseUrl);
  }

  connectedCallback() {
    this.render();
    this.loadInterestStatus();
  }

  private async loadInterestStatus() {
    try {
      const status = await this.api.getInterestStatus(this.dropId);
      this.updateDisplay(status.data.totalInterest, status.data.recentInterest > 0);
    } catch (err) {
      console.error('Failed to load interest status:', err);
      this.updateDisplay(0, false, 'Error loading status');
    }
  }

  private async toggleInterest() {
    try {
      await this.api.toggleInterest(this.dropId, 'web-component');
      await this.loadInterestStatus();
    } catch (err) {
      console.error('Failed to toggle interest:', err);
      this.updateDisplay(0, false, 'Error updating interest');
    }
  }

  private updateDisplay(count: number, interested: boolean, error?: string) {
    const heart = this.querySelector('.interest-heart') as SVGSVGElement;
    const counter = this.querySelector('.interest-count') as HTMLSpanElement;
    const errorIcon = this.querySelector('.error-icon') as HTMLSpanElement;

    if (heart) {
      heart.classList.toggle('interested', interested);
      heart.setAttribute('fill', interested ? 'currentColor' : 'none');
    }

    if (counter) {
      counter.textContent = count.toString();
    }

    if (errorIcon) {
      errorIcon.textContent = error ? '⚠️' : '';
      errorIcon.title = error || '';
    }
  }

  private render() {
    const variant = this.getAttribute('variant') || 'default';
    const size = this.getAttribute('size') || 'md';
    const theme = this.getAttribute('theme') || 'auto';
    const showCount = this.hasAttribute('show-count');

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };

    const themeClasses = theme === 'dark'
      ? 'bg-gray-900 text-white border-gray-700'
      : 'bg-white text-gray-900 border-gray-300';

    this.innerHTML = `
      <button
        class="nebula-interest-btn inline-flex items-center gap-2 rounded-lg border font-medium transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${sizeClasses[size as keyof typeof sizeClasses]} ${themeClasses}"
        onclick="this.getRootNode().host.toggleInterest()"
      >
        <svg class="interest-heart h-4 w-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
        </svg>

        ${showCount ? '<span class="interest-count font-semibold">0</span>' : ''}

        <span class="hidden sm:inline interest-text">Show Interest</span>

        <span class="error-icon text-xs text-red-500 ml-2" title=""></span>
      </button>

      <style>
        .nebula-interest-btn:hover {
          transform: scale(1.05);
        }

        .nebula-interest-btn:active {
          transform: scale(0.95);
        }

        .interest-heart.interested {
          color: #ef4444 !important;
        }

        /* Floating variant styles */
        ${variant === 'floating' ? `
          .nebula-interest-btn {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 9999;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            backdrop-filter: blur(8px);
            background: rgba(255, 255, 255, 0.9) !important;
            border-color: rgba(255, 255, 255, 0.2) !important;
          }

          @media (prefers-color-scheme: dark) {
            .nebula-interest-btn {
              background: rgba(17, 24, 39, 0.9) !important;
              border-color: rgba(55, 65, 81, 0.5) !important;
              color: white !important;
            }
          }
        ` : ''}
      </style>
    `;

    // Add CSS for auto theme detection
    if (theme === 'auto') {
      const style = document.createElement('style');
      style.textContent = `
        @media (prefers-color-scheme: dark) {
          .nebula-interest-btn {
            background-color: rgb(17 24 39) !important;
            color: white !important;
            border-color: rgb(55 65 81) !important;
          }
        }
      `;
      this.appendChild(style);
    }
  }
}

// Register Web Component
if (typeof window !== 'undefined' && !customElements.get('nebula-interest-button')) {
  customElements.define('nebula-interest-button', NebulaInterestButton);
}

// 🎯 React Hook for using the button programmatically
export const useExternalInterest = (dropId: string, apiBaseUrl?: string) => {
  const [status, setStatus] = useState<{
    count: number;
    interested: boolean;
    loading: boolean;
    error: string | null;
  }>({
    count: 0,
    interested: false,
    loading: false,
    error: null
  });

  const api = new NebulaAPI(apiBaseUrl);

  const refreshStatus = useCallback(async () => {
    setStatus(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await api.getInterestStatus(dropId);
      setStatus({
        count: result.data.totalInterest,
        interested: result.data.recentInterest > 0,
        loading: false,
        error: null
      });
    } catch (err) {
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }));
    }
  }, [dropId, api]);

  const toggleInterest = useCallback(async () => {
    setStatus(prev => ({ ...prev, loading: true, error: null }));
    try {
      await api.toggleInterest(dropId, 'external-hook');
      await refreshStatus();
    } catch (err) {
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }));
    }
  }, [dropId, api, refreshStatus]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return {
    ...status,
    toggleInterest,
    refreshStatus
  };
};

// 🎯 Utility function to embed button in external sites
export const embedInterestButton = (
  container: string | HTMLElement,
  dropId: string,
  options: Partial<ExternalInterestButtonProps> = {}
) => {
  const target = typeof container === 'string'
    ? document.querySelector(container)
    : container;

  if (!target) {
    console.error('Container element not found');
    return;
  }

  // For React apps, use the React component
  if (typeof React !== 'undefined' && React.createElement) {
    const ReactDOM = require('react-dom');
    ReactDOM.render(
      React.createElement(ExternalInterestButton, { dropId, ...options }),
      target
    );
    return;
  }

  // For vanilla JS, use Web Component
  const button = document.createElement('nebula-interest-button');
  button.setAttribute('drop-id', dropId);

  if (options.apiBaseUrl) {
    button.setAttribute('api-url', options.apiBaseUrl);
  }

  if (options.variant) {
    button.setAttribute('variant', options.variant);
  }

  if (options.size) {
    button.setAttribute('size', options.size);
  }

  if (options.theme) {
    button.setAttribute('theme', options.theme);
  }

  if (options.showCount) {
    button.setAttribute('show-count', '');
  }

  target.appendChild(button);
};

export default ExternalInterestButton;
