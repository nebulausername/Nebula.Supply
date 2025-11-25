# 🛠️ Ticket-System Implementierungs-Guide

## 🎯 Quick Start: Phase 1 Implementierung

### 1. Performance Optimierungen - Sofort umsetzbar

#### 1.1 Infinite Scrolling Implementation

```typescript
// apps/admin/src/lib/api/hooks.ts
export const useTicketsInfinite = (filters?: TicketFilters) => {
  return useInfiniteQuery({
    queryKey: queryKeys.tickets.list(filters),
    queryFn: async ({ pageParam = 0 }) => {
      const response = await api.getPaginated('/api/tickets', {
        ...filters,
        limit: 50,
        offset: pageParam * 50,
      });
      return response;
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.pagination?.hasMore) {
        return pages.length;
      }
      return undefined;
    },
    initialPageParam: 0,
    staleTime: 30 * 1000,
  });
};
```

```typescript
// apps/admin/src/components/tickets/TicketListView.tsx
import { useTicketsInfinite } from '../../lib/api/hooks';
import { useInView } from 'react-intersection-observer';

export function TicketListView() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useTicketsInfinite(filters);
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const tickets = data?.pages.flatMap(page => page.data) ?? [];

  return (
    <div>
      {tickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)}
      <div ref={ref}>
        {isFetchingNextPage && <LoadingSpinner />}
      </div>
    </div>
  );
}
```

#### 1.2 Search Debouncing

```typescript
// apps/admin/src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

```typescript
// apps/admin/src/components/tickets/TicketFilters.tsx
import { useDebounce } from '../../hooks/useDebounce';

export function TicketFilters({ filters, onFiltersChange }) {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    onFiltersChange({ ...filters, search: debouncedSearch });
  }, [debouncedSearch]);

  return (
    <input
      value={searchInput}
      onChange={(e) => setSearchInput(e.target.value)}
      placeholder="Search tickets..."
    />
  );
}
```

#### 1.3 Memoization Optimierung

```typescript
// apps/admin/src/components/tickets/TicketCard.tsx
import { memo, useMemo } from 'react';

