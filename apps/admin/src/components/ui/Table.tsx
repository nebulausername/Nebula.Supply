import React from 'react';
import { cn } from '../../utils/cn';
import { useMobile } from '../../hooks/useMobile';
import { Card } from './Card';

// Legacy Table Sub-Components for backward compatibility
export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  )
);
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
  )
);
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  )
);
TableBody.displayName = 'TableBody';

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn('border-b transition-colors hover:bg-white/5 data-[state=selected]:bg-white/10', className)}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-muted [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  )
);
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
      {...props}
    />
  )
);
TableCell.displayName = 'TableCell';

// New Responsive Table Component
export interface TableColumn<T> {
  key: string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  mobileLabel?: string;
  hideOnMobile?: boolean;
  className?: string;
}

export interface ResponsiveTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  keyExtractor: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  className?: string;
  mobileCardRender?: (row: T) => React.ReactNode;
  stickyHeader?: boolean;
}

export function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  className,
  mobileCardRender,
  stickyHeader = false
}: ResponsiveTableProps<T>) {
  const { isMobile } = useMobile();

  if (isMobile) {
    // Mobile: Card-based view
    return (
      <div className={cn("space-y-3", className)}>
        {data.map((row) => {
          const key = keyExtractor(row);
          
          if (mobileCardRender) {
            return (
              <div key={key}>
                {mobileCardRender(row)}
              </div>
            );
          }

          return (
            <Card
              key={key}
              interactive={!!onRowClick}
              onClick={() => onRowClick?.(row)}
              className="p-4"
            >
              <div className="space-y-3">
                {columns
                  .filter(col => !col.hideOnMobile)
                  .map((column) => {
                    const value = row[column.key];
                    const displayValue = column.render
                      ? column.render(value, row)
                      : value;

                    return (
                      <div key={column.key} className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-muted uppercase tracking-wider">
                          {column.mobileLabel || column.label}
                        </span>
                        <span className="text-sm text-text">
                          {displayValue ?? '-'}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  // Desktop: Traditional table
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-white/10">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider",
                  stickyHeader && "sticky top-0 bg-black/80 backdrop-blur-sm z-10",
                  column.className
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const key = keyExtractor(row);
            return (
              <tr
                key={key}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "border-b border-white/5 transition-colors",
                  onRowClick && "cursor-pointer hover:bg-white/5"
                )}
              >
                {columns.map((column) => {
                  const value = row[column.key];
                  const displayValue = column.render
                    ? column.render(value, row)
                    : value;

                  return (
                    <td
                      key={column.key}
                      className={cn(
                        "px-4 py-3 text-sm text-text",
                        column.className
                      )}
                    >
                      {displayValue ?? '-'}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Responsive DataList component for mobile-first approach
export interface DataListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
  className?: string;
  emptyMessage?: string;
}

export function DataList<T>({
  data,
  renderItem,
  keyExtractor,
  className,
  emptyMessage = 'No items found'
}: DataListProps<T>) {
  if (data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center py-12 text-muted", className)}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((item, index) => (
        <div key={keyExtractor(item)}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}
