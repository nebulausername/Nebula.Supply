import { memo, ReactNode, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GripVertical, X, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { WidgetId, useDashboardWidgetLayout } from '../../lib/store/dashboardLayout';

interface DashboardWidgetProps {
  widgetId: WidgetId;
  title: string;
  children: ReactNode;
  className?: string;
  defaultSize?: 'small' | 'medium' | 'large' | 'full';
}

const sizeClasses = {
  small: 'col-span-1',
  medium: 'col-span-1 lg:col-span-2',
  large: 'col-span-1 lg:col-span-3',
  full: 'col-span-full'
};

export const DashboardWidget = memo(function DashboardWidget({
  widgetId,
  title,
  children,
  className,
  defaultSize = 'medium'
}: DashboardWidgetProps) {
  const { 
    layout, 
    isEditing, 
    draggedWidget, 
    toggleWidget, 
    updateWidget,
    setDraggedWidget 
  } = useDashboardWidgetLayout();

  const widget = layout?.widgets?.find(w => w.id === widgetId);
  const isEnabled = widget?.enabled ?? true;
  const size = widget?.size ?? defaultSize;
  const isDragging = draggedWidget === widgetId;

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (!isEditing) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', widgetId);
    setDraggedWidget(widgetId);
  }, [isEditing, widgetId, setDraggedWidget]);

  const handleDragEnd = useCallback(() => {
    setDraggedWidget(null);
  }, [setDraggedWidget]);

  const handleToggle = useCallback(() => {
    toggleWidget(widgetId);
  }, [widgetId, toggleWidget]);

  const handleSizeChange = useCallback((newSize: 'small' | 'medium' | 'large' | 'full') => {
    updateWidget(widgetId, { size: newSize });
  }, [widgetId, updateWidget]);

  if (!isEnabled) {
    return null;
  }

  return (
    <motion.div
      draggable={isEditing}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        'relative group',
        sizeClasses[size],
        isDragging && 'opacity-50',
        className
      )}
      whileDrag={{ scale: 0.95, opacity: 0.8 }}
    >
      <div className={cn(
        'h-full rounded-lg border border-white/10 bg-black/20 p-4 transition-all',
        isEditing && 'hover:border-accent/50 cursor-move',
        isDragging && 'ring-2 ring-accent'
      )}>
        {/* Widget Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isEditing && (
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
            )}
            <h3 className="text-sm font-semibold text-text">{title}</h3>
          </div>
          
          {isEditing && (
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Size Controls */}
              <div className="flex items-center gap-1 border border-white/10 rounded">
                <button
                  onClick={() => handleSizeChange('small')}
                  className={cn(
                    'px-2 py-1 text-xs',
                    size === 'small' ? 'bg-accent text-black' : 'text-muted-foreground hover:text-text'
                  )}
                  title="Small"
                >
                  S
                </button>
                <button
                  onClick={() => handleSizeChange('medium')}
                  className={cn(
                    'px-2 py-1 text-xs',
                    size === 'medium' ? 'bg-accent text-black' : 'text-muted-foreground hover:text-text'
                  )}
                  title="Medium"
                >
                  M
                </button>
                <button
                  onClick={() => handleSizeChange('large')}
                  className={cn(
                    'px-2 py-1 text-xs',
                    size === 'large' ? 'bg-accent text-black' : 'text-muted-foreground hover:text-text'
                  )}
                  title="Large"
                >
                  L
                </button>
                <button
                  onClick={() => handleSizeChange('full')}
                  className={cn(
                    'px-2 py-1 text-xs',
                    size === 'full' ? 'bg-accent text-black' : 'text-muted-foreground hover:text-text'
                  )}
                  title="Full Width"
                >
                  F
                </button>
              </div>
              
              {/* Hide Button */}
              <button
                onClick={handleToggle}
                className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                title="Hide Widget"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Widget Content */}
        <div className="h-full">
          {children}
        </div>
      </div>
    </motion.div>
  );
});

