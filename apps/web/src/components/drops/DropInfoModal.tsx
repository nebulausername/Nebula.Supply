import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  Clock,
  CheckCircle2,
  Shield,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Zap,
  Package,
  CreditCard,
  HelpCircle,
  Star,
  AlertTriangle,
  TrendingUp,
  Users,
  Rocket,
  Timer
} from "lucide-react";
import { cn } from "../../utils/cn";
import { useEnhancedTouch } from "../../hooks/useEnhancedTouch";

interface DropInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "overview" | "how-it-works" | "faq";

interface FAQItem {
  question: string;
  answer: string;
  icon: React.ReactNode;
  color: string;
}

export const DropInfoModal = ({ isOpen, onClose }: DropInfoModalProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const { triggerHaptic } = useEnhancedTouch();

  const faqItems: FAQItem[] = [
    {
      question: "Wie lange dauert ein Drop?",
      answer: "Unsere Drops laufen durchschnittlich 1-2 Wochen. Jeder Drop hat einen Live-Countdown, der dir zeigt, wie viel Zeit noch bleibt. Nutze die Chance, solange der Timer läuft!",
      icon: <Clock className="h-5 w-5" />,
      color: "orange"
    },
    {
      question: "Was passiert, wenn die Mindestmenge nicht erreicht wird?",
      answer: "Wenn die Mindestmenge nicht erreicht wird, kann der Drop scheitern. Aber keine Sorge: Dein Geld ist zu 100% sicher! Du erhältst automatisch eine vollständige Rückerstattung. Wir garantieren deine Sicherheit.",
      icon: <Shield className="h-5 w-5" />,
      color: "yellow"
    },
    {
      question: "Wie funktioniert die Bezahlung?",
      answer: "Die Bezahlung erfolgt erst, wenn der Drop erfolgreich aktiviert wurde und die Mindestmenge erreicht ist. Du wirst automatisch benachrichtigt und erhältst eine Zahlungsaufforderung. Erst dann wird dein Geld belastet.",
      icon: <CreditCard className="h-5 w-5" />,
      color: "blue"
    },
    {
      question: "Kann ich einen Drop stornieren?",
      answer: "Ja, du kannst deine Vorbestellung jederzeit vor der Aktivierung stornieren. Sobald der Drop aktiviert wurde, ist eine Stornierung nicht mehr möglich. Du wirst jedoch rechtzeitig benachrichtigt, bevor die Zahlung fällig wird.",
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "red"
    },
    {
      question: "Wann erhalte ich meine Bestellung?",
      answer: "Die Lieferzeiten variieren je nach Herkunft: Aus Deutschland 2-5 Tage, aus Europa 3-7 Tage, aus China 7-15 Tage. Nach der Aktivierung des Drops beginnt die Produktion. Du wirst über jeden Schritt informiert.",
      icon: <Package className="h-5 w-5" />,
      color: "green"
    },
    {
      question: "Was passiert nach der Aktivierung?",
      answer: "Sobald die Mindestmenge erreicht ist oder die Frist abläuft, wird der Drop automatisch aktiviert. Die Produktion beginnt und du erhältst eine Zahlungsaufforderung. Danach geht alles schnell - deine Bestellung wird produziert und verschickt!",
      icon: <Rocket className="h-5 w-5" />,
      color: "purple"
    },
    {
      question: "Gibt es eine Garantie auf die Produkte?",
      answer: "Ja! Alle Produkte unterliegen unserer Standard-Garantie. Solltest du mit deiner Bestellung nicht zufrieden sein, kontaktiere uns einfach. Wir finden immer eine Lösung.",
      icon: <Star className="h-5 w-5" />,
      color: "cyan"
    },
    {
      question: "Wie unterscheiden sich Drops vom normalen Shop?",
      answer: "Drops sind zeitlich begrenzte Vorbestellungen mit exklusiven Preisen. Durch gemeinschaftliche Vorbestellungen können wir dir Produkte zu unschlagbaren Preisen anbieten. Insider bestimmen den Preis und du profitierst von den Vorteilen!",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "pink"
    },
    {
      question: "Wie viele Personen können an einem Drop teilnehmen?",
      answer: "Es gibt keine maximale Teilnehmerzahl! Je mehr Personen teilnehmen, desto besser für alle. Die Preise können sogar noch günstiger werden, wenn mehr bestellt wird. Teile den Drop mit deinen Freunden!",
      icon: <Users className="h-5 w-5" />,
      color: "indigo"
    },
    {
      question: "Was ist der Vorteil von Drops?",
      answer: "Drops bieten dir einzigartige Produkte zu exklusiven Preisen, die du sonst nirgendwo findest. Durch gemeinschaftliche Vorbestellungen profitierst du von Insider-Preisen und sicherst dir limitierte Produkte, bevor sie im regulären Shop verfügbar sind.",
      icon: <Sparkles className="h-5 w-5" />,
      color: "emerald"
    }
  ];

  const handleTabChange = (tab: TabType) => {
    triggerHaptic('light');
    setActiveTab(tab);
    if (tab === "faq") {
      setOpenFAQ(0); // Öffne erste FAQ beim Wechsel zum FAQ-Tab
    }
  };

  const toggleFAQ = (index: number) => {
    triggerHaptic('light');
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        {/* 🎯 Premium Overlay mit animiertem Gradient */}
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-[60] transition-all duration-700 ease-out",
            "bg-gradient-to-br from-black/95 via-slate-900/95 to-black/95",
            "backdrop-blur-xl",
            "before:absolute before:inset-0 before:bg-gradient-to-br before:from-[#0BF7BC]/5 before:via-transparent before:to-orange-500/5",
            "before:animate-pulse"
          )}
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(11, 247, 188, 0.03) 0%, rgba(0, 0, 0, 0.95) 70%)'
          }}
        />

        {/* 🎯 Glowing Border Effect */}
        <div
          className={cn(
            "fixed inset-0 z-[59] pointer-events-none transition-opacity duration-700",
            "bg-gradient-to-r from-[#0BF7BC]/15 via-orange-500/15 to-[#0BF7BC]/15",
            "animate-pulse"
          )}
          style={{
            clipPath: 'inset(0% 10% 10% 10% round 2rem)',
            filter: 'blur(50px)',
            animation: 'pulse-glow 3s ease-in-out infinite'
          }}
        />

        <Dialog.Content
          className={cn(
            "fixed inset-4 md:inset-auto z-[60] md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
            "w-[calc(100%-2rem)] md:w-full md:max-w-4xl md:max-h-[90vh]",
            "bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95",
            "rounded-3xl border-2 border-slate-700/80",
            "shadow-[0_0_80px_rgba(11,247,188,0.15),0_20px_60px_rgba(0,0,0,0.8)]",
            "backdrop-blur-2xl overflow-hidden flex flex-col",
            "animate-scale-in"
          )}
          style={{
            boxShadow: '0 0 120px rgba(11, 247, 188, 0.15), 0 0 60px rgba(255, 165, 0, 0.1), 0 30px 80px rgba(0, 0, 0, 0.95)'
          }}
        >
          {/* 🎯 Header */}
          <div className="relative p-6 border-b border-white/10 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0BF7BC]/10 via-transparent to-orange-500/10 opacity-50" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-2 bg-gradient-to-r from-[#0BF7BC] via-orange-400 to-[#0BF7BC] bg-clip-text text-transparent">
                  Alles über Drops
                </h2>
                <p className="text-blue-200 text-sm md:text-base">
                  Dein Guide zu zeitlich begrenzten Vorbestellungen
                </p>
              </div>
              <Dialog.Close
                onClick={() => triggerHaptic('light')}
                className={cn(
                  "rounded-full p-2 border border-white/20 bg-white/5",
                  "hover:bg-white/10 hover:border-white/30 hover:scale-110",
                  "transition-all duration-300 active:scale-95"
                )}
              >
                <X className="h-5 w-5 text-white" />
              </Dialog.Close>
            </div>
          </div>

          {/* 🎯 Tab Navigation */}
          <div className="flex items-center gap-2 p-4 bg-slate-900/50 border-b border-white/10">
            {[
              { id: "overview" as TabType, label: "Überblick", icon: Star },
              { id: "how-it-works" as TabType, label: "So funktioniert's", icon: Zap },
              { id: "faq" as TabType, label: "FAQ", icon: HelpCircle }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300",
                    isActive
                      ? "bg-gradient-to-r from-[#0BF7BC] to-cyan-400 text-black shadow-lg shadow-[#0BF7BC]/30 scale-105"
                      : "text-blue-200 hover:text-white hover:bg-white/10 hover:scale-105"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* 🎯 Content Area - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6 opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Card 1: Dauer */}
                  <div className={cn(
                    "group relative p-6 rounded-2xl border-2 transition-all duration-500",
                    "bg-gradient-to-br from-orange-500/20 via-orange-600/15 to-cyan-500/20",
                    "border-orange-400/40 hover:border-orange-400/60",
                    "hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-500/30",
                    "backdrop-blur-sm"
                  )}>
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-orange-500/30 to-orange-600/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Clock className="h-7 w-7 text-orange-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Zeitlich begrenzt</h3>
                      <p className="text-sm text-blue-200 leading-relaxed">
                        Drops laufen durchschnittlich <span className="font-bold text-orange-400">1-2 Wochen</span>.
                        Nutze die Chance, solange der Timer läuft!
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Aktivierung */}
                  <div className={cn(
                    "group relative p-6 rounded-2xl border-2 transition-all duration-500",
                    "bg-gradient-to-br from-green-500/20 via-green-600/15 to-emerald-500/20",
                    "border-green-400/40 hover:border-green-400/60",
                    "hover:scale-[1.02] hover:shadow-2xl hover:shadow-green-500/30",
                    "backdrop-blur-sm"
                  )}>
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-green-500/30 to-green-600/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                        <CheckCircle2 className="h-7 w-7 text-green-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Automatische Aktivierung</h3>
                      <p className="text-sm text-blue-200 leading-relaxed">
                        Sobald die <span className="font-bold text-green-400">Mindestmenge erreicht</span> ist
                        oder die <span className="font-bold text-green-400">Frist abläuft</span>, wird der Drop aktiviert
                        und bestellt.
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Risiko/Erfolg */}
                  <div className={cn(
                    "group relative p-6 rounded-2xl border-2 transition-all duration-500",
                    "bg-gradient-to-br from-yellow-500/20 via-orange-500/15 to-amber-500/20",
                    "border-yellow-400/40 hover:border-yellow-400/60",
                    "hover:scale-[1.02] hover:shadow-2xl hover:shadow-yellow-500/30",
                    "backdrop-blur-sm"
                  )}>
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500/30 to-orange-500/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Shield className="h-7 w-7 text-yellow-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Erfolgsgarantie</h3>
                      <p className="text-sm text-blue-200 leading-relaxed">
                        Drops können <span className="font-bold text-yellow-400">scheitern</span>, wenn die Mindestmenge
                        nicht erreicht wird. <span className="font-bold text-green-400">Dein Geld ist sicher</span> -
                        keine Sorge!
                      </p>
                    </div>
                  </div>

                  {/* Card 4: Vorteil */}
                  <div className={cn(
                    "group relative p-6 rounded-2xl border-2 transition-all duration-500",
                    "bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-purple-600/20",
                    "border-purple-400/40 hover:border-purple-400/60",
                    "hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/30",
                    "backdrop-blur-sm"
                  )}>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Sparkles className="h-7 w-7 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Exklusive Preise</h3>
                      <p className="text-sm text-blue-200 leading-relaxed">
                        Einzigartige Produkte zu <span className="font-bold text-purple-400">unschlagbaren Preisen</span>
                        durch gemeinschaftliche Vorbestellungen. Insider bestimmen den Preis!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* How It Works Tab */}
            {activeTab === "how-it-works" && (
              <div className="space-y-6 opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">Der Drop-Prozess in 3 Schritten</h3>
                  <p className="text-blue-200">So sicherst du dir exklusive Deals zu unschlagbaren Preisen</p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      step: 1,
                      title: "Drop landet - Countdown läuft",
                      description: "Limitiertes Angebot erscheint für 24-72h. Early-Bird Preise nur für schnelle Insider. Live-Counter zeigt verbleibende Stückzahl.",
                      icon: <Rocket className="h-6 w-6" />,
                      color: "from-[#0BF7BC] to-cyan-400"
                    },
                    {
                      step: 2,
                      title: "Insider sichern sich den Deal",
                      description: "Je mehr bestellen, desto krasser der Preis. Live-Preisanzeige fällt in Echtzeit. 'Noch 47 Insider dabei' Social Proof Badge.",
                      icon: <Users className="h-6 w-6" />,
                      color: "from-blue-500 to-blue-600"
                    },
                    {
                      step: 3,
                      title: "Ziel erreicht = Drop aktiviert",
                      description: "Mindestmenge geschafft oder Zeit abgelaufen. Automatische Bestellbestätigung. Exklusiver Insider-Preis gesperrt.",
                      icon: <Timer className="h-6 w-6" />,
                      color: "from-orange-500 to-orange-600"
                    }
                  ].map((item, index) => (
                    <div
                      key={item.step}
                      className={cn(
                        "flex items-start gap-4 p-5 rounded-xl border-2 border-white/10",
                        "bg-gradient-to-br from-slate-800/50 to-slate-900/50",
                        "hover:border-white/20 hover:scale-[1.01] transition-all duration-300",
                        "opacity-0"
                      )}
                      style={{ 
                        animationDelay: `${index * 100}ms`,
                        animation: `fadeInSlideLeft 0.5s ease-out forwards`
                      }}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br",
                        item.color,
                        "text-white font-bold text-lg shrink-0 shadow-lg"
                      )}>
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-white/60">SCHRITT {item.step}</span>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                        <p className="text-sm text-blue-200 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQ Tab */}
            {activeTab === "faq" && (
              <div className="space-y-4 opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Häufig gestellte Fragen</h3>
                  <p className="text-blue-200">Alles, was du über Drops wissen musst</p>
                </div>

                {faqItems.map((faq, index) => {
                  const isOpen = openFAQ === index;
                  const getColorClasses = (color: string) => {
                    switch (color) {
                      case "orange": return "from-orange-500/20 to-orange-600/20 border-orange-400/40";
                      case "yellow": return "from-yellow-500/20 to-yellow-600/20 border-yellow-400/40";
                      case "blue": return "from-blue-500/20 to-blue-600/20 border-blue-400/40";
                      case "red": return "from-red-500/20 to-red-600/20 border-red-400/40";
                      case "green": return "from-green-500/20 to-green-600/20 border-green-400/40";
                      case "purple": return "from-purple-500/20 to-purple-600/20 border-purple-400/40";
                      case "cyan": return "from-cyan-500/20 to-cyan-600/20 border-cyan-400/40";
                      case "pink": return "from-pink-500/20 to-pink-600/20 border-pink-400/40";
                      case "indigo": return "from-indigo-500/20 to-indigo-600/20 border-indigo-400/40";
                      case "emerald": return "from-emerald-500/20 to-emerald-600/20 border-emerald-400/40";
                      default: return "from-slate-500/20 to-slate-600/20 border-slate-400/40";
                    }
                  };

                  const getIconColorClasses = (color: string) => {
                    switch (color) {
                      case "orange": return "bg-orange-500/30 text-orange-300";
                      case "yellow": return "bg-yellow-500/30 text-yellow-300";
                      case "blue": return "bg-blue-500/30 text-blue-300";
                      case "red": return "bg-red-500/30 text-red-300";
                      case "green": return "bg-green-500/30 text-green-300";
                      case "purple": return "bg-purple-500/30 text-purple-300";
                      case "cyan": return "bg-cyan-500/30 text-cyan-300";
                      case "pink": return "bg-pink-500/30 text-pink-300";
                      case "indigo": return "bg-indigo-500/30 text-indigo-300";
                      case "emerald": return "bg-emerald-500/30 text-emerald-300";
                      default: return "bg-slate-500/30 text-slate-300";
                    }
                  };

                  const colorClasses = getColorClasses(faq.color);
                  const iconColorClasses = getIconColorClasses(faq.color);

                  return (
                    <div
                      key={index}
                      className={cn(
                        "rounded-xl border-2 overflow-hidden transition-all duration-300",
                        `bg-gradient-to-br ${colorClasses}`,
                        isOpen ? "shadow-xl" : "shadow-md hover:shadow-lg"
                      )}
                    >
                      <button
                        onClick={() => toggleFAQ(index)}
                        className={cn(
                          "w-full flex items-center justify-between p-5 text-left",
                          "hover:bg-white/5 transition-colors duration-200"
                        )}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-lg shrink-0",
                            iconColorClasses
                          )}>
                            {faq.icon}
                          </div>
                          <h4 className="text-base md:text-lg font-bold text-white pr-4">
                            {faq.question}
                          </h4>
                        </div>
                        <div className={cn(
                          "shrink-0 transition-transform duration-300",
                          isOpen && "rotate-180"
                        )}>
                          <ChevronDown className="h-5 w-5 text-white/60" />
                        </div>
                      </button>
                      <div className={cn(
                        "overflow-hidden transition-all duration-300",
                        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                      )}>
                        <div className="p-5 pt-0 border-t border-white/10">
                          <p className="text-sm md:text-base text-blue-200 leading-relaxed whitespace-pre-line">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 🎯 Footer CTA */}
          <div className="p-6 border-t border-white/10 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
            <button
              onClick={() => {
                triggerHaptic('medium');
                onClose();
              }}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-lg",
                "bg-gradient-to-r from-[#0BF7BC] to-cyan-400 text-black",
                "hover:from-cyan-400 hover:to-[#0BF7BC] hover:scale-105",
                "transition-all duration-300 shadow-lg shadow-[#0BF7BC]/30",
                "hover:shadow-xl hover:shadow-[#0BF7BC]/50 active:scale-95"
              )}
            >
              <span>Los geht's!</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
