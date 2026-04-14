import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const proxyPort = env.VERTEX_PROXY_PORT || '8787';
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${proxyPort}`,
          changeOrigin: true,
          configure(proxy) {
            proxy.on('error', (err, _req, res) => {
              const msg =
                err && typeof err === 'object' && 'message' in err
                  ? String((err as NodeJS.ErrnoException).message)
                  : String(err);
              const code =
                err && typeof err === 'object' && 'code' in err
                  ? String((err as NodeJS.ErrnoException).code)
                  : '';
              const body = JSON.stringify({
                error:
                  'Não foi possível conectar ao proxy Vertex. Confira se outro terminal está rodando: npm run dev:api',
                details: {
                  target: `127.0.0.1:${proxyPort}`,
                  errno: code || undefined,
                  message: msg,
                },
              });
              if (res && !res.headersSent && typeof (res as import('http').ServerResponse).writeHead === 'function') {
                (res as import('http').ServerResponse).writeHead(502, {
                  'Content-Type': 'application/json',
                  'Content-Length': Buffer.byteLength(body),
                });
                (res as import('http').ServerResponse).end(body);
              }
            });
          },
        },
      },
    },
  };
});
