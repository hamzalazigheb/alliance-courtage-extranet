let promClient;
let register;
let httpRequestDuration;
let httpRequestTotal;
let activeUsers;
let metricsEnabled = false;

try {
  promClient = require('prom-client');
  register = new promClient.Registry();
  promClient.collectDefaultMetrics({ register });
  metricsEnabled = true;
} catch (error) {
  console.warn('⚠️  Prometheus metrics désactivés:', error.message);
  // Créer des objets factices pour éviter les erreurs
  register = {
    metrics: async () => '# Metrics disabled\n',
    registerMetric: () => {}
  };
}

if (metricsEnabled) {
  httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5]
  });

  httpRequestTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
  });

  activeUsers = new promClient.Gauge({
    name: 'active_users',
    help: 'Number of active users'
  });

  register.registerMetric(httpRequestDuration);
  register.registerMetric(httpRequestTotal);
  register.registerMetric(activeUsers);
} else {
  // Créer des objets factices
  httpRequestDuration = { observe: () => {} };
  httpRequestTotal = { inc: () => {} };
  activeUsers = { set: () => {}, inc: () => {}, dec: () => {} };
}

const metricsMiddleware = (req, res, next) => {
  if (!metricsEnabled) {
    return next();
  }
  
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path || 'unknown';
    
    try {
      httpRequestDuration.observe(
        { method: req.method, route, status_code: res.statusCode },
        duration
      );
      
      httpRequestTotal.inc({
        method: req.method,
        route,
        status_code: res.statusCode
      });
    } catch (error) {
      // Ignorer les erreurs de metrics pour ne pas bloquer les requêtes
      console.warn('Metrics error:', error.message);
    }
  });
  
  next();
};

module.exports = { 
  register, 
  metricsMiddleware,
  activeUsers
};
