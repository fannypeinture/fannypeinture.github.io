// Cloudflare Worker. The real phone number and Turnstile secret are deployment secrets.
// No contact number is included in the repository or delivered before server validation.
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const allowed = env.ALLOWED_ORIGIN || 'https://fannypeinture.montironi.fr';
    const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store, private', 'Vary': 'Origin', 'X-Content-Type-Options': 'nosniff' };
    const respond = (status, data) => new Response(JSON.stringify(data), { status, headers });
    if (origin !== allowed) return respond(403, { error: 'origin_denied' });
    headers['Access-Control-Allow-Origin'] = allowed;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return respond(405, { error: 'method_denied' });
    if (!env.TURNSTILE_SECRET || !env.PHONE_NUMBER || !env.PHONE_RATE_LIMITER) return respond(503, { error: 'unavailable' });
    if (!/^\+\d{8,15}$/.test(env.PHONE_NUMBER)) return respond(503, { error: 'unavailable' });
    if (!request.headers.get('Content-Type')?.includes('application/json')) return respond(415, { error: 'content_type' });
    if (Number(request.headers.get('Content-Length') || 0) > 4096) return respond(413, { error: 'too_large' });
    const ip = request.headers.get('CF-Connecting-IP');
    if (!ip) return respond(403, { error: 'denied' });
    try {
      const limited = await env.PHONE_RATE_LIMITER.limit({ key: ip });
      if (!limited.success) return respond(429, { error: 'rate_limited' });
      const raw = await request.text();
      if (raw.length > 4096) return respond(413, { error: 'too_large' });
      let body;
      try { body = JSON.parse(raw); } catch { return respond(400, { error: 'invalid_request' }); }
      if (typeof body.token !== 'string' || !body.token || body.token.length > 2048) return respond(400, { error: 'invalid_token' });
      const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: body.token, remoteip: ip })
      });
      if (!verify.ok) return respond(503, { error: 'verification_unavailable' });
      const result = await verify.json();
      if (!result.success || result.hostname !== new URL(allowed).hostname || result.action !== 'reveal_phone') return respond(403, { error: 'verification_failed' });
      return respond(200, { phone: env.PHONE_NUMBER, display: env.PHONE_DISPLAY || env.PHONE_NUMBER });
    } catch { return respond(503, { error: 'unavailable' }); }
  }
};
