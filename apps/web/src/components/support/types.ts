export interface Message {
  id: string;
  text: string;
  from: 'user' | 'agent' | 'system';
  timestamp: string;
  senderName?: string;
}

export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'done';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TicketData {
  id: string;
  userId: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  messages: Message[];
  category?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const categories: Category[] = [
  { id: 'order', name: 'Bestellung', icon: '🛒', color: 'from-blue-500 to-cyan-500' },
  { id: 'payment', name: 'Zahlung', icon: '💳', color: 'from-green-500 to-emerald-500' },
  { id: 'shipping', name: 'Versand', icon: '📦', color: 'from-orange-500 to-amber-500' },
  { id: 'return', name: 'Rückgabe', icon: '🔄', color: 'from-purple-500 to-pink-500' },
  { id: 'technical', name: 'Technisch', icon: '🐛', color: 'from-red-500 to-rose-500' },
  { id: 'other', name: 'Sonstiges', icon: '💬', color: 'from-gray-500 to-slate-500' }
];
