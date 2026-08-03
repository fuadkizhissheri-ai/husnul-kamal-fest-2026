import { NextResponse } from 'next/server';
import { realtimeEmitter } from '@/lib/realtime';


export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`)
      );

      // Listener callback
      const onRealtimeChange = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (e) {
          // Stream closed
        }
      };

      realtimeEmitter.on('realtime_change', onRealtimeChange);

      // Keep-alive ping every 15 seconds to prevent timeout
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch (e) {
          clearInterval(keepAliveInterval);
        }
      }, 15000);

      // Clean up listener when client disconnects
      request.signal.addEventListener('abort', () => {
        realtimeEmitter.off('realtime_change', onRealtimeChange);
        clearInterval(keepAliveInterval);
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
