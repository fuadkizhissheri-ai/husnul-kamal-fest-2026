import { EventEmitter } from 'events';

// Global singleton event emitter across Next.js API routes
declare global {
  var __realtimeEmitter: EventEmitter | undefined;
}

export const realtimeEmitter =
  globalThis.__realtimeEmitter || new EventEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__realtimeEmitter = realtimeEmitter;
}

export function broadcastRealtimeChange(eventType: string, payload: any = {}) {
  try {
    realtimeEmitter.emit('realtime_change', {
      type: eventType,
      payload,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error('Error broadcasting realtime event:', err);
  }
}
