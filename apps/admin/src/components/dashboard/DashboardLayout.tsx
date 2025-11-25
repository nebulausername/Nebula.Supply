import { memo, useCallback, useMemo, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { useDashboardWidgetLayout, WidgetId } from '../../lib/store/dashboardLayout';
import { logger } from '../../lib/logger';
import { useToast } from '../ui/Toast';
import { cn } from '../../utils/cn';
import { DashboardWidget } from './DashboardWidget';
import { ComponentErrorBoundary } from '../error/ComponentErrorBoundary';
import { WidgetSkeleton } from '../ui/skeletons/WidgetSkeleton';

const sizeClasses = {
  small: 'col-span-1',
  medium: 'col-span-1 lg:col-span-2',
  large: 'col-span-1 lg:col-span-3',
  full: 'col-span-full'
};

interface DashboardLayoutProps {
  renderWidget: (widgetId: WidgetId) => React.ReactNode;
  getWidgetTitle: (widgetId: WidgetId) => string;
  className?: string;
}

export const DashboardLayout = memo(function DashboardLayout({
  renderWidget,
  getWidgetTitle,
  className
}: DashboardLayoutProps) {
  const {
    layout,
    isEditing,
    draggedWidget,
    setIsEditing,
    reorderWidgets,
    resetLayout,
    saveView,
    loadView,
    deleteView,
    setDraggedWidget
  } = useDashboardWidgetLayout();

  const { showToast } = useToast();

  // Get enabled widgets sorted by order
  const enabledWidgets = useMemo(() => {
    if (!layout?.widgets || !Array.isArray(layout.widgets)) {
      return [];
    }
    return layout.widgets
      .filter(w => w.enabled)
      .sort((a, b) => a.order - b.order);
  }, [layout?.widgets]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetWidgetId: WidgetId) => {
    e.preventDefault();
    
    const draggedId = e.dataTransfer.getData('text/plain') as WidgetId;
    if (!draggedId || draggedId === targetWidgetId) {
      setDraggedWidget(null);
      return;
    }

    const draggedIndex = enabledWidgets.findIndex(w => w.id === draggedId);
    const targetIndex = enabledWidgets.findIndex(w => w.id === targetWidgetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedWidget(null);
      return;
    }

    // Reorder widgets
    const newOrder = [...enabledWidgets];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    reorderWidgets(newOrder.map(w => w.id));
    setDraggedWidget(null);
    
    logger.info('Widget reordered', { draggedId, targetWidgetId });
  }, [enabledWidgets, reorderWidgets, setDraggedWidget]);

  const handleSaveView = useCallback(() => {
    const name = prompt('Enter a name for this view:');
    if (name && name.trim()) {
      const viewId = saveView(name.trim());
      showToast({ type: 'success', title: 'View saved successfully' });
    }
  }, [saveView, showToast]);

  const handleReset = useCallback(() => {
    if (confirm('Are you sure you want to reset the dashboard layout?')) {
      resetLayout();
      showToast({ type: 'success', title: 'Layout reset to default' });
    }
  }, [resetLayout, showToast]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Layout Controls */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 rounded-lg border border-accent/30 bg-accent/10"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-accent">Layout Edit Mode</span>
            <span className="text-xs text-muted-foreground">
              Drag widgets to reorder • Click size buttons to resize • Click X to hide
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSaveView}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save View
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <Button
              onClick={() => setIsEditing(false)}
              variant="outline"
              size="sm"
            >
              Done
            </Button>
          </div>
        </motion.div>
      )}

      {/* Widget Grid */}
      <div
        className={cn(
          'grid gap-6',
          isEditing ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'
        )}
        onDragOver={handleDragOver}
      >
        {enabledWidgets.map((widget, index) => (
          <motion.div
            key={widget.id}
            draggable={isEditing}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', widget.id);
              setDraggedWidget(widget.id);
            }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, widget.id)}
            onDragEnd={() => setDraggedWidget(null)}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30,
              delay: index * 0.05 
            }}
            whileHover={isEditing ? { scale: 1.02 } : undefined}
            whileDrag={isEditing ? { scale: 0.98, opacity: 0.8 } : undefined}
            className={cn(
              sizeClasses[widget.size],
              isEditing && draggedWidget === widget.id && 'opacity-50',
              isEditing && 'cursor-move'
            )}
          >
            <DashboardWidget 
              widgetId={widget.id} 
              title={getWidgetTitle(widget.id)}
              defaultSize={widget.size}
            >
              <ComponentErrorBoundary componentName={widget.id}>
                <Suspense fallback={<WidgetSkeleton variant="card" />}>
                  {renderWidget(widget.id)}
                </Suspense>
              </ComponentErrorBoundary>
            </DashboardWidget>
          </motion.div>
        ))}
      </div>

      {/* Edit Button (when not editing) */}
      {!isEditing && (
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 shadow-lg"
            size="lg"
          >
            <Settings className="w-5 h-5" />
            Customize Layout
          </Button>
        </div>
      )}
    </div>
  );
});

