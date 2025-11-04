# 🔒 Recommandations de Sécurité - Plan d'Action

## 🎯 Priorités d'Implémentation

### 🔴 Priorité 1: Protection CSRF (Critique)

#### Problème
Aucune protection CSRF, permettant des attaques Cross-Site Request Forgery.

#### Solution
```javascript
// backend/server.js
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

// Après cookie-parser
app.use(csrf({ cookie: true }));

// Middleware pour exposer le token
app.use((req, res, next) => {
  res.cookie('XSRF-TOKEN', req.csrfToken());
  next();
});
```

#### Frontend
```typescript
// Dans api.js ou composants
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('XSRF-TOKEN='))
  ?.split('=')[1];

// Ajouter dans headers
headers: {
  'X-XSRF-TOKEN': csrfToken
}
```

**Effort:** Moyen | **Impact:** Élevé

---

### 🔴 Priorité 2: Validation Avancée des Entrées

#### Problème
Validation basique seulement, risque d'entrées invalides.

#### Solution
Installer `express-validator`:
```bash
npm install express-validator
```

**Exemple:**
```javascript
// backend/routes/auth.js
const { body, validationResult } = require('express-validator');

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // ... reste du code
});
```

**Effort:** Moyen | **Impact:** Élevé

---

### 🔴 Priorité 3: Rate Limiting sur Login

#### Problème
Pas de limite spécifique pour les tentatives de login.

#### Solution
```javascript
// backend/server.js
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives
  message: 'Trop de tentatives de connexion, réessayez dans 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', loginLimiter);
```

**Effort:** Faible | **Impact:** Élevé

---

### 🟡 Priorité 4: Scanning Antivirus

#### Problème
Aucune vérification des fichiers uploadés contre les virus.

#### Solution
```javascript
// backend/utils/virusScanner.js
const { ClamScan } = require('node-clam');

const scanFile = async (buffer) => {
  const clamscan = await new ClamScan().init();
  const result = await clamscan.scanBuffer(buffer);
  
  if (result.isInfected) {
    throw new Error('Fichier infecté détecté');
  }
  
  return true;
};
```

**Effort:** Élevé | **Impact:** Moyen

---

### 🟡 Priorité 5: Content Security Policy

#### Problème
Pas de CSP configuré pour bloquer les scripts malveillants.

#### Solution
```javascript
// backend/server.js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // À limiter en prod
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));
```

**Effort:** Faible | **Impact:** Moyen

---

### 🟡 Priorité 6: Audit Logging

#### Problème
Pas de logs d'audit pour les actions importantes.

#### Solution
```javascript
// backend/utils/auditLogger.js
const auditLog = {
  logAction: async (userId, action, details) => {
    await query(
      'INSERT INTO audit_logs (user_id, action, details, ip_address, created_at) VALUES (?, ?, ?, ?, NOW())',
      [userId, action, JSON.stringify(details), req.ip]
    );
  }
};

// Utilisation
await auditLog.logAction(req.user.id, 'USER_CREATED', { targetUserId: newUser.id });
```

**Effort:** Moyen | **Impact:** Moyen

---

### 🟢 Priorité 7: Validation MIME Type Réelle

#### Problème
Validation basée sur l'extension, pas le contenu réel.

#### Solution
```javascript
// backend/routes/bordereaux.js
const FileType = require('file-type');

router.post('/', upload.single('file'), async (req, res) => {
  const fileType = await FileType.fromBuffer(req.file.buffer);
  
  // Vérifier que le MIME type correspond
  if (fileType.mime !== req.file.mimetype) {
    return res.status(400).json({ error: 'Type de fichier invalide' });
  }
});
```

**Effort:** Faible | **Impact:** Faible-Moyen

---

## 📝 Checklist d'Implémentation

### Phase 1 (Critique - 1-2 semaines)
- [ ] Implémenter protection CSRF
- [ ] Ajouter validation avancée (express-validator)
- [ ] Ajouter rate limiting sur login
- [ ] Tester toutes les fonctionnalités

### Phase 2 (Importante - 2-3 semaines)
- [ ] Implémenter audit logging
- [ ] Ajouter CSP dans Helmet
- [ ] Validation MIME type réelle
- [ ] Améliorer gestion des erreurs

### Phase 3 (Améliorations - 1-2 mois)
- [ ] Scanning antivirus
- [ ] Logging structuré (winston)
- [ ] 2FA pour admin
- [ ] Rotation des secrets

---

## 🧪 Tests de Sécurité

### Tests à Effectuer
1. **OWASP Top 10**
   - [ ] Injection SQL
   - [ ] XSS
   - [ ] CSRF
   - [ ] Broken Authentication
   - [ ] Sensitive Data Exposure
   - [ ] Security Misconfiguration
   - [ ] XXE
   - [ ] Insecure Deserialization
   - [ ] Using Components with Known Vulnerabilities
   - [ ] Insufficient Logging

2. **Outils Recommandés**
   - OWASP ZAP
   - Burp Suite
   - npm audit
   - Snyk

3. **Tests Manuels**
   - [ ] Tentatives de login avec mauvais credentials
   - [ ] Upload de fichiers malveillants
   - [ ] Tentatives d'injection SQL
   - [ ] Tentatives XSS
   - [ ] Accès non autorisé aux routes admin

---

## 📚 Ressources

### Documentation
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

### Packages Recommandés
- `express-validator` - Validation
- `csurf` - Protection CSRF
- `helmet` - Headers de sécurité (déjà installé)
- `express-rate-limit` - Rate limiting (déjà installé)
- `winston` - Logging structuré
- `file-type` - Détection MIME type

---

**Statut:** ⚠️ **AMÉLIORATIONS NÉCESSAIRES**  
**Score Actuel:** 7.5/10  
**Score Cible:** 9/10 (après implémentation des priorités)

