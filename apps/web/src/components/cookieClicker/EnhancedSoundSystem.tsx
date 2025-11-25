import { useEffect, useRef, useState, memo } from 'react';
import { useCookieClickerStore } from '../../store/cookieClicker';

// 🎵 SOUND POOL für Performance
export class SoundPool {
  private sounds: Map<string, HTMLAudioElement[]> = new Map();
  private poolSize = 3;

  constructor() {
    // Pre-create sound pools (wir verwenden Web Audio API für bessere Performance)
  }

  playSound(soundId: string, volume: number = 0.5) {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // 🎵 ERWEITERTE SOUND ENGINE - 100x BESSER!
      const soundConfigs: Record<string, {
        frequencies: number[];
        type: OscillatorType;
        duration: number;
        envelope: { attack: number; decay: number; sustain: number; release: number };
      }> = {
        click: {
          frequencies: [800, 850],
          type: 'sine',
          duration: 0.08,
          envelope: { attack: 0.01, decay: 0.02, sustain: 0.5, release: 0.05 }
        },
        purchase: {
          frequencies: [600, 700],
          type: 'triangle',
          duration: 0.15,
          envelope: { attack: 0.02, decay: 0.03, sustain: 0.6, release: 0.1 }
        },
        achievement: {
          frequencies: [1000, 1200, 1000],
          type: 'sine',
          duration: 0.5,
          envelope: { attack: 0.05, decay: 0.1, sustain: 0.8, release: 0.35 }
        },
        upgrade: {
          frequencies: [700, 800, 900],
          type: 'sawtooth',
          duration: 0.2,
          envelope: { attack: 0.02, decay: 0.04, sustain: 0.7, release: 0.14 }
        },
        building: {
          frequencies: [500, 550],
          type: 'sine',
          duration: 0.12,
          envelope: { attack: 0.03, decay: 0.04, sustain: 0.6, release: 0.05 }
        },
        combo: {
          frequencies: [900, 1100, 1300],
          type: 'square',
          duration: 0.25,
          envelope: { attack: 0.01, decay: 0.05, sustain: 0.75, release: 0.19 }
        },
        goldenCookie: {
          frequencies: [1500, 1800, 2000],
          type: 'sine',
          duration: 0.4,
          envelope: { attack: 0.02, decay: 0.08, sustain: 0.8, release: 0.3 }
        },
        // 🐉 BOSS & DUNGEON SOUNDS - EXPERTS NIVEAU! 🎵 GEILER!
        boss_spawn: {
          frequencies: [60, 80, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800],
          type: 'sawtooth',
          duration: 3.5,
          envelope: { attack: 0.5, decay: 0.6, sustain: 0.8, release: 1.2 }
        },
        boss_attack: {
          frequencies: [200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100],
          type: 'square',
          duration: 0.4,
          envelope: { attack: 0.01, decay: 0.15, sustain: 0.85, release: 0.24 }
        },
        boss_defeat: {
          frequencies: [200, 250, 300, 350, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1000, 800, 600, 500, 400, 300, 200],
          type: 'sine',
          duration: 4.0,
          envelope: { attack: 0.4, decay: 1.2, sustain: 0.6, release: 1.5 }
        },
        // 🎯 CRITICAL STRIKE SOUND - NEU!
        critical: {
          frequencies: [1200, 1500, 1800, 2200, 2500, 3000, 3500, 4000],
          type: 'square',
          duration: 0.7,
          envelope: { attack: 0.005, decay: 0.25, sustain: 0.95, release: 0.445 }
        },
        dungeon_enter: {
          frequencies: [200, 250, 300, 350, 400, 450, 500],
          type: 'triangle',
          duration: 0.8,
          envelope: { attack: 0.15, decay: 0.25, sustain: 0.6, release: 0.4 }
        },
        level_up: {
          frequencies: [500, 600, 700, 800, 900, 1000, 1100, 1200, 1300],
          type: 'sine',
          duration: 0.8,
          envelope: { attack: 0.08, decay: 0.2, sustain: 0.75, release: 0.52 }
        },
        coin_collect: {
          frequencies: [1000, 1100],
          type: 'sine',
          duration: 0.1,
          envelope: { attack: 0.01, decay: 0.02, sustain: 0.8, release: 0.07 }
        },
        // 🏆 MILESTONE SOUNDS - EPISCHE UNLOCK-SOUNDS AUF DEUTSCH!
        milestone_unlock_common: {
          frequencies: [400, 500, 600, 700],
          type: 'sine',
          duration: 0.6,
          envelope: { attack: 0.05, decay: 0.15, sustain: 0.7, release: 0.35 }
        },
        milestone_unlock_uncommon: {
          frequencies: [500, 600, 700, 800, 900],
          type: 'triangle',
          duration: 0.7,
          envelope: { attack: 0.08, decay: 0.2, sustain: 0.75, release: 0.37 }
        },
        milestone_unlock_rare: {
          frequencies: [600, 700, 800, 900, 1000, 1100],
          type: 'sine',
          duration: 0.8,
          envelope: { attack: 0.1, decay: 0.25, sustain: 0.8, release: 0.45 }
        },
        milestone_unlock_epic: {
          frequencies: [700, 800, 900, 1000, 1100, 1200, 1300],
          type: 'sine',
          duration: 1.0,
          envelope: { attack: 0.12, decay: 0.3, sustain: 0.85, release: 0.53 }
        },
        milestone_unlock_legendary: {
          frequencies: [800, 900, 1000, 1100, 1200, 1300, 1400, 1500],
          type: 'sine',
          duration: 1.2,
          envelope: { attack: 0.15, decay: 0.35, sustain: 0.9, release: 0.6 }
        },
        milestone_unlock_nebula: {
          frequencies: [900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700],
          type: 'sine',
          duration: 1.5,
          envelope: { attack: 0.2, decay: 0.4, sustain: 0.95, release: 0.7 }
        },
        // Legacy support für alte Rarities
        milestone_unlock_genesis: {
          frequencies: [400, 500, 600, 700],
          type: 'sine',
          duration: 0.6,
          envelope: { attack: 0.05, decay: 0.15, sustain: 0.7, release: 0.35 }
        },
        milestone_unlock_ascension: {
          frequencies: [500, 600, 700, 800, 900],
          type: 'triangle',
          duration: 0.7,
          envelope: { attack: 0.08, decay: 0.2, sustain: 0.75, release: 0.37 }
        },
        milestone_unlock_transcendence: {
          frequencies: [600, 700, 800, 900, 1000, 1100],
          type: 'sine',
          duration: 0.8,
          envelope: { attack: 0.1, decay: 0.25, sustain: 0.8, release: 0.45 }
        },
        milestone_unlock_divinity: {
          frequencies: [700, 800, 900, 1000, 1100, 1200, 1300],
          type: 'sine',
          duration: 1.0,
          envelope: { attack: 0.12, decay: 0.3, sustain: 0.85, release: 0.53 }
        },
        milestone_unlock_cosmos: {
          frequencies: [800, 900, 1000, 1100, 1200, 1300, 1400, 1500],
          type: 'sine',
          duration: 1.2,
          envelope: { attack: 0.15, decay: 0.35, sustain: 0.9, release: 0.6 }
        },
        milestone_hover: {
          frequencies: [800, 900],
          type: 'sine',
          duration: 0.15,
          envelope: { attack: 0.01, decay: 0.04, sustain: 0.6, release: 0.1 }
        },
        milestone_progress: {
          frequencies: [600, 700],
          type: 'sine',
          duration: 0.2,
          envelope: { attack: 0.02, decay: 0.05, sustain: 0.7, release: 0.13 }
        }
      };

      const config = soundConfigs[soundId] || soundConfigs.click;
      const now = audioContext.currentTime;

      // Create multiple oscillators for complex sounds - OPTIMIERT FÜR GEILERE SOUNDS!
      config.frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = config.type;
        
        // Frequency modulation für interessantere Sounds (bei Square Waves)
        let finalFreq = freq;
        if (config.type === 'square' && index % 2 === 0) {
          // Leichte Pitch-Variation für Square Waves - macht Sounds lebendiger!
          const variation = (Math.sin(index * 0.5) * 30);
          finalFreq = freq + variation;
        }
        oscillator.frequency.value = finalFreq;
        
        // Advanced envelope (ADSR) - OPTIMIERT!
        const { attack, decay, sustain, release } = config.envelope;
        // Staggered start für komplexere, reichere Sounds
        const delayOffset = index * (config.duration / config.frequencies.length / 3);
        const startTime = now + delayOffset;
        
        // Volume-Variation basierend auf Index für dynamischeren Sound
        // Tiefere Frequenzen etwas lauter, höhere etwas leiser für besseres Gleichgewicht
        const frequencyVolume = volume * (1 - (index / config.frequencies.length) * 0.2);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(frequencyVolume, startTime + attack);
        gainNode.gain.linearRampToValueAtTime(frequencyVolume * sustain, startTime + attack + decay);
        gainNode.gain.setValueAtTime(frequencyVolume * sustain, startTime + config.duration - release);
        gainNode.gain.linearRampToValueAtTime(0, startTime + config.duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + config.duration);
      });
    } catch (e) {
      // Silently fail if audio context not available
      console.debug('Audio context not available');
    }
  }
}

