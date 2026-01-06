const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
// Charger les variables d'environnement (peut ne pas exister en Docker)
try {
  require('dotenv').config({ path: './config.env' });
} catch (e) {
  // Ignorer si le fichier n'existe pas, utiliser les variables d'environnement système
}

const db = require('./config/database');
const { register, metricsMiddleware } = require('./middleware/metrics');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const newsRoutes = require('./routes/news');
const archiveRoutes = require('./routes/archives');
const partnerRoutes = require('./routes/partners');
const structuredProductsRoutes = require('./routes/structuredProducts');
const financialDocumentsRoutes = require('./routes/financialDocuments');
const passwordResetRoutes = require('./routes/passwordReset');
const adminPasswordResetRoutes = require('./routes/adminPasswordReset');
const cmsRoutes = require('./routes/cms');
const formationsRoutes = require('./routes/formations');
const notificationsRoutes = require('./routes/notifications');
const assurancesRoutes = require('./routes/assurances');
const bordereauxRoutes = require('./routes/bordereaux');
const reglementaireRoutes = require('./routes/reglementaire');
const favorisRoutes = require('./routes/favoris');
const simulatorsRoutes = require('./routes/simulators');
const emailsRoutes = require('./routes/emails');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3001;

// Behind reverse proxy (nginx) so trust X-Forwarded-* headers
app.set('trust proxy', 1);

// Compression gzip pour améliorer les performances
app.use(compression({
  level: 6, // Niveau de compression (1-9, 6 est un bon équilibre)
  filter: (req, res) => {
    // Ne pas compresser si le client ne le supporte pas
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Utiliser la compression pour tous les types de contenu
    return compression.filter(req, res);
  }
}));

// Middleware de sécurité
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// Configuration CORS
const corsOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173'];
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  exposedHeaders: ['Content-Type']
}));

// Rate limiting - DÉSACTIVÉ TEMPORAIREMENT pour éviter les blocages
// Si vous souhaitez le réactiver, décommentez ce bloc et configurez NODE_ENV correctement
/*
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10000, // 10000 requêtes toutes les 15 minutes en production
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);
  console.log('✓ Rate limiting activé en mode production (10000 req/15min)');
} else {
  console.log('⚠️  Rate limiting désactivé en mode développement');
}
*/
console.log('⚠️  Rate limiting complètement désactivé');

// Metrics middleware (must be before routes to track all requests)
app.use(metricsMiddleware);

// Middleware pour parser JSON
app.use(express.json({ limit: '5gb' })); // Augmenté pour supporter les gros contenus CMS (5GB)
app.use(express.urlencoded({ extended: true, limit: '5gb' }));

// Middleware pour servir les fichiers statiques avec cache optimisé
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), { 
  maxAge: '7d', // Augmenter le cache à 7 jours pour les uploads
  etag: true, // Activer ETag pour la validation de cache
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Enable CORS for all uploads
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    // Cache-Control pour les images et fichiers statiques
    if (filePath.match(/\.(jpg|jpeg|png|gif|svg|webp|pdf)$/i)) {
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable'); // 7 jours
    }
  }
}));
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/archives', archiveRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/structured-products', structuredProductsRoutes);
app.use('/api/financial-documents', financialDocumentsRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/admin-password-reset', adminPasswordResetRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/formations', formationsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/assurances', assurancesRoutes);
app.use('/api/bordereaux', bordereauxRoutes);
app.use('/api/reglementaire', reglementaireRoutes);
app.use('/api/favoris', favorisRoutes);
app.use('/api/simulators', simulatorsRoutes);
app.use('/api/emails', emailsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Alliance Courtage API is running',
    timestamp: new Date().toISOString()
  });
});

// Route pour déclencher les notifications d'expiration (cron ou manuel)
app.post('/api/jobs/check-expirations', async (req, res) => {
  // Vérifier le secret ou l'auth admin
  const secret = req.headers['x-cron-secret'];
  const token = req.headers['x-auth-token'];
  
  if (secret !== process.env.CRON_SECRET && !token) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  
  try {
    const { checkExpiringAccounts, notifyAdminsOfExpiredAccounts } = require('./jobs/expirationNotifier');
    const results = await checkExpiringAccounts();
    await notifyAdminsOfExpiredAccounts();
    res.json({ success: true, results });
  } catch (error) {
    console.error('Erreur job expiration:', error);
    res.status(500).json({ error: error.message });
  }
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Middleware de gestion d'erreurs global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Connexion à la base de données et démarrage du serveur
db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err);
    process.exit(1);
  }
  
  console.log('✅ Connexion à la base de données MySQL réussie');
  
  const server = app.listen(PORT, () => {
    console.log(`🚀 Serveur Alliance Courtage démarré sur le port ${PORT}`);
    console.log(`📊 Environnement: ${process.env.NODE_ENV}`);
    console.log(`🌐 API disponible sur: http://localhost:${PORT}/api`);
    console.log(`📈 Metrics disponible sur: http://localhost:${PORT}/metrics`);
  });
  
  // Configurer les timeouts pour éviter les blocages
  server.keepAliveTimeout = 65000; // 65 secondes (supérieur à la plupart des load balancers)
  server.headersTimeout = 66000; // 66 secondes (doit être > keepAliveTimeout)
  server.requestTimeout = 300000; // 5 minutes pour les requêtes longues (sauvegarde CMS)
});

module.exports = app;
