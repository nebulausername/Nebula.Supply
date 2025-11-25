# 🔧 Ticket System - Technischer Implementierungsplan

## 📋 Inhaltsverzeichnis

1. [Performance-Optimierungen](#performance-optimierungen)
2. [Neue Features - Code-Struktur](#neue-features---code-struktur)
3. [API-Erweiterungen](#api-erweiterungen)
4. [State-Management](#state-management)
5. [Real-time Verbesserungen](#real-time-verbesserungen)

---

## 🚀 Performance-Optimierungen

### 1. Virtual Scrolling Enhancement

**Problem**: Bei >1000 Tickets wird die Liste langsam.

**Lösung**: Erweiterte Virtualisierung mit React Window

```typescript
// apps/admin/src/components/tickets/VirtualizedTicketList.tsx
import { FixedSizeList } from 'react-window';
import { useMemo } from 'react';

interface VirtualizedTicketListProps {
  tickets: Ticket[];
  height: number;
  itemHeight?: number;
}

export function VirtualizedTicketList({ 
  tickets, 
  height, 
  itemHeight = 80 
}: VirtualizedTicketListProps) {
  const Row = ({ index, style }: any) => {
    const ticket = tickets[index];
    return (
      <div style={style}>
        <TicketRow ticket={ticket} />
      </div>
    );
  };

  return (
    <FixedSizeList
      height={height}
      itemCount={tickets.length}
      itemSize={itemHeight}
      width="100%"
      overscanCount={5} // Render 5 extra items for smooth scrolling
    >
      {Row}
    </FixedSizeList>
  );
}
```

### 2. Query-Optimierung mit React Query

**Problem**: Zu viele Refetches, keine intelligente Caching-Strategie.

**Lösung**: Optimierte Query-Konfiguration

```typescript
// apps/admin/src/lib/api/hooks.ts

export const useTickets = (filters?: TicketFilters) => {
  return useQuery({
    queryKey: queryKeys.tickets.list(filters),
    queryFn: async () => {
      const response = await api.getPaginated('/api/tickets', filters);
      return response;
    },
    staleTime: 30 * 1000, // 30 Sekunden
    gcTime: 5 * 60 * 1000, // 5 Minuten
    refetchOnWindowFocus: false, // Nicht bei Window-Focus refetchen
    refetchOnReconnect: true, // Nur bei Reconnect
    placeholderData: (previousData) => previousData, // Instant UI updates
    // Optimistic Updates
    onSuccess: (data) => {
      // Prefetch related data
      queryClient.prefetchQuery({
        queryKey: queryKeys.tickets.stats,
        queryFn: () => api.get('/api/tickets/stats'),
      });
    },
  });
};

// Infinite Query für Pagination
export const useTicketsInfinite = (filters?: TicketFilters) => {
  return useInfiniteQuery({
    queryKey: queryKeys.tickets.infinite(filters),
    queryFn: async ({ pageParam = 0 }) => {
      const response = await api.getPaginated('/api/tickets', {
        ...filters,
        offset: pageParam,
        limit: 50,
      });
      return response;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.pagination?.hasMore) {
        return allPages.length * 50;
      }
      return undefined;
    },
    initialPageParam: 0,
  });
};
```

### 3. Optimistic Updates Pattern

```typescript
// apps/admin/src/lib/api/hooks.ts

export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TicketStatus }) => {
      return api.patch(`/api/tickets/${id}/status`, { status });
    },
    // Optimistic Update
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.tickets.list() });
      
      // Snapshot previous value
      const previousTickets = queryClient.getQueryData(queryKeys.tickets.list());
      
      // Optimistically update
      queryClient.setQueryData(queryKeys.tickets.list(), (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((ticket: Ticket) =>
            ticket.id === id ? { ...ticket, status } : ticket
          ),
        };
      });
      
      return { previousTickets };
    },
    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousTickets) {
        queryClient.setQueryData(queryKeys.tickets.list(), context.previousTickets);
      }
    },
    // Always refetch after success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.list() });
    },
  });
};
```

---

## 🎨 Neue Features - Code-Struktur

### 1. Calendar View Implementation

```typescript
// apps/admin/src/components/tickets/TicketCalendarView.tsx
import { useState, useMemo } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { Ticket } from '@nebula/shared/types';

const localizer = momentLocalizer(moment);

interface TicketCalendarViewProps {
  tickets: Ticket[];
  onTicketClick: (ticketId: string) => void;
}

export function TicketCalendarView({ tickets, onTicketClick }: TicketCalendarViewProps) {
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());

  // Convert tickets to calendar events
  const events = useMemo(() => {
    return tickets.map((ticket) => ({
      id: ticket.id,
      title: `${ticket.id}: ${ticket.subject}`,
      start: new Date(ticket.slaDueAt || ticket.createdAt),
      end: new Date(ticket.slaDueAt || ticket.createdAt),
      resource: ticket,
      // Color based on priority
      color: getPriorityColor(ticket.priority),
    }));
  }, [tickets]);

  const eventStyleGetter = (event: any) => {
    const ticket = event.resource as Ticket;
    return {
      style: {
        backgroundColor: getPriorityColor(ticket.priority),
        borderColor: getStatusColor(ticket.status),
        borderWidth: 2,
        borderRadius: 4,
      },
    };
  };

  return (
    <div className="h-[600px]">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        onSelectEvent={(event) => onTicketClick(event.id)}
        eventPropGetter={eventStyleGetter}
        popup
        showMultiDayTimes
      />
    </div>
  );
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#6b7280',
  };
  return colors[priority] || '#6b7280';
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    open: '#10b981',
    waiting: '#f59e0b',
    in_progress: '#3b82f6',
    escalated: '#ef4444',
    done: '#6b7280',
  };
  return colors[status] || '#6b7280';
}
```

### 2. Advanced Search Component

```typescript
// apps/admin/src/components/tickets/AdvancedSearch.tsx
import { useState, useMemo } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

interface AdvancedSearchProps {
  onSearch: (query: string, filters: SearchFilters) => void;
}

interface SearchFilters {
  searchIn: ('subject' | 'summary' | 'messages' | 'tags')[];
  dateRange?: { from: Date; to: Date };
  hasAttachments?: boolean;
  unreadOnly?: boolean;
}

export function AdvancedSearch({ onSearch }: AdvancedSearchProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    searchIn: ['subject', 'summary'],
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    onSearch(debouncedQuery, filters);
  }, [debouncedQuery, filters, onSearch]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen... (z.B. #123, 'Refund', 'critical')"
            className="w-full pl-10 pr-4 py-2 bg-surface/50 border border-white/10 rounded-lg"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="p-2 bg-surface/50 border border-white/10 rounded-lg"
        >
          <Filter className="h-4 w-4" />
        </button>
      </div>

      {showAdvanced && (
        <div className="p-4 bg-surface/30 rounded-lg space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Suche in:</label>
            <div className="flex flex-wrap gap-2">
              {['subject', 'summary', 'messages', 'tags'].map((field) => (
                <label key={field} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.searchIn?.includes(field as any)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFilters({
                          ...filters,
                          searchIn: [...(filters.searchIn || []), field as any],
                        });
                      } else {
                        setFilters({
                          ...filters,
                          searchIn: filters.searchIn?.filter((f) => f !== field),
                        });
                      }
                    }}
                  />
                  <span className="text-sm capitalize">{field}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Weitere Filter:</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.hasAttachments}
                  onChange={(e) =>
                    setFilters({ ...filters, hasAttachments: e.target.checked })
                  }
                />
                <span className="text-sm">Nur mit Anhängen</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.unreadOnly}
                  onChange={(e) =>
                    setFilters({ ...filters, unreadOnly: e.target.checked })
                  }
                />
                <span className="text-sm">Nur ungelesene</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 3. AI-Powered Auto-Categorization

```typescript
// apps/admin/src/lib/ai/ticketCategorization.ts
import { api } from '../api/client';

interface CategorizationResult {
  category: string;
  confidence: number;
  suggestedPriority: string;
  tags: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

export async function categorizeTicket(
  subject: string,
  summary: string
): Promise<CategorizationResult> {
  try {
    const response = await api.post('/api/ai/categorize-ticket', {
      subject,
      summary,
    });
    return response.data;
  } catch (error) {
    // Fallback to default
    return {
      category: 'other',
      confidence: 0,
      suggestedPriority: 'medium',
      tags: [],
      sentiment: 'neutral',
    };
  }
}

// Usage in CreateTicketModal
export function useAutoCategorization() {
  const [isCategorizing, setIsCategorizing] = useState(false);
  
  const categorize = useCallback(async (subject: string, summary: string) => {
    setIsCategorizing(true);
    try {
      const result = await categorizeTicket(subject, summary);
      return result;
    } finally {
      setIsCategorizing(false);
    }
  }, []);

  return { categorize, isCategorizing };
}
```

### 4. Workflow Automation Engine

```typescript
// apps/admin/src/lib/automation/workflowEngine.ts

interface WorkflowRule {
  id: string;
  name: string;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  enabled: boolean;
}

interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
  value: any;
}

interface WorkflowAction {
  type: 'assign' | 'setStatus' | 'setPriority' | 'addTag' | 'sendEmail';
  params: Record<string, any>;
}

export class WorkflowEngine {
  private rules: WorkflowRule[] = [];

  async evaluateTicket(ticket: Ticket): Promise<void> {
    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      
      if (this.evaluateConditions(rule.conditions, ticket)) {
        await this.executeActions(rule.actions, ticket);
      }
    }
  }

  private evaluateConditions(
    conditions: WorkflowCondition[],
    ticket: Ticket
  ): boolean {
    return conditions.every((condition) => {
      const fieldValue = (ticket as any)[condition.field];
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'contains':
          return String(fieldValue).includes(condition.value);
        case 'greaterThan':
          return Number(fieldValue) > Number(condition.value);
        case 'lessThan':
          return Number(fieldValue) < Number(condition.value);
        default:
          return false;
      }
    });
  }

  private async executeActions(
    actions: WorkflowAction[],
    ticket: Ticket
  ): Promise<void> {
    for (const action of actions) {
      switch (action.type) {
        case 'assign':
          await api.patch(`/api/tickets/${ticket.id}/assign`, {
            agentId: action.params.agentId,
          });
          break;
        case 'setStatus':
          await api.patch(`/api/tickets/${ticket.id}/status`, {
            status: action.params.status,
          });
          break;
        // ... other actions
      }
    }
  }
}
```

---

## 🔌 API-Erweiterungen

### 1. Batch Operations API

```typescript
// Backend API Endpoint
// POST /api/tickets/batch

interface BatchOperation {
  operation: 'updateStatus' | 'assign' | 'setPriority' | 'addTag' | 'delete';
  ticketIds: string[];
  params: Record<string, any>;
}

// Frontend Hook
export const useBatchTicketOperation = () => {
  return useMutation({
    mutationFn: async (operation: BatchOperation) => {
      return api.post('/api/tickets/batch', operation);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.list() });
    },
  });
};
```

### 2. Search API with Elasticsearch

```typescript
// GET /api/tickets/search?q=refund&fuzzy=true&fields=subject,summary

interface SearchParams {
  q: string;
  fuzzy?: boolean;
  fields?: string[];
  filters?: TicketFilters;
  limit?: number;
  offset?: number;
}

export const useTicketSearch = (params: SearchParams) => {
  return useQuery({
    queryKey: ['tickets', 'search', params],
    queryFn: async () => {
      const queryString = new URLSearchParams({
        q: params.q,
        ...(params.fuzzy && { fuzzy: 'true' }),
        ...(params.fields && { fields: params.fields.join(',') }),
      }).toString();
      
      return api.get(`/api/tickets/search?${queryString}`, {
        params: params.filters,
      });
    },
    enabled: !!params.q && params.q.length > 2,
  });
};
```

---

## 🗄️ State-Management

### Zustand Store für Ticket State

```typescript
// apps/admin/src/lib/store/ticketStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface TicketStore {
  // UI State
  viewMode: 'list' | 'kanban' | 'calendar';
  selectedTicketId: string | null;
  selectedTicketIds: Set<string>;
  filters: TicketFilters;
  sortOptions: TicketSortOptions;
  
  // Actions
  setViewMode: (mode: 'list' | 'kanban' | 'calendar') => void;
  selectTicket: (id: string) => void;
  toggleTicketSelection: (id: string) => void;
  setFilters: (filters: TicketFilters) => void;
  setSortOptions: (options: TicketSortOptions) => void;
  
  // Presets
  savedFilters: Record<string, TicketFilters>;
  saveFilterPreset: (name: string, filters: TicketFilters) => void;
  loadFilterPreset: (name: string) => void;
}

