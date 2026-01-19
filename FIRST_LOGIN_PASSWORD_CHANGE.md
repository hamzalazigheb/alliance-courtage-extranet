# Implémentation : Popup obligatoire changement mot de passe première connexion

## ✅ Fonctionnalités implémentées

### Backend
1. ✅ Colonne `must_change_password` ajoutée dans la table `users`
2. ✅ Route `/api/auth/login` modifiée pour retourner `must_change_password`
3. ✅ Routes de changement de mot de passe modifiées pour mettre à jour le flag

### Frontend
1. ✅ Composant `FirstLoginPasswordModal` créé (modal non fermable)
2. ✅ Intégration dans `App.tsx` pour affichage automatique
3. ✅ Blocage de l'accès au reste de l'application tant que le mot de passe n'est pas changé
4. ✅ Types TypeScript mis à jour

## 📋 Étapes de déploiement

### 1. Ajouter la colonne dans la base de données

**Option A : Via script SQL direct**
```bash
docker exec -it c4dbc8574704_alliance-courtage-mysql mysql -u root -p'alliance2024Secure' alliance_courtage < backend/scripts/add-must-change-password.sql
```

**Option B : Via script Node.js**
```bash
cd backend
node scripts/add-must-change-password-column.js
```

**Option C : Commande SQL manuelle**
```bash
docker exec -it c4dbc8574704_alliance-courtage-mysql mysql -u root -p'alliance2024Secure' alliance_courtage -e "ALTER TABLE users ADD COLUMN must_change_password BOOLEAN DEFAULT TRUE AFTER password;"
```

### 2. Redémarrer le backend
```bash
docker restart alliance-courtage-backend
```

### 3. Rebuild et déployer le frontend
```bash
npm run build
# Puis déployer le nouveau build
```

## 🧪 Tests à effectuer

### Test 1 : Nouvel utilisateur
1. Créer un nouvel utilisateur avec un mot de passe temporaire
2. Se connecter avec cet utilisateur
3. **Résultat attendu** : Le modal de changement de mot de passe s'affiche immédiatement
4. L'utilisateur ne peut pas accéder au reste de l'application
5. Changer le mot de passe
6. **Résultat attendu** : Le modal se ferme et l'utilisateur accède à l'application

### Test 2 : Utilisateur existant
1. Se connecter avec un utilisateur existant qui a déjà changé son mot de passe
2. **Résultat attendu** : Pas de modal, accès direct à l'application

### Test 3 : Validation du mot de passe
1. Tester avec un mot de passe trop court (< 8 caractères)
2. Tester sans majuscule
3. Tester sans minuscule
4. Tester sans chiffre
5. Tester sans caractère spécial
6. **Résultat attendu** : Messages d'erreur appropriés

### Test 4 : Utilisateur admin
1. Créer un admin avec mot de passe temporaire
2. Se connecter sur `/manage`
3. **Résultat attendu** : Modal s'affiche, après changement redirection vers `/manage`

## 📝 Exigences du mot de passe

Le nouveau mot de passe doit contenir :
- ✅ Au moins 8 caractères
- ✅ Au moins une lettre majuscule (A-Z)
- ✅ Au moins une lettre minuscule (a-z)
- ✅ Au moins un chiffre (0-9)
- ✅ Au moins un caractère spécial (!@#$%^&*(),.?":{}|<>)

## 🔧 Configuration

### Pour forcer un utilisateur à changer son mot de passe
```sql
UPDATE users SET must_change_password = TRUE WHERE email = 'email@example.com';
```

### Pour désactiver le changement obligatoire (déconseillé)
```sql
UPDATE users SET must_change_password = FALSE WHERE email = 'email@example.com';
```

## 🐛 Dépannage

### Le modal ne s'affiche pas
1. Vérifier que la colonne `must_change_password` existe dans la table `users`
2. Vérifier que `must_change_password = TRUE` pour l'utilisateur
3. Vérifier les logs du backend pour voir si `must_change_password` est retourné dans la réponse de login
4. Vérifier la console du navigateur pour les erreurs JavaScript

### Erreur "Column must_change_password doesn't exist"
- Exécuter le script SQL pour ajouter la colonne (voir étape 1)

### Le modal s'affiche mais le changement échoue
1. Vérifier que le mot de passe actuel est correct
2. Vérifier que le nouveau mot de passe respecte toutes les exigences
3. Vérifier les logs du backend pour les erreurs

## 📊 Fichiers modifiés

### Backend
- `backend/routes/auth.js` - Route login modifiée
- `backend/routes/users.js` - Routes changement mot de passe modifiées
- `backend/scripts/add-must-change-password-column.js` - Script de migration
- `backend/scripts/add-must-change-password.sql` - SQL de migration

### Frontend
- `src/components/FirstLoginPasswordModal.tsx` - Nouveau composant modal
- `src/App.tsx` - Intégration du modal
- `src/pages/ExtranetLoginPage.tsx` - Passage de `must_change_password`
- `src/pages/AdminLoginPage.tsx` - Passage de `must_change_password`
- `src/types.ts` - Types mis à jour

## ✅ Checklist de déploiement

- [ ] Exécuter le script SQL pour ajouter la colonne
- [ ] Vérifier que la colonne existe : `DESCRIBE users;`
- [ ] Redémarrer le backend
- [ ] Rebuild le frontend
- [ ] Déployer le frontend
- [ ] Tester avec un nouvel utilisateur
- [ ] Tester avec un utilisateur existant
- [ ] Vérifier les validations de mot de passe

---

*Document créé le : 19 janvier 2026*




