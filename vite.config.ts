import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function apiDevPlugin(): Plugin {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];
        if (!url || !url.startsWith('/api/')) {
          return next();
        }

        const customRes: any = res;
        customRes.status = (code: number) => {
          res.statusCode = code;
          return customRes;
        };
        customRes.json = (data: any) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return customRes;
        };

        let body: any = null;
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
          const chunks: any[] = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const raw = Buffer.concat(chunks).toString();
          try {
            body = raw ? JSON.parse(raw) : {};
          } catch {
            body = raw;
          }
        }
        (req as any).body = body;

        try {
          if (url === '/api/drivers/register') {
            const { default: handler } = await server.ssrLoadModule('./api/drivers/register.ts');
            return await handler(req, customRes);
          }
          if (url === '/api/drivers/login') {
            const { default: handler } = await server.ssrLoadModule('./api/drivers/login.ts');
            return await handler(req, customRes);
          }
          if (url === '/api/drivers') {
            const { default: handler } = await server.ssrLoadModule('./api/drivers/index.ts');
            return await handler(req, customRes);
          }
          if (url === '/api/admin/pending-drivers') {
            const { default: handler } = await server.ssrLoadModule('./api/admin/pending-drivers.ts');
            return await handler(req, customRes);
          }
          if (url === '/api/admin/all-drivers') {
            const { default: handler } = await server.ssrLoadModule('./api/admin/all-drivers.ts');
            return await handler(req, customRes);
          }
          if (url === '/api/admin/approve') {
            const { default: handler } = await server.ssrLoadModule('./api/admin/approve.ts');
            return await handler(req, customRes);
          }
          if (url === '/api/admin/reject') {
            const { default: handler } = await server.ssrLoadModule('./api/admin/reject.ts');
            return await handler(req, customRes);
          }
          if (url === '/api/upload') {
            const { default: handler } = await server.ssrLoadModule('./api/upload.ts');
            return await handler(req, customRes);
          }
          next();
        } catch (err: any) {
          console.error('[API Dev Middleware Error]', err);
          if (!res.writableEnded) {
            customRes.status(500).json({ error: err.message });
          }
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), apiDevPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