export const useTicketStore = create<TicketStore>()(
  devtools(
    persist(
      (set) => ({
        viewMode: 'list',
        selectedTicketId: null,
        selectedTicketIds: new Set(),
        filters: {},
        sortOptions: { field: 'updatedAt', order: 'desc' },
        savedFilters: {},
        
        setViewMode: (mode) => set({ viewMode: mode }),
        selectTicket: (id) => set({ selectedTicketId: id }),
        toggleTicketSelection: (id) =>
          set((state) => {
            const newSet = new Set(state.selectedTicketIds);
            if (newSet.has(id)) {
              newSet.delete(id);
            } else {
              newSet.add(id);
            }
            return { selectedTicketIds: newSet };
          }),
        setFilters: (filters) => set({ filters }),
        setSortOptions: (options) => set({ sortOptions: options }),
        
        saveFilterPreset: (name, filters) =>
          set((state) => ({
            savedFilters: { ...state.savedFilters, [name]: filters },
          })),
        loadFilterPreset: (name) =>
          set((state) => {
            const filters = state.savedFilters[name];
            return filters ? { filters } : state;
          }),
      }),
      {
        name: 'ticket-store',
        partialize: (state) => ({
          viewMode: state.viewMode,
          filters: state.filters,
          sortOptions: state.sortOptions,
          savedFilters: state.savedFilters,
        }),
      }
    )
  )
);
```

---

## ⚡ Real-time Verbesserungen

### Optimierte WebSocket Connection

```typescript
// apps/admin/src/lib/realtime/hooks/useRealtimeTickets.ts

