import { useState, useEffect, useMemo, useCallback, memo, lazy, Suspense, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  Rocket, 
  Sparkles, 
  ShoppingCart, 
  Star, 
  Zap, 
  Shield, 
  TrendingUp,
  ArrowRight,
  Check,
  Gift,
  Users,
  Award,
  Settings
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../utils/cn';
import { DevModeIndicator } from '../components/dev/DevModeIndicator';
import { DevModePanel } from '../components/dev/DevModePanel';
import { useDevMode } from '../hooks/useDevMode';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { LazySection } from '../components/LazySection';
import { CookieWidgetSkeleton, FeatureCardSkeleton } from '../components/landing/SkeletonLoader';
import { useMetaTags } from '../hooks/useMetaTags';
import { trackEvent, trackScrollDepth, resetScrollDepth } from '../utils/analytics';
import { useSectionTracking } from '../hooks/useSectionTracking';

// Lazy load heavy components
const MiniCookieWidget = lazy(() => 
  import('../components/cookieClicker/MiniCookieWidget').then(module => ({ default: module.MiniCookieWidget }))
);
const CookieTeaser = lazy(() => 
  import('../components/cookieClicker/CookieTeaser').then(module => ({ default: module.CookieTeaser }))
);

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Memoized Feature Card Component
interface FeatureCardProps {
  feature: {
    icon: typeof Rocket;
    title: string;
    description: string;
    color: string;
  };
  index: number;
}

const FeatureCard = memo(({ feature, index }: FeatureCardProps) => {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div
      variants={prefersReducedMotion ? {} : fadeInUp}
      className={cn(
        "group relative p-8 rounded-2xl",
        "border border-white/10 bg-black/30 backdrop-blur-sm",
        "transition-all duration-300",
        "hover:border-white/20 hover:shadow-2xl hover:shadow-accent/10",
        "hover:-translate-y-2",
        "focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-black"
      )}
      tabIndex={0}
      role="article"
      aria-labelledby={`feature-title-${index}`}
      aria-describedby={`feature-desc-${index}`}
    >
      <div className={cn(
        "inline-flex p-3 rounded-xl mb-4",
        `bg-gradient-to-br ${feature.color}`
      )}>
        <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
      </div>
      <h3 id={`feature-title-${index}`} className="text-xl font-semibold mb-2 text-white">
        {feature.title}
      </h3>
      <p id={`feature-desc-${index}`} className="text-muted leading-relaxed">
        {feature.description}
      </p>
      <div className={cn(
        "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity",
        `bg-gradient-to-br ${feature.color} blur-xl -z-10`
      )} />
    </motion.div>
  );
});
FeatureCard.displayName = 'FeatureCard';

// Memoized Stat Card Component
interface StatCardProps {
  stat: {
    value: string;
    label: string;
    icon: typeof Users;
  };
}

const StatCard = memo(({ stat }: StatCardProps) => {
  return (
    <motion.div
      variants={fadeInUp}
      className="text-center"
      role="region"
      aria-label={`${stat.label}: ${stat.value}`}
    >
      <stat.icon className="h-8 w-8 text-accent mx-auto mb-4" aria-hidden="true" />
      <div className="text-3xl md:text-4xl font-bold text-white mb-2" aria-live="polite">
        {stat.value}
      </div>
      <div className="text-sm text-muted uppercase tracking-wide">
        {stat.label}
      </div>
    </motion.div>
  );
});
StatCard.displayName = 'StatCard';

// Particle configuration - memoized to avoid recreation
const PARTICLE_COUNT = 12;
const createParticleConfig = () => {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    duration: 3 + Math.random() * 2,
    delay: Math.random() * 2,
    xOffset: Math.random() * 20 - 10,
  }));
};

