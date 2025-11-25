import { useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  Home, 
  Rocket, 
  ShoppingCart, 
  Sparkles, 
  LayoutDashboard,
  X,
  Menu,
  Zap
} from "lucide-react";
import { useGlobalCartStore } from "../store/globalCart";
import { cn } from "../utils/cn";

const tabs = [
  { id: "home", label: "Home", icon: LayoutDashboard, href: "/", description: "Dashboard & Overview" },
  { id: "drops", label: "Drops", icon: Rocket, href: "/drops", description: "Live Drops & Releases", featured: true },
  { id: "shop", label: "Shop", icon: Home, href: "/shop", description: "Categories & Products" },
  { id: "profile", label: "Profil", icon: Sparkles, href: "/profile", description: "Account & Settings" },
  { id: "cart", label: "Cart", icon: ShoppingCart, href: "/cart", description: "Shopping Cart" }
] as const;

export const MobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { totalItems, openCart } = useGlobalCartStore();

  const handleCartClick = () => {
    openCart();
    setIsOpen(false);
  };

  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden flex items-center gap-2 rounded-full bg-gradient-to-r from-accent/20 to-accent/10 border border-accent/30 px-4 py-2 text-sm font-medium text-accent shadow-[0_0_20px_rgba(11,247,188,0.2)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(11,247,188,0.3)]"
      >
        <Menu className="h-4 w-4" />
        <span>Menu</span>
      </button>

      {/* Mobile Navigation Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Navigation Panel */}
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-gradient-to-b from-black via-[#0A0A0A] to-[#050505] border-l border-white/10 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-accent to-accent/60 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-black" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text">Nebula Supply</h2>
                  <p className="text-xs text-muted">Mobile Navigation</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-muted hover:text-text hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-2">
              {tabs.map(({ id, label, icon: Icon, href, description }) => (
                <div key={id}>
                  {id === 'cart' ? (
                    <button
                      onClick={handleCartClick}
                      className="group relative w-full flex items-center gap-4 rounded-2xl p-4 text-left transition-all duration-300 hover:bg-white/5 hover:shadow-lg"
                    >
                      <div className="relative">
                        <Icon className="h-6 w-6 text-muted group-hover:text-accent transition-colors" />
                        {totalItems > 0 && (
                          <span className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                            {totalItems > 99 ? '99+' : totalItems}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-text">{label}</span>
                          {false && (
                            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                          )}
                        </div>
                        <p className="text-sm text-muted">{description}</p>
                      </div>
                    </button>
                  ) : (
                    <NavLink
                      to={href}
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        cn(
                          "group relative w-full flex items-center gap-4 rounded-2xl p-4 transition-all duration-300",
                          false && "bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20",
                          isActive 
                            ? "bg-accent/20 text-accent shadow-[0_0_20px_rgba(11,247,188,0.2)]" 
                            : "hover:bg-white/5 hover:shadow-lg"
                        )
                      }
                    >
                      <div className="relative">
                        <Icon className="h-6 w-6 text-muted group-hover:text-accent transition-all duration-300 group-hover:scale-110" />
                        {false && (
                          <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-accent animate-pulse" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-text">{label}</span>
                          {false && (
                            <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">Featured</span>
                          )}
                        </div>
                        <p className="text-sm text-muted">{description}</p>
                      </div>
                    </NavLink>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 p-6">
              <div className="text-center">
                <p className="text-xs text-muted mb-2">Nebula Supply Mobile</p>
                <div className="flex items-center justify-center gap-2 text-xs text-accent">
                  <Zap className="h-3 w-3" />
                  <span>Optimized for speed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};








