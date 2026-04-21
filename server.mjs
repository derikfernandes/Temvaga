import express from 'express';
import { forwardVertexGenerate } from './vertex-proxy-logic.mjs';

const app = express();
app.use(express.json({ limit: '20mb' }));

/** GET leve para testar se o proxy está no ar (sem chamar Vertex). */
app.get('/api/vertex/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'vertex-proxy',
    port: Number(process.env.VERTEX_PROXY_PORT || 8787),
  });
});

app.post('/api/vertex/generate', async (req, res) => {
  try {
    const result = await forwardVertexGenerate(req.body);
    return res.status(result.status).json(result.payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[vertex-proxy]', message);
    return res.status(500).json({ error: message });
  }
});

app.use((err, req, res, _next) => {
  if (res.headersSent) return;
  console.error('[vertex-proxy] Erro não tratado:', err);
  const message = err instanceof Error ? err.message : String(err);
  res.status(500).json({ error: message });
});

const port = Number(process.env.VERTEX_PROXY_PORT || 8787);
app.listen(port, '127.0.0.1', () => {
  console.log(`Vertex proxy listening on http://127.0.0.1:${port}`);
  console.log(`Health check: http://127.0.0.1:${port}/api/vertex/health`);
});
