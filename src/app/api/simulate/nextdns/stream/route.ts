import { simulation } from "@/lib/simulation-engine";

/**
 * GET /api/simulate/nextdns/stream
 *
 * Server-Sent Events (SSE) endpoint that streams DNS events in real-time.
 * Generates a new random event every 3-8 seconds to simulate live traffic.
 *
 * Connect with:
 *   const es = new EventSource("/api/simulate/nextdns/stream");
 *   es.onmessage = (e) => console.log(JSON.parse(e.data));
 */
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let running = true;

      const sendEvent = () => {
        if (!running) return;

        const entry = simulation.generateDnsEvent();
        const data = `data: ${JSON.stringify(entry)}\n\n`;

        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          running = false;
          return;
        }

        // Next event in 3-8 seconds
        const delay = 3000 + Math.random() * 5000;
        setTimeout(sendEvent, delay);
      };

      // Send first event immediately
      sendEvent();

      // Clean up if client disconnects (controller will error on enqueue)
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
