import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../../utils/cn";

interface LegalPageLayoutProps {
  title: string;
  lastUpdated?: string;
  children: ReactNode;
}

export const LegalPageLayout = ({ title, lastUpdated, children }: LegalPageLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#06060A] to-[#050505] text-text">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-16">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted hover:text-accent transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Zurück</span>
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-gradient-to-r from-accent via-purple-400 to-accent bg-clip-text text-transparent">
            {title}
          </h1>
          {lastUpdated && (
            <p className="text-sm text-muted">
              Zuletzt aktualisiert: {lastUpdated}
            </p>
          )}
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={cn(
            "prose prose-invert prose-lg max-w-none",
            "prose-headings:text-white prose-headings:font-bold",
            "prose-p:text-muted prose-p:leading-relaxed",
            "prose-a:text-accent prose-a:no-underline hover:prose-a:underline",
            "prose-strong:text-white prose-strong:font-semibold",
            "prose-ul:text-muted prose-ol:text-muted",
            "prose-li:my-2",
            "bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 p-8 md:p-12"
          )}
        >
          {children}
        </motion.div>

        {/* Footer Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 flex flex-wrap gap-4 justify-center text-sm"
        >
          <Link to="/impressum" className="text-muted hover:text-accent transition-colors">
            Impressum
          </Link>
          <span className="text-muted">•</span>
          <Link to="/agb" className="text-muted hover:text-accent transition-colors">
            AGB
          </Link>
          <span className="text-muted">•</span>
          <Link to="/datenschutz" className="text-muted hover:text-accent transition-colors">
            Datenschutz
          </Link>
          <span className="text-muted">•</span>
          <Link to="/widerruf" className="text-muted hover:text-accent transition-colors">
            Widerruf
          </Link>
          <span className="text-muted">•</span>
          <Link to="/versand" className="text-muted hover:text-accent transition-colors">
            Versand & Zahlung
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

