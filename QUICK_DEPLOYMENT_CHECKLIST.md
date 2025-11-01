# ✅ Checklist de Déploiement Rapide

## 🎯 Checklist Complète - De Zéro à la Production

### Phase 1 : Préparation (Local)

- [ ] Code testé et fonctionnel
- [ ] Git repository à jour
- [ ] Variables d'environnement préparées
- [ ] Build frontend testé localement (`npm run build`)
- [ ] Backend testé localement

### Phase 2 : Serveur - Installation de Base

- [ ] Serveur créé (EC2, VPS, ou autre)
- [ ] Accès SSH fonctionnel
- [ ] Système mis à jour (`sudo apt update && sudo apt upgrade -y`)
- [ ] Node.js 18+ installé (`node --version`)
- [ ] MySQL installé et configuré
- [ ] PM2 installé (`pm2 --version`)
- [ ] Nginx installé (`nginx -v`)

### Phase 3 : Base de Données

- [ ] Base de données créée (`alliance_courtage`)
- [ ] Utilisateur MySQL créé avec permissions
- [ ] Base de données accessible depuis l'application

### Phase 4 : Déploiement Backend

- [ ] Code cloné/téléchargé sur le serveur
- [ ] Dépendances installées (`npm install --production`)
- [ ] `config.env` créé avec variables de production
- [ ] Base de données initialisée (`node scripts/initDatabase.js`)
- [ ] Migrations exécutées (`node scripts/runAllMigrations.js`)
- [ ] Dossiers uploads créés
- [ ] Backend démarré avec PM2
- [ ] Backend répond sur `http://localhost:3001/api/health`

### Phase 5 : Déploiement Frontend

- [ ] Build de production (`npm run build`)
- [ ] Fichiers copiés dans `/var/www/alliance-courtage-frontend`
- [ ] Permissions correctes (`www-data:www-data`)

### Phase 6 : Configuration Nginx

- [ ] Fichier de configuration créé (`/etc/nginx/sites-available/alliance-courtage`)
- [ ] Lien symbolique créé (`sites-enabled`)
- [ ] Configuration testée (`sudo nginx -t`)
- [ ] Nginx redémarré/rechargé

### Phase 7 : SSL/HTTPS

- [ ] Certbot installé
- [ ] Certificat SSL obtenu
- [ ] HTTPS fonctionne
- [ ] Redirection HTTP → HTTPS active

### Phase 8 : Sécurité

- [ ] Firewall configuré (UFW)
- [ ] Ports 22, 80, 443 ouverts uniquement
- [ ] Mots de passe forts configurés
- [ ] JWT_SECRET changé et sécurisé
- [ ] Variables sensibles dans config.env (pas dans Git)

### Phase 9 : Email (Production)

- [ ] AWS SES configuré OU autre service SMTP
- [ ] Identifiants SMTP dans config.env
- [ ] Test d'envoi réussi
- [ ] Emails reçus correctement

### Phase 10 : Vérification

- [ ] Site accessible via HTTPS
- [ ] Page de login s'affiche
- [ ] Connexion fonctionne
- [ ] API backend répond (`/api/health`)
- [ ] Navigation entre pages fonctionne
- [ ] Upload de fichiers fonctionne
- [ ] Réinitialisation mot de passe fonctionne
- [ ] Logs vérifiés (PM2, Nginx)

### Phase 11 : Monitoring et Maintenance

- [ ] PM2 configuré pour redémarrage automatique
- [ ] Script de backup créé
- [ ] Cronjob pour backups configuré
- [ ] Monitoring actif (logs vérifiés)
- [ ] Documentation déployement à jour

---

## 📝 Commandes Rapides

### Sur le Serveur

```bash
# Statut général
pm2 status
sudo systemctl status nginx
sudo systemctl status mysql

# Logs
pm2 logs alliance-backend
sudo tail -f /var/log/nginx/error.log

# Redémarrer
pm2 restart alliance-backend
sudo systemctl reload nginx

# Déploiement rapide
cd /var/www/alliance-courtage
git pull
cd backend && npm install --production && pm2 restart alliance-backend
cd .. && npm install && npm run build && sudo cp -r dist/* /var/www/alliance-courtage-frontend/
sudo systemctl reload nginx
```

---

## 🔍 Vérifications Post-Déploiement

1. **Frontend** : `https://votre-domaine.com` → Doit afficher la page
2. **API** : `https://votre-domaine.com/api/health` → Doit retourner OK
3. **Login** : `https://votre-domaine.com/#manage` → Doit fonctionner
4. **Upload** : Tester upload de fichier
5. **Email** : Tester réinitialisation mot de passe

---

**✅ Une fois toutes les cases cochées, votre application est déployée !**

