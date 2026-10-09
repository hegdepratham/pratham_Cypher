// Limits requests per visitor within a fixed time window.
function rateLimit({ windowMs, max }) {
  const hits = new Map();

  // Remove expired entries so memory usage stays bounded.
  setInterval(() => {
    const now = Date.now();

    for (const [ip, rec] of hits) {
      if (rec.resetAt <= now) {
        hits.delete(ip);
      }
    }
  }, windowMs).unref();

  return function limiter(req, res, next) {
    const now = Date.now();
    const rec = hits.get(req.ip);

    if (!rec || rec.resetAt <= now) {
      hits.set(req.ip, {
        count: 1,
        resetAt: now + windowMs,
      });

      return next();
    }

    rec.count += 1;

    if (rec.count > max) {
      res.set(
        'Retry-After',
        String(Math.ceil((rec.resetAt - now) / 1000))
      );

      return res.status(429).json({
        error: 'Too many requests. Please wait a minute and try again.',
      });
    }

    next();
  };
}

module.exports = { rateLimit };