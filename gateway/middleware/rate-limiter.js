const rateLimits = new Map();
const DEFAULT_LIMIT = 10;
const WINDOW_MS = 1000;

function rateLimiter(opts = {}) {
  const limit = opts.limit || DEFAULT_LIMIT;
  return function rateLimit(req, res, next) {
    const key = req.user?.agent || req.headers['x-agent-id'] || req.socket.remoteAddress;
    const now = Date.now();
    if (!rateLimits.has(key)) {
      rateLimits.set(key, { count: 1, windowStart: now });
      return next();
    }
    const entry = rateLimits.get(key);
    if (now - entry.windowStart > WINDOW_MS) {
      entry.count = 1;
      entry.windowStart = now;
      return next();
    }
    entry.count++;
    if (entry.count > limit) {
      res.writeHead(429, {
        'Content-Type': 'application/json',
        'Retry-After': '1',
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0'
      });
      res.end(JSON.stringify({ error: 'Rate limit exceeded', limit, retry_after: 1 }));
      return;
    }
    next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimits) {
    if (now - entry.windowStart > 60000) rateLimits.delete(key);
  }
}, 60000);

module.exports = { rateLimiter };