export const LandingPage = () => {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const { isActive, handleKeySequence, handleLogoClickSequence } = useDevMode();
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);
  const scrollDepthRef = useRef(0);
  const pageLoadTime = useRef(Date.now());

  // Memoized data arrays
  const features = useMemo(() => [
    {
      icon: Rocket,
      title: 'Exklusive Drops',
      description: 'Erstklassige Produkte nur für dich. Invite-only System für Premium-Erlebnisse.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Zap,
      title: 'Blitzschnell',
      description: 'Echtzeit-Updates und sofortige Benachrichtigungen bei neuen Drops.',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Shield,
      title: 'Sicher & Vertrauensvoll',
      description: '100% sichere Zahlungen und geschützte Transaktionen.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: TrendingUp,
      title: 'Coins System',
      description: 'Verdiene und nutze Coins für exklusive Rabatte und Vorteile.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Gift,
      title: 'VIP Benefits',
      description: 'Exklusive Angebote, früher Zugang und Premium-Support.',
      color: 'from-rose-500 to-red-500'
    },
    {
      icon: Users,
      title: 'Insider-Kreis',
      description: 'Tritt einem exklusiven Insider-Netzwerk von Enthusiasten bei.',
      color: 'from-indigo-500 to-blue-500'
    }
  ], []);

  const benefits = useMemo(() => [
    'Invite-only Zugang zu Premium Drops',
    'Echtzeit-Benachrichtigungen',
    'Sichere Zahlungsabwicklung',
    'Coins für Rabatte verdienen',
    'VIP-Status mit exklusiven Vorteilen',
    '24/7 Premium Support'
  ], []);

  const stats = useMemo(() => [
    { value: '10K+', label: 'Aktive Nutzer', icon: Users },
    { value: '500+', label: 'Exklusive Drops', icon: Gift },
    { value: '99.9%', label: 'Zufriedenheit', icon: Star },
    { value: '24/7', label: 'Support', icon: Award }
  ], []);

  // Memoized particle configuration
  const particles = useMemo(() => createParticleConfig(), []);

  // SEO Meta Tags
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const currentUrl = `${baseUrl}${location.pathname}`;
  
  useMetaTags({
    title: 'Nebula Supply - Exklusive Drops & Premium Shopping',
    description: 'Erlebe Premium-Produkte, exklusive Angebote und ein einzigartiges Coins-System. Invite-only Zugang zu limitierten Drops und VIP Benefits.',
    image: `${baseUrl}/og-image.jpg`,
    url: currentUrl,
    type: 'website',
    siteName: 'Nebula Supply',
    twitterCard: 'summary_large_image',
    canonical: currentUrl
  });

  // Structured Data (JSON-LD)
  const structuredData = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Nebula Supply',
    description: 'Exklusive Drops und Premium Shopping Plattform',
    url: baseUrl,
    logo: `${baseUrl}/nebula-supply-favicon.png`,
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: 'German'
    }
  }), [baseUrl]);

  const websiteStructuredData = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Nebula Supply',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/shop?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  }), [baseUrl]);

  // Event Handlers with useCallback
  const handleDevPanelOpen = useCallback(() => {
    setIsDevPanelOpen(true);
    trackEvent('dev_panel_opened', { source: 'landing_page' });
  }, []);

  const handleDevPanelClose = useCallback(() => {
    setIsDevPanelOpen(false);
  }, []);

  const handleCTAClick = useCallback((ctaType: string, destination: string) => {
    trackEvent('landing_page_cta_click', {
      cta_type: ctaType,
      destination,
      timestamp: Date.now()
    });
  }, []);

  // Scroll depth tracking
  useEffect(() => {
    resetScrollDepth();
    
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;
      
      if (scrollPercentage > scrollDepthRef.current) {
        scrollDepthRef.current = scrollPercentage;
        trackScrollDepth(scrollPercentage);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Time on page tracking
  useEffect(() => {
    const startTime = Date.now();
    
    return () => {
      const timeOnPage = Date.now() - startTime;
      trackEvent('landing_page_time_on_page', {
        duration: timeOnPage,
        timestamp: Date.now()
      });
    };
  }, []);

  // Initialize dev mode keyboard sequence
  useEffect(() => {
    if (!isActive) {
      const cleanup = handleKeySequence();
      return cleanup;
    }
  }, [isActive, handleKeySequence]);

  // Section tracking
  useSectionTracking('hero-section', true);
  useSectionTracking('stats-section', true);
  useSectionTracking('features-section', true);
  useSectionTracking('benefits-section', true);
  useSectionTracking('cta-section', true);

  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Fehler beim Laden der Landing Page</h1>
            <p className="text-muted mb-4">Bitte lade die Seite neu oder kontaktiere den Support.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-full bg-accent text-black font-semibold hover:bg-accent/90 transition-colors"
            >
              Seite neu laden
            </button>
          </div>
        </div>
      }
    >
      <main className="min-h-screen bg-gradient-to-b from-black via-[#06060A] to-[#050505] text-text relative">
        {/* Skip to main content link for accessibility */}
        <a
          href="#hero-section"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-black focus:rounded-full focus:font-semibold"
        >
          Zum Hauptinhalt springen
        </a>

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
        />

        {/* Dev Mode Components */}
        <DevModeIndicator />
        {isActive && (
          <>
            <button
              onClick={handleDevPanelOpen}
              className="fixed bottom-4 right-4 z-50 p-3 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 backdrop-blur-sm hover:from-purple-500/30 hover:to-blue-500/30 transition-all shadow-lg hover:shadow-purple-500/50 focus-visible-ring"
              aria-label="Entwicklermodus Panel öffnen"
            >
              <Settings className="h-5 w-5 text-purple-300" aria-hidden="true" />
            </button>
            <DevModePanel isOpen={isDevPanelOpen} onClose={handleDevPanelClose} />
          </>
        )}

        {/* Enhanced Animated Background with Particles */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          
          {/* Optimized Floating Particles */}
          {!prefersReducedMotion && particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-2 h-2 bg-accent/30 rounded-full"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                willChange: 'transform, opacity'
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, particle.xOffset, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
              }}
            />
          ))}
        </div>

        {/* Hero Section */}
        <section 
          id="hero-section"
          className="relative overflow-hidden"
          role="region"
          aria-labelledby="hero-heading"
        >
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Left Side - Content */}
              <motion.div
                initial="initial"
                animate="animate"
                variants={prefersReducedMotion ? {} : staggerContainer}
                className="text-center lg:text-left"
              >
                {/* Badge */}
                <motion.div
                  variants={prefersReducedMotion ? {} : fadeInUp}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 cursor-pointer focus-visible-ring"
                  onClick={handleLogoClickSequence()}
                  role="button"
                  tabIndex={0}
                  aria-label="Nebula Supply Logo"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleLogoClickSequence()();
                    }
                  }}
                >
                  <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
                  <span className="text-sm text-muted uppercase tracking-wider">
                    Nebula Supply
                  </span>
                </motion.div>

                {/* Main Heading */}
                <motion.h1
                  id="hero-heading"
                  variants={prefersReducedMotion ? {} : fadeInUp}
                  className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-accent/90 to-white bg-clip-text text-transparent animate-shimmer"
                >
                  Dein Gateway zu
                  <br />
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Exklusiven Drops
                  </span>
                </motion.h1>

                {/* Subheading */}
                <motion.p
                  variants={prefersReducedMotion ? {} : fadeInUp}
                  className="text-xl md:text-2xl text-muted max-w-3xl mb-12 leading-relaxed"
                >
                  Erlebe Premium-Produkte, exklusive Angebote und ein einzigartiges 
                  Coins-System. Nur für dich.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  variants={prefersReducedMotion ? {} : fadeInUp}
                  className="flex flex-col sm:flex-row items-center lg:items-start gap-4"
                >
                  <Link
                    to="/shop"
                    onClick={() => handleCTAClick('primary', '/shop')}
                    className={cn(
                      "group relative px-8 py-4 rounded-full min-h-[44px] min-w-[44px]",
                      "bg-gradient-to-r from-accent via-purple-500 to-accent",
                      "text-white font-semibold text-lg",
                      "transition-all duration-300",
                      "hover:scale-105 hover:shadow-2xl hover:shadow-accent/50",
                      "active:scale-95",
                      "focus-visible-ring"
                    )}
                    aria-label="Jetzt starten - Zum Shop gehen"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Jetzt starten
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-accent via-purple-500 to-accent opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />
                  </Link>

                  <Link
                    to="/drops"
                    onClick={() => handleCTAClick('secondary', '/drops')}
                    className={cn(
                      "px-8 py-4 rounded-full min-h-[44px] min-w-[44px]",
                      "border-2 border-white/20 bg-white/5",
                      "text-text font-semibold text-lg",
                      "transition-all duration-300",
                      "hover:border-white/40 hover:bg-white/10",
                      "hover:scale-105 active:scale-95",
                      "focus-visible-ring"
                    )}
                    aria-label="Drops entdecken"
                  >
                    Drops entdecken
                  </Link>
                </motion.div>
              </motion.div>

              {/* Right Side - Cookie Widget (Lazy Loaded) */}
              <LazySection
                fallback={<CookieWidgetSkeleton />}
                className="hidden lg:block"
                rootMargin="200px"
              >
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <Suspense fallback={<CookieWidgetSkeleton />}>
                    <MiniCookieWidget />
                  </Suspense>
                </motion.div>
              </LazySection>
            </div>

            {/* Mobile Cookie Widget (Lazy Loaded) */}
            <LazySection
              fallback={<CookieWidgetSkeleton />}
              className="lg:hidden mt-8"
              rootMargin="200px"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Suspense fallback={<CookieWidgetSkeleton />}>
                  <MiniCookieWidget />
                </Suspense>
              </motion.div>
            </LazySection>
          </div>
        </section>

        {/* Stats Section */}
        <section 
          id="stats-section"
          className="relative py-16 border-y border-white/10"
          role="region"
          aria-labelledby="stats-heading"
        >
          <h2 id="stats-heading" className="sr-only">Statistiken</h2>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: '-100px' }}
              variants={prefersReducedMotion ? {} : staggerContainer}
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              {stats.map((stat) => (
                <StatCard key={stat.label} stat={stat} />
              ))}
            </motion.div>
          </div>
        </section>

        {/* Cookie Clicker Teaser Section (Lazy Loaded) */}
        <LazySection
          fallback={<div className="h-64 animate-pulse bg-black/30 rounded-2xl mx-4" />}
          rootMargin="300px"
        >
          <Suspense fallback={<div className="h-64 animate-pulse bg-black/30 rounded-2xl mx-4" />}>
            <CookieTeaser />
          </Suspense>
        </LazySection>

        {/* Features Section */}
        <section 
          id="features-section"
          className="relative py-32"
          role="region"
          aria-labelledby="features-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: '-100px' }}
              variants={prefersReducedMotion ? {} : staggerContainer}
              className="text-center mb-16"
            >
              <motion.h2
                id="features-heading"
                variants={prefersReducedMotion ? {} : fadeInUp}
                className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-muted bg-clip-text text-transparent"
              >
                Warum Nebula?
              </motion.h2>
              <motion.p
                variants={prefersReducedMotion ? {} : fadeInUp}
                className="text-xl text-muted max-w-2xl mx-auto"
              >
                Alles was du brauchst für das ultimative Shopping-Erlebnis
              </motion.p>
            </motion.div>

            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: '-100px' }}
              variants={prefersReducedMotion ? {} : staggerContainer}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              role="list"
            >
              {features.map((feature, index) => (
                <FeatureCard key={feature.title} feature={feature} index={index} />
              ))}
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section 
          id="benefits-section"
          className="relative py-32 bg-gradient-to-b from-transparent via-white/5 to-transparent"
          role="region"
          aria-labelledby="benefits-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6 }}
              >
                <h2 id="benefits-heading" className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-muted bg-clip-text text-transparent">
                  Deine Vorteile
                </h2>
                <p className="text-xl text-muted mb-8 leading-relaxed">
                  Werde Teil eines exklusiven Insider-Netzwerks und profitiere von 
                  einzigartigen Vorteilen und Angeboten.
                </p>
                <ul className="space-y-4" role="list">
                  {benefits.map((benefit, index) => (
                    <motion.li
                      key={benefit}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center" aria-hidden="true">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-lg text-muted">{benefit}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className="relative rounded-3xl border border-white/10 bg-black/30 backdrop-blur-sm p-8">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-accent/20 via-purple-500/20 to-pink-500/20 blur-2xl opacity-50" aria-hidden="true" />
                  <div className="relative space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-accent to-purple-500" aria-hidden="true">
                        <ShoppingCart className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-semibold text-white">Premium Shopping</h3>
                        <p className="text-muted">Exklusive Produkte nur für dich</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500" aria-hidden="true">
                        <Star className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-semibold text-white">Coins System</h3>
                        <p className="text-muted">Verdiene und nutze Coins</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500" aria-hidden="true">
                        <Shield className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-semibold text-white">100% Sicher</h3>
                        <p className="text-muted">Geschützte Transaktionen</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section 
          id="cta-section"
          className="relative py-32"
          role="region"
          aria-labelledby="cta-heading"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: '-100px' }}
              variants={prefersReducedMotion ? {} : staggerContainer}
            >
              <motion.h2
                id="cta-heading"
                variants={prefersReducedMotion ? {} : fadeInUp}
                className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-accent to-white bg-clip-text text-transparent"
              >
                Bereit loszulegen?
              </motion.h2>
              <motion.p
                variants={prefersReducedMotion ? {} : fadeInUp}
                className="text-xl text-muted mb-12 max-w-2xl mx-auto"
              >
                Tritt dem exklusiven Insider-Netzwerk bei und erlebe Premium-Shopping 
                auf einem neuen Level.
              </motion.p>
              <motion.div
                variants={prefersReducedMotion ? {} : fadeInUp}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link
                  to="/shop"
                  onClick={() => handleCTAClick('final-primary', '/shop')}
                  className={cn(
                    "group relative px-10 py-5 rounded-full min-h-[44px] min-w-[44px]",
                    "bg-gradient-to-r from-accent via-purple-500 to-accent",
                    "text-white font-semibold text-lg",
                    "transition-all duration-300",
                    "hover:scale-105 hover:shadow-2xl hover:shadow-accent/50",
                    "active:scale-95",
                    "focus-visible-ring"
                  )}
                  aria-label="Jetzt einkaufen - Zum Shop gehen"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Jetzt einkaufen
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-accent via-purple-500 to-accent opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />
                </Link>

                <Link
                  to="/profile"
                  onClick={() => handleCTAClick('final-secondary', '/profile')}
                  className={cn(
                    "px-10 py-5 rounded-full min-h-[44px] min-w-[44px]",
                    "border-2 border-white/20 bg-white/5",
                    "text-text font-semibold text-lg",
                    "transition-all duration-300",
                    "hover:border-white/40 hover:bg-white/10",
                    "hover:scale-105 active:scale-95",
                    "focus-visible-ring"
                  )}
                  aria-label="Profil ansehen"
                >
                  Profil ansehen
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>
    </ErrorBoundary>
  );
};
