export default function handler(_req, res) {
  res.json({
    ok: true,
    service: 'vertex-proxy',
    runtime: 'vercel',
  });
}
