import type { Ticket, TicketStatus, TicketPriority, TicketCategory, TicketMessage } from '@nebula/shared/types';

export type TicketViewMode = 'list' | 'kanban' | 'calendar';

export interface TicketFilters {
  search?: string;
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  assignedAgent?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  tags?: string[];
  slaOverdue?: boolean;
}

export interface TicketSortOptions {
  field: 'createdAt' | 'updatedAt' | 'priority' | 'status' | 'subject';
  order: 'asc' | 'desc';
}

export interface BulkAction {
  type: 'status' | 'priority' | 'assign' | 'tag' | 'delete';
  value: any;
  ticketIds: string[];
}

export interface TicketReply {
  message: string;
  isPrivate?: boolean;
  attachments?: File[];
  templateId?: string;
}

export interface TicketAssignment {
  ticketId: string;
  agentId: string;
  agentName: string;
}

export interface TicketStats {
  total: number;
  open: number;
  waiting: number;
  inProgress: number;
  escalated: number;
  done: number;
  doneToday: number;
  avgFirstResponseMinutes: number;
  avgResolutionMinutes: number;
  slaCompliance: number;
  byCategory: Record<TicketCategory, number>;
  byPriority: Record<TicketPriority, number>;
  satisfactionScore: number;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  activeTickets: number;
  status: 'online' | 'away' | 'offline';
}

export interface TicketTemplate {
  id: string;
  name: string;
  content: string;
  category?: TicketCategory;
  tags?: string[];
}


