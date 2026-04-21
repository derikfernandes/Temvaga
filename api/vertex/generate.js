import { forwardVertexGenerate } from '../../vertex-proxy-logic.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const result = await forwardVertexGenerate(req.body);
    res.status(result.status).json(result.payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[vertex-proxy]', message);
    res.status(500).json({ error: message });
  }
}
