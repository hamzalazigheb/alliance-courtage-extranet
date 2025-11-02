# 🧪 Guide de Test Complet - Alliance Courtage

## 📋 Checklist de Test Complète

---

## 1. Tests de Connexion et Authentification

### 1.1 Page d'Accueil
- [ ] Ouvrir `http://13.38.115.36`
- [ ] La page d'accueil se charge sans erreur
- [ ] Pas d'erreurs dans la console (F12 → Console)
- [ ] Pas d'erreurs CORS

### 1.2 Login Admin
- [ ] Aller sur `http://13.38.115.36/#manage`
- [ ] Formulaire de login s'affiche
- [ ] Se connecter avec vos identifiants
- [ ] Connexion réussie
- [ ] Dashboard admin s'affiche

### 1.3 Logout
- [ ] Cliquer sur "Déconnexion"
- [ ] Retour à la page de login
- [ ] Session supprimée

---

## 2. Tests Backend API

### 2.1 Health Check
```bash
# Dans Termius
curl http://localhost:3001/api/health
# Devrait retourner : OK ou JSON
```

### 2.2 Test API depuis le navigateur
- [ ] Ouvrir DevTools (F12)
- [ ] Onglet Network
- [ ] Recharger la page
- [ ] Vérifier les requêtes `/api/...`
- [ ] Toutes doivent être en **200 OK** (pas 401, 404, 500)

---

## 3. Tests du Dashboard Admin

### 3.1 Navigation
- [ ] Tous les onglets accessibles
- [ ] Pas d'erreurs lors du changement d'onglet
- [ ] Les pages se chargent correctement

### 3.2 Gestion des Utilisateurs
- [ ] Liste des utilisateurs s'affiche
- [ ] Créer un nouvel utilisateur
- [ ] Modifier un utilisateur existant
- [ ] Voir les détails d'un utilisateur
- [ ] Activer/Désactiver un utilisateur

### 3.3 Gestion des Partenaires
- [ ] Liste des partenaires s'affiche
- [ ] Ajouter un partenaire
  - [ ] Nom, description
  - [ ] Upload logo
  - [ ] Catégorie
- [ ] Modifier un partenaire
- [ ] Supprimer un partenaire
- [ ] Les logos s'affichent correctement

### 3.4 Gestion des Produits Structurés
- [ ] Liste des produits s'affiche
- [ ] Ajouter un produit
  - [ ] Tous les champs fonctionnent
  - [ ] Upload de fichiers
- [ ] Modifier un produit
- [ ] Supprimer un produit
- [ ] Filtres et recherche fonctionnent

### 3.5 Gestion des Archives
- [ ] Liste des archives s'affiche
- [ ] Upload de fichier archive
- [ ] Télécharger un fichier
- [ ] Supprimer un fichier
- [ ] Recherche fonctionne

### 3.6 Documents Financiers
- [ ] Liste s'affiche
- [ ] Upload de document
- [ ] Téléchargement fonctionne
- [ ] Suppression fonctionne

### 3.7 CMS (Content Management)
- [ ] Voir le contenu CMS
- [ ] Modifier le contenu d'une page
- [ ] Sauvegarder les modifications
- [ ] Les modifications apparaissent sur le site

### 3.8 Notifications
- [ ] Badge de notification s'affiche (si nouvelles)
- [ ] Liste des notifications
- [ ] Marquer comme lu
- [ ] Marquer toutes comme lues

### 3.9 Formations (Section 4 - Réglementaire)
- [ ] Liste des formations soumises
- [ ] Approuver une formation
- [ ] Rejeter une formation
- [ ] Voir les détails

---

## 4. Tests Frontend Utilisateur

### 4.1 Navigation Publique
- [ ] Page Accueil
- [ ] Page Gamme Financière
- [ ] Page Produits Structurés
- [ ] Page Réglementaire
- [ ] Page Simulateurs
- [ ] Page Nos Archives
- [ ] Toutes les pages se chargent sans erreur

### 4.2 Simulateurs
- [ ] Impôt sur le revenu
  - [ ] Sliders fonctionnent
  - [ ] Calcul en temps réel
  - [ ] Résultats affichés
- [ ] Fortune Immobilière
- [ ] Diagnostic Succession
- [ ] Simulateur Placement

