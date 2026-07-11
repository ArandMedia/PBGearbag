import type { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';

let handler: any;

export default async function api(req: VercelRequest, res: VercelResponse) {
  if (!handler) {
    try {
      const { createApp } = await import('../src/main');
      const app = await createApp();
      handler = serverless(app.getHttpAdapter().getInstance());
    } catch (error: any) {
      console.error('Nest bootstrap failed', error);
      res.status(503).json({ message: 'API bootstrap failed', detail: error?.message || 'Unknown startup error' });
      return;
    }
  }
  return handler(req, res);
}