export function useRealtimeTickets(options: RealtimeOptions) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!options.enabled) return;

    const socket = io(REALTIME_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: maxReconnectAttempts,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
      
      // Subscribe to ticket updates
      socket.emit('subscribe:tickets', {
        filters: options.filters,
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Batch events for performance
    const eventBuffer: TicketEvent[] = [];
    let batchTimeout: NodeJS.Timeout;

    socket.on('ticket:created', (event: TicketEvent) => {
      eventBuffer.push(event);
      
      // Debounce batch processing
      clearTimeout(batchTimeout);
      batchTimeout = setTimeout(() => {
        processBatchEvents(eventBuffer);
        eventBuffer.length = 0;
      }, 100);
    });

    socket.on('ticket:updated', (event: TicketEvent) => {
      // Optimistic update
      queryClient.setQueryData(
        queryKeys.tickets.detail(event.ticketId),
        (old: any) => {
          if (!old) return old;
          return { ...old, ...event.updates };
        }
      );
      
      options.onUpdated?.(event);
    });

    return () => {
      socket.disconnect();
      clearTimeout(batchTimeout);
    };
  }, [options.enabled, options.filters]);

  function processBatchEvents(events: TicketEvent[]) {
    // Process multiple events at once for better performance
    queryClient.setQueryData(queryKeys.tickets.list(), (old: any) => {
      // Batch update logic
      return old;
    });
  }

  return { isConnected };
}
```

---

## 📝 Nächste Schritte

1. **Code-Review**: Review der vorgeschlagenen Patterns
2. **Prototyping**: Erstellen von Prototypen für kritische Features
3. **Testing**: Unit-Tests für neue Komponenten
4. **Documentation**: Dokumentation der neuen APIs
5. **Migration**: Schrittweise Migration bestehender Komponenten

---

*Erstellt: 2025-01-XX*
*Version: 1.0*