// 🎵 SOUND MANAGER
export const SoundManager = memo(() => {
  const { soundEnabled, particles, unlockedAchievements } = useCookieClickerStore();
  const soundPoolRef = useRef(new SoundPool());
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [clickVolume, setClickVolume] = useState(0.5);
  const [effectsVolume, setEffectsVolume] = useState(0.6);
  const [musicVolume, setMusicVolume] = useState(0.4);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const lastAchievementCountRef = useRef(unlockedAchievements.length);

  // 🎵 Play click sound
  useEffect(() => {
    if (!soundEnabled) return;
    
    const newParticles = particles.filter(p => p.type === 'click' || p.type === 'critical');
    if (newParticles.length > 0) {
      const lastParticle = newParticles[newParticles.length - 1];
      const soundId = lastParticle.type === 'critical' ? 'critical' : 'click';
      soundPoolRef.current.playSound(soundId, clickVolume * masterVolume);
    }
  }, [particles.length, soundEnabled, clickVolume, masterVolume]);

  // 🎵 Play achievement sound
  useEffect(() => {
    if (!soundEnabled) return;
    
    if (unlockedAchievements.length > lastAchievementCountRef.current) {
      soundPoolRef.current.playSound('achievement', effectsVolume * masterVolume);
      lastAchievementCountRef.current = unlockedAchievements.length;
    }
  }, [unlockedAchievements.length, soundEnabled, effectsVolume, masterVolume]);

  // 🎵 Background Music (optional)
  useEffect(() => {
    if (!musicEnabled || !soundEnabled) {
      if (musicRef.current) {
        musicRef.current.pause();
      }
      return;
    }

    // In production, würde man hier eine echte Musik-Datei laden
    // Für jetzt bleibt es optional/deaktiviert
  }, [musicEnabled, soundEnabled]);

  return null; // Component doesn't render anything
});
SoundManager.displayName = 'SoundManager';

