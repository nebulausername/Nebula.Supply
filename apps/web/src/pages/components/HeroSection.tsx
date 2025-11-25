import { memo, useState, useCallback, useRef } from "react";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Rocket, Smartphone, ArrowRight } from "lucide-react";
import { ParticleBackground } from "../../components/effects/ParticleBackground";

export const HeroSection = memo(({ reducedMotion }: { reducedMotion: boolean }) => {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mouse tracking for interactive effects
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 150, damping: 15 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 15 });
  
  // Multi-layer Parallax Effects
  const mainY = useTransform(scrollY, [0, 300], [0, reducedMotion ? 0 : 150]);
  const opacity = useTransform(scrollY, [0, 200], [1, reducedMotion ? 1 : 0.2]);
  const scale = useTransform(scrollY, [0, 300], [1, reducedMotion ? 1 : 0.8]);
  
  // Background layers with different parallax speeds
  const bgLayer1Y = useTransform(scrollY, [0, 300], [0, reducedMotion ? 0 : 50]);
  const bgLayer2Y = useTransform(scrollY, [0, 300], [0, reducedMotion ? 0 : 100]);
  const bgLayer3Y = useTransform(scrollY, [0, 300], [0, reducedMotion ? 0 : 200]);
  
  // Content layers with different speeds
  const contentY = useTransform(scrollY, [0, 300], [0, reducedMotion ? 0 : 80]);
  const buttonY = useTransform(scrollY, [0, 300], [0, reducedMotion ? 0 : 40]);
  
  // Mouse tracking handler
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set((x - 0.5) * 50);
    mouseY.set((y - 0.5) * 50);
    setMousePosition({ x, y });
  }, [reducedMotion, mouseX, mouseY]);
  
  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);
  
  // Transform mouse position to parallax offset
  const parallaxX = useTransform(springX, [-25, 25], [-10, 10]);
  const parallaxY = useTransform(springY, [-25, 25], [-10, 10]);

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ y: mainY, opacity, scale }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-black/60 via-purple-900/20 to-black/60 backdrop-blur-xl cursor-none"
    >
      {/* Particle Background with Mouse Interaction */}
      {!reducedMotion && (
        <>
          <ParticleBackground
            particleCount={40}
            speed={0.3}
            interactive={true}
            reducedMotion={reducedMotion}
            className="opacity-30"
            mouseX={mousePosition.x}
            mouseY={mousePosition.y}
          />
          {/* Interactive cursor glow effect */}
          <motion.div
            style={{
              x: springX,
              y: springY,
            }}
            className="absolute w-96 h-96 bg-accent/20 rounded-full blur-3xl pointer-events-none"
          />
        </>
      )}

      {/* Multi-layer Animated Background with Parallax */}
      <div className="absolute inset-0">
        {/* Layer 1: Base gradient (slowest) */}
        <motion.div 
          style={{ y: bgLayer1Y }}
          className="absolute inset-0 bg-gradient-to-br from-accent/20 via-purple-500/20 to-pink-500/20 animate-pulse" 
        />
        
        {/* Layer 2: Top orb (medium speed) */}
        <motion.div 
          style={{ 
            y: bgLayer2Y,
            animationDelay: '1s'
          }}
          className="absolute top-0 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" 
        />
        
        {/* Layer 3: Bottom orb (fastest) */}
        <motion.div 
          style={{ 
            y: bgLayer3Y,
            animationDelay: '2s'
          }}
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" 
        />
        
        {/* Additional floating orbs for depth */}
        <motion.div 
          style={{ 
            y: useTransform(scrollY, [0, 300], [0, reducedMotion ? 0 : 75]),
            x: useTransform(scrollY, [0, 300], [0, reducedMotion ? 0 : 30]),
            animationDelay: '0.5s'
          }}
          className="absolute top-1/2 right-1/3 w-64 h-64 bg-pink-500/5 rounded-full blur-2xl animate-pulse"
        />
        
        <motion.div 
          style={{ 
            y: useTransform(scrollY, [0, 300], [0, reducedMotion ? 0 : -50]),
            x: useTransform(scrollY, [0, 300], [0, reducedMotion ? 0 : -20]),
            animationDelay: '1.5s'
          }}
          className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-cyan-500/5 rounded-full blur-2xl animate-pulse"
        />
      </div>

      <motion.div 
        style={{ 
          y: contentY,
          x: parallaxX,
          rotateY: useTransform(springX, [-25, 25], [-2, 2]),
          rotateX: useTransform(springY, [-25, 25], [2, -2]),
          transformStyle: 'preserve-3d'
        }}
        className="relative z-10 p-8 md:p-16"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.h1
            className="text-4xl md:text-7xl font-bold gradient-text mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            aria-label="Nebula Supply - Invite Revolution"
          >
            Nebula Supply
            <br />
            <span className="text-3xl md:text-5xl text-accent">Invite Revolution</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-muted mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Der exklusivste Insider-Kreis ever! Verdiene mit jedem verifizierten Freund echte Belohnungen und baue dein Team auf.
          </motion.p>

          <motion.div
            style={{ y: buttonY }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <motion.button
              whileHover={{ 
                scale: 1.05, 
                boxShadow: '0 0 50px rgba(11, 247, 188, 0.5)',
                y: -2
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/drops')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/drops');
                }
              }}
              className="group relative w-full sm:w-auto px-8 py-4 min-h-[48px] bg-accent text-black rounded-full font-bold text-lg shadow-2xl flex items-center justify-center gap-3 overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label="Zu Drops navigieren"
            >
              {/* Animated background gradient */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-accent via-purple-500 to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear'
                }}
                style={{
                  backgroundSize: '200% 200%'
                }}
              />
              <Rocket className="h-6 w-6 relative z-10" />
              <span className="relative z-10">Drops sichern</span>
              <motion.div
                className="relative z-10"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="h-6 w-6" />
              </motion.div>
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
});

HeroSection.displayName = 'HeroSection';
