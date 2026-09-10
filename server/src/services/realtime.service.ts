import { Request, Response } from 'express';

const clients = new Set<Response>();

export function subscribeToUpdates(req: Request, res: Response): void {
  res.status(200).set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write('event: connected\ndata: {}\n\n');
  clients.add(res);

  const heartbeat = setInterval(() => res.write(': keepalive\n\n'), 25000);
  req.on('close', () => { clearInterval(heartbeat); clients.delete(res); });
}

export function publishUpdate(scope: 'content' | 'orders' | 'accounts' = 'content'): void {
  const payload = `event: update\ndata: ${JSON.stringify({ scope, at: Date.now() })}\n\n`;
  for (const client of clients) client.write(payload);
}
