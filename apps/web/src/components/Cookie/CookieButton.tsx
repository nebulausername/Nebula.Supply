import { motion } from 'framer-motion';
import { useCookieStore } from '../../store/cookieStore';
import { useHaptic } from '../../hooks/useHaptic';
import { Cookie } from 'lucide-react';

// 🍪 Main Cookie Button Component with Touch Optimization

export const CookieButton: React.FC = () => {
  const { cookies, cookiesPerClick, addCookie, addTouchEffect } = useCookieStore();
  const { hapticClick } = useHaptic();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent 300ms mobile delay

    // Get click position for floating number
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Add cookies
    addCookie(cookiesPerClick, true);

    // Add floating number effect
    addTouchEffect(e.clientX, e.clientY, cookiesPerClick);

    // Haptic feedback
    hapticClick();
  };

  // Support multi-touch on mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();

    Array.from(e.touches).forEach((touch) => {
      // Add cookies for each touch point
      addCookie(cookiesPerClick, true);

      // Add floating number at touch position
      addTouchEffect(touch.clientX, touch.clientY, cookiesPerClick);
    });

    // Haptic feedback
    hapticClick();
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      {/* Cookie Counter Display */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-mono text-4xl font-bold text-yellow-600 dark:text-yellow-400 md:text-6xl">
          {Math.floor(cookies).toLocaleString()}
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">cookies</p>
      </motion.div>

      {/* The Cookie Button */}
      <motion.button
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95, rotate: 15 }}
        className="relative touch-none select-none"
        style={{
          width: 'min(60vw, 300px)',
          height: 'min(60vw, 300px)',
          minWidth: '120px',
          minHeight: '120px',
        }}
      >
        {/* Cookie Visual */}
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="relative h-full w-full">
            {/* Cookie Background */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-700 via-yellow-600 to-yellow-800 shadow-2xl"
              style={{
                boxShadow:
                  '0 10px 40px rgba(180, 83, 9, 0.5), inset 0 -5px 20px rgba(0,0,0,0.3), inset 0 5px 20px rgba(255,255,255,0.2)',
              }}
            />

            {/* Chocolate Chips */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-gradient-to-br from-yellow-900 to-yellow-950"
                style={{
                  width: `${10 + Math.random() * 10}%`,
                  height: `${10 + Math.random() * 10}%`,
                  top: `${20 + Math.random() * 60}%`,
                  left: `${20 + Math.random() * 60}%`,
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                }}
              />
            ))}

            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-radial from-yellow-400/20 via-transparent to-transparent" />
          </div>
        </motion.div>

        {/* Hover Glow */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-full"
          animate={{
            boxShadow: [
              '0 0 20px 5px rgba(234, 179, 8, 0.3)',
              '0 0 30px 10px rgba(234, 179, 8, 0.5)',
              '0 0 20px 5px rgba(234, 179, 8, 0.3)',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.button>

      {/* Click Power Display */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">
          +{cookiesPerClick.toLocaleString()} per click
        </p>
      </motion.div>
    </div>
  );
};
