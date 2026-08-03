'use client';

import { useEffect, useRef } from 'react';

/**
 * Singleton Realtime Connection Manager
 * Shares 1 single SSE connection & 1 BroadcastChannel across all mounted components.
 * Prevents exhausting browser HTTP connection socket limits (max 6 sockets in HTTP/1.1).
 */
type Listener = (data: any) => void;
const listeners = new Set<Listener>();

let sharedEventSource: EventSource | null = null;
let sharedBroadcastChannel: BroadcastChannel | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let isConnecting = false;

function notifyListeners(data: any) {
  listeners.forEach((fn) => {
    try {
      fn(data);
    } catch (e) {
      console.error('[RealtimeSync] Callback error:', e);
    }
  });
}

function initSharedConnection() {
  if (typeof window === 'undefined') return;

  // 1. BroadcastChannel (Cross-tab instant sync)
  if (!sharedBroadcastChannel && 'BroadcastChannel' in window) {
    try {
      sharedBroadcastChannel = new BroadcastChannel('husnul_kamal_realtime');
      sharedBroadcastChannel.onmessage = (event) => {
        if (event.data) {
          notifyListeners(event.data);
        }
      };
    } catch (e) {}
  }

  // 2. Singleton EventSource (Server-to-client broadcast)
  if (!sharedEventSource && !isConnecting && 'EventSource' in window && listeners.size > 0) {
    isConnecting = true;
    try {
      const es = new EventSource('/api/realtime');
      sharedEventSource = es;

      es.onopen = () => {
        isConnecting = false;
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type !== 'connected') {
            notifyListeners(data);
            sharedBroadcastChannel?.postMessage(data);
          }
        } catch {
          // ignore keep-alive pings
        }
      };

      es.onerror = () => {
        isConnecting = false;
        es.close();
        if (sharedEventSource === es) sharedEventSource = null;

        if (reconnectTimer) clearTimeout(reconnectTimer);
        if (listeners.size > 0) {
          reconnectTimer = setTimeout(initSharedConnection, 5000);
        }
      };
    } catch (e) {
      isConnecting = false;
    }
  }
}

function closeSharedConnectionIfIdle() {
  if (listeners.size === 0) {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (sharedEventSource) {
      sharedEventSource.close();
      sharedEventSource = null;
    }
    if (sharedBroadcastChannel) {
      sharedBroadcastChannel.close();
      sharedBroadcastChannel = null;
    }
    isConnecting = false;
  }
}

// Pause connection when tab is hidden to save battery & network
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (sharedEventSource) {
        sharedEventSource.close();
        sharedEventSource = null;
      }
    } else {
      if (listeners.size > 0) {
        initSharedConnection();
      }
    }
  });
}

/**
 * useRealtimeSync hook for components to subscribe to SSE updates.
 */
export function useRealtimeSync(onUpdate: (data: any) => void) {
  const callbackRef = useRef(onUpdate);

  useEffect(() => {
    callbackRef.current = onUpdate;
  });

  useEffect(() => {
    const handleUpdate: Listener = (data) => {
      callbackRef.current?.(data);
    };

    listeners.add(handleUpdate);
    initSharedConnection();

    return () => {
      listeners.delete(handleUpdate);
      closeSharedConnectionIfIdle();
    };
  }, []);
}
