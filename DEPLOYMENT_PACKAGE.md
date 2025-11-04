# 📦 Package de Déploiement - Alliance Courtage

## 📋 Contenu du Package

Ce package contient tout ce qui est nécessaire pour installer une base de données fraîche pour le client.

---

## 📁 Fichiers Inclus

### Scripts d'Installation

1. **`backend/scripts/freshDatabase.js`** ⭐ (Recommandé)
   - Script Node.js automatisé
   - Crée toutes les tables
   - Crée uniquement l'admin
   - Génère le hash bcrypt automatiquement

2. **`backend/scripts/installDatabase.sql`**
   - Script SQL pur
   - Peut être exécuté via phpMyAdmin ou ligne de commande
   - Inclut le hash bcrypt pour "Admin123!"

### Documentation

3. **`INSTALLATION_DATABASE.md`**
   - Guide complet d'installation
   - Dépannage
   - Personnalisation

4. **`QUICK_INSTALL_GUIDE.md`**
   - Guide rapide en 3 étapes
   - Pour installation rapide

---

## 🚀 Installation Rapide (Client)

### Méthode 1 : Script Node.js (Recommandé)

```bash
# 1. Configurer backend/config.env
# 2. Installer les dépendances
cd backend
npm install

# 3. Installer la base de données
npm run install:db
```

### Méthode 2 : Script SQL

```bash
# Via MySQL CLI
mysql -u root -p < backend/scripts/installDatabase.sql

# Ou via phpMyAdmin
# Importer le fichier backend/scripts/installDatabase.sql
```

---

## 🔐 Credentials Admin par Défaut

- **Email:** `admin@alliance-courtage.fr`
- **Mot de passe:** `Admin123!`
- **Rôle:** Admin

⚠️ **IMPORTANT:** Le client doit changer le mot de passe après la première connexion !

---

## ✅ Résultat

Après l'installation, la base de données contient :

- ✅ **20 tables** créées (structure complète)
- ✅ **1 seul utilisateur** (admin)
- ✅ **Aucune donnée de test**
- ✅ **Prêt pour la production**

---

## 📝 Personnalisation

Le client peut personnaliser les credentials admin dans `backend/config.env`:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=MotDePasseSecurise
ADMIN_NOM=Nom
ADMIN_PRENOM=Prenom
```

Puis relancer `npm run install:db`.

---

## 🎯 Checklist de Déploiement

- [ ] MySQL/MariaDB installé et démarré
- [ ] Variables d'environnement configurées (`config.env`)
- [ ] Dépendances Node.js installées (`npm install`)
- [ ] Base de données installée (`npm run install:db`)
- [ ] Test de connexion admin réussi
- [ ] Mot de passe admin changé
- [ ] Serveur backend démarré
- [ ] Application frontend déployée

---

## 📞 Support

Pour toute question, consultez:
- `INSTALLATION_DATABASE.md` - Guide complet
- `QUICK_INSTALL_GUIDE.md` - Guide rapide
- Logs du script d'installation

---

**Package prêt pour le déploiement ! 🚀**

