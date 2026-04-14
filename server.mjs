import express from 'express';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
app.use(express.json({ limit: '20mb' }));

const TOKEN_URL = 'https://accounts.google.com/o/oauth2/token';

let cachedAccessToken = null;
let cachedTokenExpiresAt = 0;

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

async function getVertexAccessToken() {
  const now = Date.now();
  if (cachedAccessToken && cachedTokenExpiresAt > now + 60_000) {
    return cachedAccessToken;
  }

  const clientId = getRequiredEnv('GOOGLE_OAUTH_CLIENT_ID');
  const clientSecret = getRequiredEnv('GOOGLE_OAUTH_CLIENT_SECRET');
  const refreshToken = getRequiredEnv('GOOGLE_OAUTH_REFRESH_TOKEN');

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const payload = await response.json();
  if (!response.ok || !payload.access_token) {
    const message = payload?.error_description || payload?.error || 'Failed to get access token';
    throw new Error(`OAuth token request failed: ${message}`);
  }

  cachedAccessToken = payload.access_token;
  const expiresInSec = Number(payload.expires_in || 3600);
  cachedTokenExpiresAt = Date.now() + expiresInSec * 1000;
  return cachedAccessToken;
}

function getVertexUrl() {
  const projectId = getRequiredEnv('VERTEX_PROJECT_ID');
  const location = process.env.VERTEX_LOCATION || 'us-central1';
  const model = process.env.VERTEX_MODEL || 'gemini-2.5-flash';
  return `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;
}

app.post('/api/vertex/generate', async (req, res) => {
  try {
    const accessToken = await getVertexAccessToken();
    const url = getVertexUrl();

    const upstreamResponse = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const upstreamPayload = await upstreamResponse.json();

    if (!upstreamResponse.ok) {
      return res.status(upstreamResponse.status).json({
        error: 'Vertex request failed',
        details: upstreamPayload,
      });
    }

    return res.json(upstreamPayload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

const port = Number(process.env.VERTEX_PROXY_PORT || 8787);
app.listen(port, () => {
  console.log(`Vertex proxy listening on http://localhost:${port}`);
});
