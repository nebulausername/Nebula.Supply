// Mobile-optimierte Card-basierte Table-Ansicht
import React from 'react';
import { Card } from './Card';
import { cn } from '../../utils/cn';
import { useSwipeActions } from '../../hooks/useSwipe';
import { Trash2, Archive, Edit, MoreVertical } from 'lucide-react';

export interface MobileTableCardProps<T> {
  item: T;
  columns: Array<{
    key: string;
    label: string;
    render?: (value: any, item: T) => React.ReactNode;
    className?: string;
  }>;
  onRowClick?: (item: T) => void;
  onDelete?: (item: T) => void;
  onArchive?: (item: T) => void;
  onEdit?: (item: T) => void;
  swipeActions?: {
    left?: Array<{ label: string; icon?: React.ComponentType; action: () => void; color?: string }>;
    right?: Array<{ label: string; icon?: React.ComponentType; action: () => void; color?: string }>;
  };
  className?: string;
}

export function MobileTableCard<T extends Record<string, any>>({
  item,
  columns,
  onRowClick,
  onDelete,
  onArchive,
  onEdit,
  swipeActions,
  className
}: MobileTableCardProps<T>) {
  const [swipeOffset, setSwipeOffset] = React.useState(0);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const deltaX = e.touches[0].clientX - touchStartRef.current.x;
    const maxSwipe = 120;
    setSwipeOffset(Math.max(-maxSwipe, Math.min(maxSwipe, deltaX)));
  };

  const handleTouchEnd = () => {
    if (Math.abs(swipeOffset) > 60) {
      // Trigger action based on swipe direction
      if (swipeOffset < 0 && swipeActions?.left?.[0]) {
        swipeActions.left[0].action();
      } else if (swipeOffset > 0 && swipeActions?.right?.[0]) {
        swipeActions.right[0].action();
      }
    }
    setSwipeOffset(0);
    touchStartRef.current = null;
  };

  return (
    <div className="relative overflow-hidden">
      {/* Swipe Actions Background */}
      {(swipeOffset < 0 || swipeOffset > 0) && (
        <div
          className="absolute inset-0 flex items-center z-0"
          style={{
            transform: `translateX(${swipeOffset > 0 ? '100%' : '-100%'})`,
            transition: 'transform 0.2s ease'
          }}
        >
          {swipeOffset < 0 && swipeActions?.left && (
            <div className="flex-1 flex items-center justify-end gap-2 pr-4 bg-red-500/20">
              {swipeActions.left.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="p-2 rounded-full bg-red-500 text-white"
                >
                  {action.icon ? <action.icon className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
                </button>
              ))}
            </div>
          )}
          {swipeOffset > 0 && swipeActions?.right && (
            <div className="flex-1 flex items-center justify-start gap-2 pl-4 bg-blue-500/20">
              {swipeActions.right.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="p-2 rounded-full bg-blue-500 text-white"
                >
                  {action.icon ? <action.icon className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Card */}
      <Card
        ref={cardRef}
        className={cn(
          "relative z-10 transition-transform duration-200",
          className
        )}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          touchAction: 'pan-y'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => onRowClick?.(item)}
      >
        <div className="p-4 space-y-3">
          {columns.map((column) => {
            const value = item[column.key];
            const displayValue = column.render
              ? column.render(value, item)
              : value;

            return (
              <div key={column.key} className={cn("flex flex-col gap-1", column.className)}>
                <span className="text-xs text-muted uppercase tracking-wide">
                  {column.label}
                </span>
                <span className="text-sm text-text font-medium">
                  {displayValue ?? '-'}
                </span>
              </div>
            );
          })}

          {/* Action Buttons */}
          {(onDelete || onArchive || onEdit) && (
            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                  className="flex-1 px-3 py-2 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm font-medium"
                >
                  Edit
                </button>
              )}
              {onArchive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive(item);
                  }}
                  className="px-3 py-2 rounded bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                >
                  <Archive className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item);
                  }}
                  className="px-3 py-2 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

