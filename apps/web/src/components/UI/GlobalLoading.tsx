import { createContext, useContext, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonLoader } from './SkeletonLoader';

interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

interface GlobalLoadingContextType {
  setLoading: (state: LoadingState) => void;
  clearLoading: () => void;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | null>(null);

export const useGlobalLoading = () => {
  const context = useContext(GlobalLoadingContext);
  if (!context) {
    throw new Error('useGlobalLoading must be used within GlobalLoadingProvider');
  }
  return context;
};

interface GlobalLoadingProviderProps {
  children: ReactNode;
  value?: GlobalLoadingContextType;
}

export function GlobalLoadingProvider({ children, value }: GlobalLoadingProviderProps) {
  return (
    <GlobalLoadingContext.Provider value={value || { setLoading: () => {}, clearLoading: () => {} }}>
      {children}
    </GlobalLoadingContext.Provider>
  );
}

interface GlobalLoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  progress?: number;
  variant?: 'spinner' | 'skeleton' | 'progress';
}

export function GlobalLoadingOverlay({
  isLoading,
  message = 'Lädt...',
  progress,
  variant = 'skeleton'
}: GlobalLoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
      >
        {variant === 'skeleton' && (
          <div className="w-full max-w-md p-6">
            <SkeletonLoader />
          </div>
        )}
        
        {variant === 'spinner' && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-white/20 rounded-full" />
              <motion.div
                className="absolute inset-0 border-4 border-t-accent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            {message && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-white text-sm"
              >
                {message}
              </motion.p>
            )}
          </div>
        )}

        {variant === 'progress' && progress !== undefined && (
          <div className="w-full max-w-md p-6 space-y-4">
            <div className="text-center text-white mb-4">
              <p className="text-lg font-semibold mb-2">{message}</p>
              <p className="text-sm text-white/70">{Math.round(progress)}%</p>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-accent to-emerald-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Page-level loading component
interface PageLoadingProps {
  isLoading: boolean;
  children: ReactNode;
  skeleton?: boolean;
}

export function PageLoading({ isLoading, children, skeleton = true }: PageLoadingProps) {
  if (isLoading && skeleton) {
    return <SkeletonLoader />;
  }

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen"
        >
          <SkeletonLoader />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