### 4.3 Section Réglementaire
- [ ] Section 4 : Créer une formation
  - [ ] Formulaire s'affiche
  - [ ] Upload de fichier fonctionne
  - [ ] Soumission réussie
  - [ ] Notification admin créée

---

## 5. Tests Upload de Fichiers

### 5.1 Upload Partenaires
- [ ] Upload logo partenaire
- [ ] Vérifier que le fichier est sauvegardé
- [ ] Vérifier que l'image s'affiche

### 5.2 Upload Archives
- [ ] Upload fichier PDF/document
- [ ] Vérifier dans la liste
- [ ] Télécharger le fichier

### 5.3 Upload Produits Structurés
- [ ] Upload document produit
- [ ] Vérifier l'association au produit

---

## 6. Tests Base de Données

### 6.1 Vérifier les Données
```bash
# Dans Termius
docker exec alliance-courtage-mysql mysql -u root -p'alliance2024Secure' alliance_courtage -e "
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'partners', COUNT(*) FROM partners
UNION ALL
SELECT 'structured_products', COUNT(*) FROM structured_products
UNION ALL
SELECT 'archives', COUNT(*) FROM archives;
"
```

### 6.2 Vérifier l'Intégrité
- [ ] Pas d'erreurs dans les logs MySQL
- [ ] Les relations entre tables fonctionnent
- [ ] Les contraintes sont respectées

---

## 7. Tests Performance

### 7.1 Temps de Chargement
- [ ] Page d'accueil charge en < 3 secondes
- [ ] Dashboard admin charge en < 5 secondes
- [ ] Pas de blocage visible

### 7.2 Ressources
- [ ] Images se chargent correctement
- [ ] Pas d'erreurs 404 pour les assets
- [ ] Fichiers statiques en cache

---

## 8. Tests de Sécurité

### 8.1 Authentification
- [ ] Impossible d'accéder à `/manage` sans login
- [ ] Session expire après déconnexion
- [ ] Token JWT valide

### 8.2 Autorisation
- [ ] Utilisateurs non-admin ne peuvent pas accéder aux fonctions admin
- [ ] Chaque utilisateur ne peut modifier que ses propres données

---

## 9. Tests Logs et Erreurs

### 9.1 Logs Backend
```bash
# Dans Termius
docker logs alliance-courtage-backend --tail 100

# Vérifier :
# - Pas d'erreurs 500
# - Pas d'erreurs de connexion MySQL
# - Pas d'erreurs critiques
```

### 9.2 Logs Frontend
```bash
docker logs alliance-courtage-extranet --tail 50
```

### 9.3 Console Navigateur
- [ ] Ouvrir DevTools (F12)
- [ ] Console
- [ ] Pas d'erreurs rouges
- [ ] Pas d'avertissements critiques

---

## 10. Tests Réseau et Conteneurs

### 10.1 Statut des Containers
```bash
docker ps
# Tous doivent être "Up"
```

### 10.2 Communication Backend ↔ Frontend
```bash
# Test depuis le container frontend
docker exec alliance-courtage-extranet wget -qO- http://alliance-courtage-backend:3001/api/health
# Devrait retourner : OK
```

### 10.3 Communication Frontend ↔ Nginx
```bash
# Test API via Nginx
curl http://localhost/api/health
# Devrait retourner : OK
```

---

## 11. Test Script Automatique

Créez `test-all.sh` sur le serveur :

