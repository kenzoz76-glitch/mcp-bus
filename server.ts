import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import healthHandler from './api/health.js';
import busArrivalHandler from './api/bus-arrival.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Adapt Vercel-style (req, res) handler to Express
  const adapt = (handler: (req: Request, res: Response) => Promise<unknown> | unknown) => {
    return async (req: Request, res: Response) => {
      try {
        await handler(req, res);
      } catch (err) {
        console.error('API Error:', err);
        if (!res.headersSent) {
          res.status(500).json({
            error: 'Internal Server Error',
            message: err instanceof Error ? err.message : String(err),
          });
        }
      }
    };
  };

  // Mount API endpoints under /api
  app.all('/api/health', adapt(healthHandler));
  app.all('/api/bus-arrival', adapt(busArrivalHandler));
  app.all('/api/busArrival', adapt(busArrivalHandler));

  if (!isProd) {
    // Mount Vite middlewares in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MetroPulse server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
