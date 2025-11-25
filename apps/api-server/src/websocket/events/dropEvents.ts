import { Socket } from 'socket.io';

export interface DropEventData {
  dropId: string;
  drop: any;
  changes?: any;
  timestamp: string;
  adminId?: string;
}

export interface DropCreatedEvent extends DropEventData {
  type: 'drop:created';
}

export interface DropUpdatedEvent extends DropEventData {
  type: 'drop:updated';
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

export interface DropDeletedEvent extends DropEventData {
  type: 'drop:deleted';
}

export interface DropStockChangedEvent extends DropEventData {
  type: 'drop:stock_changed';
  variantId: string;
  oldStock: number;
  newStock: number;
}

export interface DropStatusChangedEvent extends DropEventData {
  type: 'drop:status_changed';
  oldStatus: string;
  newStatus: string;
}

export type DropEvent = 
  | DropCreatedEvent 
  | DropUpdatedEvent 
  | DropDeletedEvent 
  | DropStockChangedEvent 
  | DropStatusChangedEvent;

// Event handler types
export interface DropEventHandlers {
  'drop:created': (data: DropCreatedEvent) => void;
  'drop:updated': (data: DropUpdatedEvent) => void;
  'drop:deleted': (data: DropDeletedEvent) => void;
  'drop:stock_changed': (data: DropStockChangedEvent) => void;
  'drop:status_changed': (data: DropStatusChangedEvent) => void;
}

// Subscription data types
export interface DropSubscriptionData {
  dropIds?: string[];
  filters?: {
    status?: string;
    access?: string;
    search?: string;
  };
}

export interface DropEventManager {
  subscribeToDrops(socket: Socket, data: DropSubscriptionData): void;
  subscribeToDrop(socket: Socket, dropId: string): void;
  unsubscribeFromDrops(socket: Socket): void;
  unsubscribeFromDrop(socket: Socket, dropId: string): void;
}

export class DropEventManagerImpl implements DropEventManager {
  subscribeToDrops(socket: Socket, data: DropSubscriptionData): void {
    // Join general drops room
    socket.join('drops:all');
    
    // Join filter-specific rooms
    if (data.filters) {
      Object.entries(data.filters).forEach(([key, value]) => {
        if (value) {
          socket.join(`drops:filter:${key}:${value}`);
        }
      });
    }
    
    // Join specific drop rooms
    if (data.dropIds) {
      data.dropIds.forEach(dropId => {
        socket.join(`drop:${dropId}`);
      });
    }
  }

  subscribeToDrop(socket: Socket, dropId: string): void {
    socket.join(`drop:${dropId}`);
  }

  unsubscribeFromDrops(socket: Socket): void {
    socket.leave('drops:all');
    // Leave all filter rooms
    const rooms = Array.from(socket.rooms);
    rooms.forEach(room => {
      if (room.startsWith('drops:filter:') || room.startsWith('drop:')) {
        socket.leave(room);
      }
    });
  }

  unsubscribeFromDrop(socket: Socket, dropId: string): void {
    socket.leave(`drop:${dropId}`);
  }
}

export const dropEventManager = new DropEventManagerImpl();