```bash
#!/bin/bash

echo "🧪 Tests Automatiques Alliance Courtage"
echo "======================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Test 1: Containers
echo "📦 Test 1: Containers Docker"
if docker ps | grep -q "alliance-courtage-mysql"; then
    echo -e "${GREEN}✅ MySQL running${NC}"
else
    echo -e "${RED}❌ MySQL not running${NC}"
fi

if docker ps | grep -q "alliance-courtage-backend"; then
    echo -e "${GREEN}✅ Backend running${NC}"
else
    echo -e "${RED}❌ Backend not running${NC}"
fi

if docker ps | grep -q "alliance-courtage-extranet"; then
    echo -e "${GREEN}✅ Frontend running${NC}"
else
    echo -e "${RED}❌ Frontend not running${NC}"
fi

echo ""

# Test 2: API Health
echo "🔍 Test 2: API Backend"
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend API responds${NC}"
else
    echo -e "${RED}❌ Backend API not responding${NC}"
fi

# Test 3: API via Nginx
echo "🔍 Test 3: API via Nginx Proxy"
if curl -s http://localhost/api/health > /dev/null; then
    echo -e "${GREEN}✅ Nginx proxy works${NC}"
else
    echo -e "${RED}❌ Nginx proxy not working${NC}"
fi

echo ""

# Test 4: Database
echo "💾 Test 4: Database"
USER_COUNT=$(docker exec alliance-courtage-mysql mysql -u root -p'alliance2024Secure' alliance_courtage -e "SELECT COUNT(*) FROM users;" 2>/dev/null | tail -1)
if [ ! -z "$USER_COUNT" ] && [ "$USER_COUNT" != "COUNT(*)" ]; then
    echo -e "${GREEN}✅ Database accessible (${USER_COUNT} users)${NC}"
else
    echo -e "${RED}❌ Database not accessible${NC}"
fi

echo ""

# Test 5: Network
echo "🌐 Test 5: Network Connectivity"
if docker exec alliance-courtage-extranet wget -qO- http://alliance-courtage-backend:3001/api/health 2>/dev/null | grep -q "OK\|ok"; then
    echo -e "${GREEN}✅ Frontend can reach backend${NC}"
else
    echo -e "${RED}❌ Frontend cannot reach backend${NC}"
fi

echo ""
echo "✅ Tests terminés !"
```

**Utilisation :**
```bash
chmod +x test-all.sh
./test-all.sh
```

---

## 12. Checklist Rapide (5 minutes)

### Test Express
- [ ] Site accessible : `http://13.38.115.36`
- [ ] Login fonctionne
- [ ] Dashboard s'affiche
- [ ] Upload fichier fonctionne
- [ ] Pas d'erreurs dans la console (F12)

---

## 13. Tests Fonctionnels par Page

### Page Accueil
- [ ] Contenu s'affiche
- [ ] Images se chargent
- [ ] Liens fonctionnent

### Page Gamme Financière
- [ ] Produits affichés
- [ ] Filtres fonctionnent
- [ ] Détails accessibles

### Page Produits Structurés
- [ ] Liste des produits
- [ ] Upload fonctionne
- [ ] Recherche fonctionne

### Page Réglementaire
- [ ] Section 4 : Formulaire formation
- [ ] Upload fichier formation
- [ ] Soumission réussie

### Page Simulateurs
- [ ] 4 simulateurs accessibles
- [ ] Calculs fonctionnent
- [ ] Sliders interactifs

### Page Archives
- [ ] Liste des fichiers
- [ ] Upload fonctionne
- [ ] Téléchargement fonctionne

---

## 14. Tests d'Erreurs

### Erreurs à Vérifier
- [ ] Pas d'erreurs 404 (fichiers manquants)
- [ ] Pas d'erreurs 500 (erreurs serveur)
- [ ] Pas d'erreurs CORS
- [ ] Pas d'erreurs JavaScript dans la console
- [ ] Pas d'erreurs de connexion MySQL

---

## 15. Test Complet Manuel

### Ordre Recommandé
1. **Connexion** → Vérifier login
2. **Dashboard** → Vérifier tous les onglets
3. **Utilisateurs** → Créer/Modifier/Supprimer
4. **Partenaires** → Créer avec logo
5. **Produits** → Créer avec upload
6. **Archives** → Upload/Télécharger
7. **Frontend** → Tester toutes les pages publiques
8. **Simulateurs** → Tester les 4 simulateurs
9. **Logs** → Vérifier qu'il n'y a pas d'erreurs

---

## 16. Commandes de Vérification Rapide

```bash
# Statut général
docker ps

# Logs récents
docker logs alliance-courtage-backend --tail 20
docker logs alliance-courtage-extranet --tail 20

# Test API
curl http://localhost/api/health

# Test base de données
docker exec alliance-courtage-mysql mysql -u root -p'alliance2024Secure' alliance_courtage -e "SELECT COUNT(*) FROM users;"
```

---

**✅ Une fois tous ces tests passés, votre application est prête pour la production !**

