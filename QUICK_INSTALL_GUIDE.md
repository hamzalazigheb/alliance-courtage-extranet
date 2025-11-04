# 🚀 Guide d'Installation Rapide - Base de Données

## ⚡ Installation en 3 étapes

### 1. Configurer les credentials

Éditez `backend/config.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=alliance_courtage

# Credentials Admin (optionnel)
ADMIN_EMAIL=admin@alliance-courtage.fr
ADMIN_PASSWORD=Admin123!
ADMIN_NOM=Admin
ADMIN_PRENOM=Alliance
```

### 2. Installer la base de données

```bash
cd backend
npm run install:db
```

### 3. C'est tout ! 🎉

La base de données est créée avec uniquement l'admin.

---

## 📋 Credentials Admin par défaut

- **Email:** `admin@alliance-courtage.fr`
- **Mot de passe:** `Admin123!`
- **Rôle:** Admin

⚠️ **Changez le mot de passe après la première connexion !**

---

## 📝 Documentation Complète

Pour plus de détails, consultez: **`INSTALLATION_DATABASE.md`**

---

**Bon déploiement ! 🚀**

