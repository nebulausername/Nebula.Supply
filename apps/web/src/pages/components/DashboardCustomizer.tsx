import { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GripVertical, X, Settings, LayoutGrid } from "lucide-react";
import { ScrollReveal } from "../../components/ScrollReveal";
import { cn } from "../../utils/cn";

interface Widget {
  id: string;
  title: string;
  component: React.ReactNode;
  enabled: boolean;
  order: number;
}

interface DashboardCustomizerProps {
  widgets: Widget[];
  onWidgetsChange?: (widgets: Widget[]) => void;
  reducedMotion?: boolean;
}

export const DashboardCustomizer = memo(({
  widgets: initialWidgets,
  onWidgetsChange,
  reducedMotion = false
}: DashboardCustomizerProps) => {
  const [widgets, setWidgets] = useState<Widget[]>(initialWidgets);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);

  const handleDragStart = useCallback((e: React.DragEvent, widgetId: string) => {
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', widgetId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetWidgetId: string) => {
    e.preventDefault();
    
    if (!draggedWidget || draggedWidget === targetWidgetId) {
      setDraggedWidget(null);
      return;
    }

    const draggedIndex = widgets.findIndex(w => w.id === draggedWidget);
    const targetIndex = widgets.findIndex(w => w.id === targetWidgetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedWidget(null);
      return;
    }

    const newWidgets = [...widgets];
    const [removed] = newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(targetIndex, 0, removed);

    // Update order
    const updatedWidgets = newWidgets.map((widget, index) => ({
      ...widget,
      order: index
    }));

    setWidgets(updatedWidgets);
    onWidgetsChange?.(updatedWidgets);
    setDraggedWidget(null);
  }, [draggedWidget, widgets, onWidgetsChange]);

  const handleDragEnd = useCallback(() => {
    setDraggedWidget(null);
  }, []);

  const toggleWidget = useCallback((widgetId: string) => {
    const updatedWidgets = widgets.map(widget =>
      widget.id === widgetId
        ? { ...widget, enabled: !widget.enabled }
        : widget
    );
    setWidgets(updatedWidgets);
    onWidgetsChange?.(updatedWidgets);
  }, [widgets, onWidgetsChange]);

  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);

  return (
    <ScrollReveal direction="up" delay={0.2} reducedMotion={reducedMotion}>
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-text flex items-center gap-2">
              <LayoutGrid className="h-6 w-6 text-accent" />
              Dashboard
            </h2>
            <p className="text-sm text-muted mt-1">Personalisiere dein Dashboard</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCustomizing(!isCustomizing)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span className="text-sm font-medium">{isCustomizing ? 'Fertig' : 'Anpassen'}</span>
          </motion.button>
        </div>

        {isCustomizing ? (
          <div className="space-y-3">
            {sortedWidgets.map((widget) => (
              <motion.div
                key={widget.id}
                draggable
                onDragStart={(e) => handleDragStart(e, widget.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, widget.id)}
                onDragEnd={handleDragEnd}
                whileDrag={{ opacity: 0.5, scale: 0.95 }}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border transition-all cursor-move",
                  draggedWidget === widget.id
                    ? "border-accent bg-accent/10"
                    : "border-white/10 bg-black/30 hover:border-white/20"
                )}
              >
                <GripVertical className="h-5 w-5 text-muted" />
                <div className="flex-1">
                  <div className="font-semibold text-text">{widget.title}</div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleWidget(widget.id)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                    widget.enabled
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                  )}
                >
                  {widget.enabled ? 'Aktiv' : 'Inaktiv'}
                </motion.button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {sortedWidgets
                .filter(widget => widget.enabled)
                .map((widget, index) => (
                  <motion.div
                    key={widget.id}
                    initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm p-6"
                  >
                    {widget.component}
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </ScrollReveal>
  );
});

DashboardCustomizer.displayName = 'DashboardCustomizer';

