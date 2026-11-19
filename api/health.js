export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.status(200).json({
    status: 'ok',
    runtime: 'vercel-web-host',
    torRoutingActive: false,
    message: 'Web hosting environment active. Local Tor SOCKS5 proxy must be configured via the desktop runtime.',
    timestamp: new Date().toISOString()
  });
}
