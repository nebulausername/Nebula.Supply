import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Lock, CreditCard, Truck, Mail, Phone } from "lucide-react";
import { cn } from "../utils/cn";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Optimierte Link-Komponente mit allen Verbesserungen
  const FooterLink = ({ 
    to, 
    children, 
    ariaLabel,
    external = false 
  }: { 
    to: string; 
    children: React.ReactNode;
    ariaLabel?: string;
    external?: boolean;
  }) => {
    const baseClasses = cn(
      "group relative inline-flex items-center gap-1.5",
      "text-sm text-muted",
      "transition-all duration-300 ease-out",
      "hover:text-accent",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
      "focus-visible:rounded-md focus-visible:px-1 focus-visible:-mx-1",
      "min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0",
      "py-2 px-1 -mx-1 md:py-0 md:px-0 md:mx-0",
      "will-change-transform"
    );

    if (external) {
      return (
        <a
          href={to}
          className={baseClasses}
          aria-label={ariaLabel || children?.toString()}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-0.5">
            {children}
          </span>
          <span className="absolute inset-0 rounded-md bg-accent/0 group-hover:bg-accent/10 transition-all duration-300 -z-0" />
          <span className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-accent/20 via-transparent to-transparent blur-sm -z-0" />
        </a>
      );
    }

    return (
      <Link
        to={to}
        className={baseClasses}
        aria-label={ariaLabel || children?.toString()}
      >
        <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-0.5">
          {children}
        </span>
        <span className="absolute inset-0 rounded-md bg-accent/0 group-hover:bg-accent/10 transition-all duration-300 -z-0" />
        <span className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-accent/20 via-transparent to-transparent blur-sm -z-0" />
      </Link>
    );
  };

  // Optimierte Contact Link Komponente
  const ContactLink = ({ 
    href, 
    icon: Icon, 
    children,
    ariaLabel 
  }: { 
    href: string; 
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
    ariaLabel?: string;
  }) => {
    return (
      <a
        href={href}
        className={cn(
          "group relative flex items-center gap-2",
          "text-sm text-muted",
          "transition-all duration-300 ease-out",
          "hover:text-accent",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          "focus-visible:rounded-md focus-visible:px-2 focus-visible:-mx-2",
          "min-h-[44px] min-w-[44px]",
          "py-2 px-2 -mx-2",
          "will-change-transform"
        )}
        aria-label={ariaLabel || children?.toString()}
      >
        <Icon className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:text-accent" />
        <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-0.5">
          {children}
        </span>
        <span className="absolute inset-0 rounded-md bg-accent/0 group-hover:bg-accent/10 transition-all duration-300 -z-0" />
        <span className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-accent/20 via-transparent to-transparent blur-sm -z-0" />
      </a>
    );
  };

  return (
    <footer className="relative mt-24 border-t border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        {/* Trust Badges Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 pb-12 border-b border-white/10"
        >
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="flex flex-col items-center text-center"
          >
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-3 transition-all duration-300 hover:bg-green-500/30 hover:shadow-lg hover:shadow-green-500/20">
              <Shield className="h-6 w-6 text-green-400 transition-transform duration-300 group-hover:scale-110" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">100% Sicher</h3>
            <p className="text-xs text-muted">SSL-verschlüsselt</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="flex flex-col items-center text-center"
          >
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-3 transition-all duration-300 hover:bg-blue-500/30 hover:shadow-lg hover:shadow-blue-500/20">
              <Lock className="h-6 w-6 text-blue-400 transition-transform duration-300 group-hover:scale-110" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Datenschutz</h3>
            <p className="text-xs text-muted">DSGVO-konform</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="flex flex-col items-center text-center"
          >
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-3 transition-all duration-300 hover:bg-purple-500/30 hover:shadow-lg hover:shadow-purple-500/20">
              <CreditCard className="h-6 w-6 text-purple-400 transition-transform duration-300 group-hover:scale-110" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Sichere Zahlung</h3>
            <p className="text-xs text-muted">Crypto & mehr</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="flex flex-col items-center text-center"
          >
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mb-3 transition-all duration-300 hover:bg-orange-500/30 hover:shadow-lg hover:shadow-orange-500/20">
              <Truck className="h-6 w-6 text-orange-400 transition-transform duration-300 group-hover:scale-110" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Schneller Versand</h3>
            <p className="text-xs text-muted">2-5 Werktage</p>
          </motion.div>
        </motion.div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
              Nebula Supply
            </h3>
            <p className="text-sm text-muted mb-4 leading-relaxed">
              Der exklusivste Insider-Kreis für Premium-Drops und einzigartige Deals.
            </p>
            <div className="flex flex-col gap-3 text-sm">
              <ContactLink
                href="mailto:info@nebula.supply"
                icon={Mail}
                ariaLabel="E-Mail an Nebula Supply senden"
              >
                info@nebula.supply
              </ContactLink>
              <ContactLink
                href="tel:+49123456789"
                icon={Phone}
                ariaLabel="Nebula Supply anrufen"
              >
                +49 (0) 123 456789
              </ContactLink>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <FooterLink to="/drops" ariaLabel="Zu den Drops navigieren">
                  Drops
                </FooterLink>
              </li>
              <li>
                <FooterLink to="/shop" ariaLabel="Zum Shop navigieren">
                  Shop
                </FooterLink>
              </li>
              <li>
                <FooterLink to="/vip" ariaLabel="Zur VIP Lounge navigieren">
                  VIP Lounge
                </FooterLink>
              </li>
              <li>
                <FooterLink to="/affiliate" ariaLabel="Zum Affiliate Programm navigieren">
                  Affiliate Programm
                </FooterLink>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <FooterLink to="/support" ariaLabel="Hilfe & FAQ öffnen">
                  Hilfe & FAQ
                </FooterLink>
              </li>
              <li>
                <FooterLink to="/versand" ariaLabel="Versand & Zahlung Informationen anzeigen">
                  Versand & Zahlung
                </FooterLink>
              </li>
              <li>
                <FooterLink to="/widerruf" ariaLabel="Widerrufsrecht Informationen anzeigen">
                  Widerrufsrecht
                </FooterLink>
              </li>
              <li>
                <FooterLink to="/profile" ariaLabel="Zu meinem Konto navigieren">
                  Mein Konto
                </FooterLink>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Rechtliches</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <FooterLink to="/impressum" ariaLabel="Impressum anzeigen">
                  Impressum
                </FooterLink>
              </li>
              <li>
                <FooterLink to="/agb" ariaLabel="Allgemeine Geschäftsbedingungen anzeigen">
                  AGB
                </FooterLink>
              </li>
              <li>
                <FooterLink to="/datenschutz" ariaLabel="Datenschutzerklärung anzeigen">
                  Datenschutz
                </FooterLink>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8 pb-8 border-b border-white/10"
        >
          <h4 className="text-sm font-semibold text-white mb-4 text-center">Sichere Zahlungsmethoden</h4>
          <div className="flex flex-wrap justify-center items-center gap-4">
            {[
              { icon: "💳", label: "Kreditkarte" },
              { icon: "₿", label: "Bitcoin" },
              { icon: "💰", label: "Crypto Voucher" },
              { icon: "💵", label: "Bargeld" }
            ].map((method, index) => (
              <motion.div
                key={method.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-muted font-semibold transition-all duration-300 hover:bg-white/10 hover:border-accent/30 hover:text-accent hover:shadow-lg hover:shadow-accent/10"
              >
                {method.icon} {method.label}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted"
        >
          <p>
            © {currentYear} Nebula Supply. Alle Rechte vorbehalten.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs">Made with</span>
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-accent"
            >
              💎
            </motion.span>
            <span className="text-xs">für Insider</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};
