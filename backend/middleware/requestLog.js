function requestLog(req, res, next) {
  // Skip frequent health checks to keep logs useful.
  if (req.path === '/api/health') {
    return next();
  }

  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;

    console.log(
      JSON.stringify({
        t: new Date().toISOString(),
        method: req.method,
        path: req.path,
        status: res.statusCode,
        ms: Math.round(ms),
      })
    );
  });

  next();
}

module.exports = { requestLog };