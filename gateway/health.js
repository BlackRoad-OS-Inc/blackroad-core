const os = require('os');
const startTime = Date.now();

function healthCheck(req, res) {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
    uptime,
    timestamp: new Date().toISOString(),
    node: process.version,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(os.totalmem() / 1024 / 1024)
    },
    pid: process.pid
  }));
}

function readinessCheck(providers) {
  return function ready(req, res) {
    const checks = {};
    let allReady = true;
    for (const [name, provider] of Object.entries(providers)) {
      const isReady = typeof provider.isReady === 'function' ? provider.isReady() : true;
      checks[name] = isReady ? 'ready' : 'not_ready';
      if (!isReady) allReady = false;
    }
    const status = allReady ? 200 : 503;
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: allReady ? 'ready' : 'degraded',
      providers: checks,
      timestamp: new Date().toISOString()
    }));
  };
}

module.exports = { healthCheck, readinessCheck };
