const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
// Charger les variables d'environnement (peut ne pas exister en Docker)
try {
  require('dotenv').config({ path: './config.env' });
} catch (e) {
  // Ignorer si le fichier n'existe pas, utiliser les variables d'environnement système
}

const db = require('./config/database');
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

const app = express();
const PORT = process.env.PORT || 3001;

// Behind reverse proxy (nginx) so trust X-Forwarded-* headers
app.set('trust proxy', 1);

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

// Rate limiting (disabled in development for testing)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 10000 : 100 // 10000 en dev, 100 en prod
});
app.use(limiter);

// Middleware pour parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware pour servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), { 
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    // Enable CORS for all uploads
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));
app.use(express.static(path.join(__dirname, '../public')));

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

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Alliance Courtage API is running',
    timestamp: new Date().toISOString()
  });
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
  
  app.listen(PORT, () => {
    console.log(`🚀 Serveur Alliance Courtage démarré sur le port ${PORT}`);
    console.log(`📊 Environnement: ${process.env.NODE_ENV}`);
    console.log(`🌐 API disponible sur: http://localhost:${PORT}/api`);
  });
});

module.exports = app;