export const TicketCard = memo(function TicketCard({ ticket, onSelect, isSelected }) {
  const statusColor = useMemo(() => {
    const colors = {
      open: 'bg-green-500/10',
      in_progress: 'bg-blue-500/10',
      done: 'bg-gray-500/10',
    };
    return colors[ticket.status] || 'bg-gray-500/10';
  }, [ticket.status]);

  const formattedDate = useMemo(() => {
    return new Date(ticket.createdAt).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, [ticket.createdAt]);

  return (
    <div className={cn('ticket-card', statusColor, isSelected && 'ring-2 ring-accent')}>
      {/* Card content */}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.ticket.id === nextProps.ticket.id &&
    prevProps.ticket.status === nextProps.ticket.status &&
    prevProps.ticket.updatedAt === nextProps.ticket.updatedAt &&
    prevProps.isSelected === nextProps.isSelected
  );
});
```

### 2. UX Verbesserungen - Sofort umsetzbar

#### 2.1 Saved Filters

```typescript
// apps/admin/src/hooks/useSavedFilters.ts
import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface SavedFilter {
  id: string;
  name: string;
  filters: TicketFilters;
  createdAt: Date;
}

export function useSavedFilters() {
  const [savedFilters, setSavedFilters] = useLocalStorage<SavedFilter[]>('ticket-saved-filters', []);

  const saveFilter = useCallback((name: string, filters: TicketFilters) => {
    const newFilter: SavedFilter = {
      id: crypto.randomUUID(),
      name,
      filters,
      createdAt: new Date(),
    };
    setSavedFilters(prev => [...prev, newFilter]);
  }, [setSavedFilters]);

  const deleteFilter = useCallback((id: string) => {
    setSavedFilters(prev => prev.filter(f => f.id !== id));
  }, [setSavedFilters]);

  const loadFilter = useCallback((id: string): TicketFilters | null => {
    const filter = savedFilters.find(f => f.id === id);
    return filter?.filters || null;
  }, [savedFilters]);

  return {
    savedFilters,
    saveFilter,
    deleteFilter,
    loadFilter,
  };
}
```

```typescript
// apps/admin/src/components/tickets/SavedFiltersMenu.tsx
export function SavedFiltersMenu({ onLoadFilter }) {
  const { savedFilters, deleteFilter, loadFilter } = useSavedFilters();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="outline">Saved Filters</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {savedFilters.map(filter => (
          <DropdownMenuItem key={filter.id}>
            <div className="flex items-center justify-between w-full">
              <span onClick={() => onLoadFilter(loadFilter(filter.id))}>
                {filter.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteFilter(filter.id)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

#### 2.2 Ticket Templates

```typescript
// apps/admin/src/components/tickets/TicketTemplates.tsx
export interface TicketTemplate {
  id: string;
  name: string;
  subject: string;
  summary: string;
  category: TicketCategory;
  priority: TicketPriority;
  tags: string[];
  message: string;
}

export function TicketTemplates({ onSelectTemplate }) {
  const [templates, setTemplates] = useState<TicketTemplate[]>([]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map(template => (
        <Card
          key={template.id}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onSelectTemplate(template)}
        >
          <CardHeader>
            <CardTitle>{template.name}</CardTitle>
            <CardDescription>{template.category}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {template.summary}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

#### 2.3 Enhanced Keyboard Shortcuts

```typescript
// apps/admin/src/hooks/useTicketShortcuts.ts
export function useTicketShortcuts({
  onCreateTicket,
  onNextTicket,
  onPrevTicket,
  onSelectTicket,
  onToggleFilters,
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Command Palette (Cmd/Ctrl + K)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Open command palette
        return;
      }

      // Quick Actions
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onCreateTicket();
      }

      // Navigation
      if (e.key === 'j' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onNextTicket();
      }

      if (e.key === 'k' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onPrevTicket();
      }

      // Filters
      if (e.key === 'f' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onToggleFilters();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCreateTicket, onNextTicket, onPrevTicket, onToggleFilters]);
}
```

### 3. Feature Erweiterungen - Core Features

#### 3.1 Internal Notes System

```typescript
// apps/admin/src/components/tickets/TicketNotes.tsx (erweitert)
export function TicketNotes({ ticketId }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);

  const addNote = useCallback(async () => {
    if (!newNote.trim()) return;

    const note: Note = {
      id: crypto.randomUUID(),
      ticketId,
      content: newNote,
      isPrivate,
      authorId: currentUser.id,
      authorName: currentUser.name,
      createdAt: new Date(),
    };

    // Optimistic update
    setNotes(prev => [note, ...prev]);
    setNewNote('');

    try {
      await api.post(`/api/tickets/${ticketId}/notes`, note);
    } catch (error) {
      // Rollback on error
      setNotes(prev => prev.filter(n => n.id !== note.id));
      toast.error('Failed to add note');
    }
  }, [newNote, isPrivate, ticketId]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add internal note..."
          rows={3}
        />
        <div className="flex flex-col gap-2">
          <Button onClick={addNote}>Add Note</Button>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
            Private
          </label>
        </div>
      </div>

      <div className="space-y-2">
        {notes.map(note => (
          <Card key={note.id} className="p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{note.authorName}</span>
                  {note.isPrivate && (
                    <Badge variant="secondary" className="text-xs">Private</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(note.createdAt, { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm">{note.content}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

#### 3.2 @Mentions System

```typescript
// apps/admin/src/components/tickets/MentionInput.tsx
import { Mention, MentionsInput } from 'react-mentions';

export function MentionInput({ value, onChange, placeholder }) {
  const [agents, setAgents] = useState<Agent[]>([]);

  const fetchAgents = useCallback(async (query: string) => {
    const response = await api.get(`/api/agents?search=${query}`);
    setAgents(response.data);
  }, []);

  return (
    <MentionsInput
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="mentions-input"
    >
      <Mention
        trigger="@"
        data={agents.map(agent => ({
          id: agent.id,
          display: agent.name,
        }))}
        displayTransform={(id, display) => `@${display}`}
        onAdd={(id) => {
          // Notify mentioned agent
          api.post('/api/notifications', {
            type: 'mention',
            agentId: id,
            ticketId: currentTicketId,
          });
        }}
      />
    </MentionsInput>
  );
}
```

#### 3.3 Auto-Assignment Rules

```typescript
// apps/admin/src/components/tickets/AutoAssignmentRules.tsx
export interface AssignmentRule {
  id: string;
  name: string;
  conditions: {
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  }[];
  action: {
    type: 'assign' | 'set_priority' | 'add_tag';
    value: any;
  };
  enabled: boolean;
}

export function AutoAssignmentRules() {
  const [rules, setRules] = useState<AssignmentRule[]>([]);

  const addRule = useCallback(() => {
    const newRule: AssignmentRule = {
      id: crypto.randomUUID(),
      name: 'New Rule',
      conditions: [],
      action: { type: 'assign', value: null },
      enabled: true,
    };
    setRules(prev => [...prev, newRule]);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2>Auto-Assignment Rules</h2>
        <Button onClick={addRule}>Add Rule</Button>
      </div>

      {rules.map(rule => (
        <Card key={rule.id} className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Input
              value={rule.name}
              onChange={(e) => updateRule(rule.id, { name: e.target.value })}
            />
            <Switch
              checked={rule.enabled}
              onCheckedChange={(checked) => updateRule(rule.id, { enabled: checked })}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Conditions</h3>
            {rule.conditions.map((condition, index) => (
              <div key={index} className="flex gap-2">
                <Select value={condition.field}>
                  <option value="category">Category</option>
                  <option value="priority">Priority</option>
                  <option value="tags">Tags</option>
                </Select>
                <Select value={condition.operator}>
                  <option value="equals">Equals</option>
                  <option value="contains">Contains</option>
                </Select>
                <Input value={condition.value} />
              </div>
            ))}
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2">Action</h3>
            <Select value={rule.action.type}>
              <option value="assign">Assign to Agent</option>
              <option value="set_priority">Set Priority</option>
              <option value="add_tag">Add Tag</option>
            </Select>
          </div>
        </Card>
      ))}
    </div>
  );
}
```

### 4. Analytics & Reporting

#### 4.1 Custom Dashboard Widgets

```typescript
// apps/admin/src/components/tickets/dashboard/TicketMetricsWidget.tsx
export function TicketMetricsWidget({ timeRange = '7d' }) {
  const { data: metrics } = useQuery({
    queryKey: ['tickets', 'metrics', timeRange],
    queryFn: () => api.get(`/api/tickets/metrics?range=${timeRange}`),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Total Tickets"
            value={metrics?.total}
            change={metrics?.totalChange}
          />
          <MetricCard
            label="Avg Response Time"
            value={formatDuration(metrics?.avgResponseTime)}
            change={metrics?.responseTimeChange}
          />
          <MetricCard
            label="Resolution Rate"
            value={`${metrics?.resolutionRate}%`}
            change={metrics?.resolutionRateChange}
          />
          <MetricCard
            label="Satisfaction"
            value={metrics?.satisfactionScore?.toFixed(1)}
            change={metrics?.satisfactionChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 4.2 Trend Charts

```typescript
// apps/admin/src/components/tickets/TicketTrendChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export function TicketTrendChart({ timeRange = '30d' }) {
  const { data: trends } = useQuery({
    queryKey: ['tickets', 'trends', timeRange],
    queryFn: () => api.get(`/api/tickets/trends?range=${timeRange}`),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <LineChart width={800} height={300} data={trends}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="created" stroke="#8884d8" />
          <Line type="monotone" dataKey="resolved" stroke="#82ca9d" />
          <Line type="monotone" dataKey="escalated" stroke="#ff7300" />
        </LineChart>
      </CardContent>
    </Card>
  );
}
```

### 5. Integration Examples

#### 5.1 Email Integration

```typescript
// apps/admin/src/lib/integrations/email.ts
export class EmailIntegration {
  async createTicketFromEmail(email: EmailMessage): Promise<Ticket> {
    const ticket = await api.post('/api/tickets', {
      subject: email.subject,
      summary: email.body,
      category: this.detectCategory(email),
      priority: this.detectPriority(email),
      channel: 'email',
      emailThreadId: email.threadId,
      customerEmail: email.from,
    });

    // Link email to ticket
    await api.post(`/api/tickets/${ticket.id}/emails`, {
      emailId: email.id,
      direction: 'inbound',
    });

    return ticket;
  }

  async sendEmailReply(ticketId: string, message: string): Promise<void> {
    const ticket = await api.get(`/api/tickets/${ticketId}`);
    
    await emailService.send({
      to: ticket.customerEmail,
      subject: `Re: ${ticket.subject}`,
      body: message,
      threadId: ticket.emailThreadId,
    });

    await api.post(`/api/tickets/${ticketId}/messages`, {
      content: message,
      channel: 'email',
      direction: 'outbound',
    });
  }

  private detectCategory(email: EmailMessage): TicketCategory {
    // Simple keyword-based detection
    const subject = email.subject.toLowerCase();
    if (subject.includes('order') || subject.includes('bestellung')) return 'order';
    if (subject.includes('payment') || subject.includes('zahlung')) return 'payment';
    if (subject.includes('shipping') || subject.includes('versand')) return 'shipping';
    return 'other';
  }

  private detectPriority(email: EmailMessage): TicketPriority {
    const urgentKeywords = ['urgent', 'dringend', 'asap', 'critical'];
    const subject = email.subject.toLowerCase();
    if (urgentKeywords.some(kw => subject.includes(kw))) return 'high';
    return 'medium';
  }
}
```

#### 5.2 Slack Integration

```typescript
// apps/admin/src/lib/integrations/slack.ts
export class SlackIntegration {
  async notifyTicketCreated(ticket: Ticket): Promise<void> {
    await slackClient.postMessage({
      channel: '#tickets',
      text: `New ticket created: ${ticket.subject}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${ticket.subject}*\n${ticket.summary}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View Ticket' },
              url: `https://admin.example.com/tickets/${ticket.id}`,
            },
          ],
        },
      ],
    });
  }

  async createTicketFromSlack(message: SlackMessage): Promise<Ticket> {
    const ticket = await api.post('/api/tickets', {
      subject: message.text,
      summary: message.text,
      channel: 'slack',
      slackThreadId: message.threadTs,
    });

    await slackClient.postMessage({
      channel: message.channel,
      threadTs: message.ts,
      text: `Ticket created: #${ticket.id}`,
    });

    return ticket;
  }
}
```

---

## 📋 Checkliste für Implementierung

### Phase 1: Quick Wins (Woche 1-2)
- [ ] Infinite Scrolling implementieren
- [ ] Search Debouncing
- [ ] Memoization Optimierung
- [ ] Code Splitting
- [ ] Loading States verbessern
- [ ] Error Handling verbessern

### Phase 2: Core Features (Woche 3-6)
- [ ] Saved Filters
- [ ] Ticket Templates
- [ ] Internal Notes
- [ ] @Mentions System
- [ ] Enhanced Keyboard Shortcuts
- [ ] Auto-Assignment Rules (Basic)

### Phase 3: Advanced Features (Woche 7-12)
- [ ] Full-Text Search
- [ ] Calendar View
- [ ] Analytics Dashboard
- [ ] Email Integration
- [ ] Slack Integration
- [ ] Advanced Reporting

---

## 🎓 Best Practices

### Performance
1. **Immer memoization für teure Berechnungen**
2. **Debouncing für User Input**
3. **Lazy Loading für schwere Komponenten**
4. **Optimistic Updates für bessere UX**

### Code Quality
1. **TypeScript Strict Mode**
2. **Komponenten sollten single responsibility haben**
3. **Custom Hooks für wiederverwendbare Logik**
4. **Error Boundaries für Fehlerbehandlung**

### UX
1. **Immer Loading States zeigen**
2. **Optimistic Updates mit Rollback**
3. **Klare Error Messages**
4. **Accessibility beachten (ARIA, Keyboard Navigation)**

---

**Viel Erfolg bei der Implementierung! 🚀**
