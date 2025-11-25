import { Server } from 'socket.io';

export type ShopEvent =
  | { type: 'product:created'; product: any; timestamp: string }
  | { type: 'product:restocked'; productId: string; stock: number; timestamp: string }
  | { type: 'product:trending'; productId: string; score: number; timestamp: string }
  | { type: 'product:hyped'; productId: string; score: number; timestamp: string }
  | { type: 'event:created'; event: any; timestamp: string }
  | { type: 'event:starting_soon'; eventId: string; startsAt: string; inMinutes: number; timestamp: string }
  | { type: 'event:live'; eventId: string; timestamp: string }
  | { type: 'event:updated'; event: any; timestamp: string };

export function emitShopEvent(io: Server, event: ShopEvent) {
  io.emit(event.type, event);
}