// 🎵 SOUND SETTINGS PANEL
export const SoundSettingsPanel = memo(() => {
  const { soundEnabled, toggleSound } = useCookieClickerStore();
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [masterVolume, setMasterVolume] = useState(70);
  const [clickVolume, setClickVolume] = useState(50);
  const [effectsVolume, setEffectsVolume] = useState(60);
  const [musicVolume, setMusicVolume] = useState(40);

  return (
    <div className="space-y-4 bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">🎵 Sound-Einstellungen</h3>
        <button
          onClick={toggleSound}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            soundEnabled
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
          }`}
        >
          {soundEnabled ? '🔊 Aktiv' : '🔇 Stumm'}
        </button>
      </div>

      {soundEnabled && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70">Master-Lautstärke</span>
              <span className="text-white font-bold">{masterVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={masterVolume}
              onChange={(e) => setMasterVolume(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70">Klick-Sounds</span>
              <span className="text-white font-bold">{clickVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={clickVolume}
              onChange={(e) => setClickVolume(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70">Effekt-Sounds</span>
              <span className="text-white font-bold">{effectsVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={effectsVolume}
              onChange={(e) => setEffectsVolume(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70">Hintergrund-Musik</span>
              <span className="text-white font-bold">{musicVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={musicVolume}
              onChange={(e) => setMusicVolume(Number(e.target.value))}
              className="w-full"
              disabled={!musicEnabled}
            />
            <button
              onClick={() => setMusicEnabled(!musicEnabled)}
              className={`mt-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                musicEnabled
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-white/10 text-white/60'
              }`}
            >
              {musicEnabled ? '🎵 Musik an' : '🎵 Musik aus'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
SoundSettingsPanel.displayName = 'SoundSettingsPanel';

