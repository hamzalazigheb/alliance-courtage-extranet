# 🔧 Diagnostic - Email d'approbation de réservation

## Problème
L'utilisateur ne reçoit pas d'email après l'approbation d'une réservation.

## Solution : Déploiement avec logs améliorés

### 1. Déployer les modifications avec logs améliorés

```bash
cd /var/www/alliance-courtage

# Pull les dernières modifications
git pull origin main

# Copier les fichiers modifiés dans le conteneur
docker cp backend/routes/structuredProducts.js alliance-courtage-backend:/app/routes/structuredProducts.js
docker cp backend/services/emailService.js alliance-courtage-backend:/app/services/emailService.js

# Redémarrer le backend
docker restart alliance-courtage-backend

# Attendre que le backend démarre
sleep 5

# Vérifier les logs
docker logs alliance-courtage-backend --tail 30
```

### 2. Tester l'approbation d'une réservation et surveiller les logs

```bash
# Dans un terminal, surveiller les logs en temps réel
docker logs -f alliance-courtage-backend | grep -i "email\|reservation\|approbation"

# Approuver une réservation depuis l'interface admin
# Les logs devraient afficher :
# - 📧 Début envoi email d'approbation réservation
# - 📧 Configuration SMTP
# - ✅ Email d'approbation envoyé avec succès
# OU
# - ❌ Erreur envoi email d'approbation
```

### 3. Vérifier la configuration SMTP

```bash
# Vérifier les variables d'environnement SMTP dans le conteneur
docker exec alliance-courtage-backend env | grep SMTP

# Vérifier le fichier config.env
docker exec alliance-courtage-backend cat /app/config.env | grep SMTP
```

### 4. Causes possibles du problème

#### A. Mode développement (email simulé)
Si vous voyez dans les logs :
```
⚠️  SMTP non configuré. Mode développement activé.
📧 EMAIL DE TEST (Mode Développement)
```

**Solution** : Configurer SMTP dans `config.env` :
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-app
SMTP_FROM=noreply@alliance-courtage.fr
```

#### B. Email de l'utilisateur manquant
Si vous voyez dans les logs :
```
⚠️  Impossible d'envoyer l'email : utilisateur #X n'a pas d'email
```

**Solution** : Vérifier que l'utilisateur a un email dans la base de données :
```bash
docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; SELECT id, email, nom, prenom FROM users WHERE id = USER_ID;"
```

#### C. Erreur SMTP
Si vous voyez dans les logs :
```
❌ Erreur envoi email d'approbation: ...
```

**Solution** : Vérifier les détails de l'erreur dans les logs et corriger la configuration SMTP.

### 5. Test manuel de l'envoi d'email

```bash
# Créer un script de test
cat > /tmp/test-email.js << 'EOF'
const { sendReservationApprovedEmail } = require('./services/emailService');

sendReservationApprovedEmail(
  'test@example.com',
  'Test User',
  'Produit Test',
  1000
).then(result => {
  console.log('✅ Email test envoyé:', result);
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur email test:', error);
  process.exit(1);
});
EOF

# Copier le script dans le conteneur
docker cp /tmp/test-email.js alliance-courtage-backend:/app/test-email.js

# Exécuter le test
docker exec alliance-courtage-backend node /app/test-email.js
```

## Commandes rapides (tout-en-un)

```bash
cd /var/www/alliance-courtage && \
git pull origin main && \
docker cp backend/routes/structuredProducts.js alliance-courtage-backend:/app/routes/structuredProducts.js && \
docker cp backend/services/emailService.js alliance-courtage-backend:/app/services/emailService.js && \
docker restart alliance-courtage-backend && \
sleep 5 && \
echo "✅ Fichiers copiés. Surveillez les logs avec:" && \
echo "docker logs -f alliance-courtage-backend | grep -i email"
```

## Après déploiement

1. **Approuver une réservation** depuis l'interface admin
2. **Surveiller les logs** pour voir ce qui se passe :
   ```bash
   docker logs -f alliance-courtage-backend | grep -i "email\|reservation\|approbation"
   ```
3. **Vérifier les logs** pour identifier le problème exact

Les logs améliorés devraient maintenant montrer exactement ce qui se passe lors de l'envoi de l'email.

