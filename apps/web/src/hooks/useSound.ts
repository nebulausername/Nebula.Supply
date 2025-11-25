import { useCallback, useRef } from "react";

export const useSound = () => {
  const audioContext = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext.current;
  }, []);

  const playSound = useCallback(async (soundId: string, volume: number = 0.5) => {
    try {
      // For now, we'll use the Web Audio API to create simple sounds
      // In a real implementation, you'd load actual sound files

      switch (soundId) {
        case 'click':
          playClickSound(volume);
          break;
        case 'achievement':
          playAchievementSound(volume);
          break;
        case 'purchase':
          playPurchaseSound(volume);
          break;
        default:
          console.warn(`Unknown sound: ${soundId}`);
      }
    } catch (error) {
      console.warn('Sound playback failed:', error);
    }
  }, []);

  const playClickSound = (volume: number) => {
    try {
      const context = getAudioContext();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      // Quick click sound - high frequency burst
      oscillator.frequency.setValueAtTime(800, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, context.currentTime + 0.05);

      gainNode.gain.setValueAtTime(volume * 0.1, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.05);

      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.05);
    } catch (error) {
      console.warn('Click sound failed:', error);
    }
  };

  const playAchievementSound = (volume: number) => {
    try {
      const context = getAudioContext();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      // Achievement fanfare - ascending notes
      oscillator.frequency.setValueAtTime(523, context.currentTime); // C5
      oscillator.frequency.setValueAtTime(659, context.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(784, context.currentTime + 0.2); // G5

      gainNode.gain.setValueAtTime(volume * 0.2, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);

      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.3);
    } catch (error) {
      console.warn('Achievement sound failed:', error);
    }
  };

  const playPurchaseSound = (volume: number) => {
    try {
      const context = getAudioContext();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      // Purchase confirmation - pleasant ding
      oscillator.frequency.setValueAtTime(660, context.currentTime);

      gainNode.gain.setValueAtTime(volume * 0.15, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);

      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.1);
    } catch (error) {
      console.warn('Purchase sound failed:', error);
    }
  };

  return { playSound };
};
