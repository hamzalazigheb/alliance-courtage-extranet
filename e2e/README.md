# Tests E2E avec Playwright

Cette suite de tests E2E couvre toutes les fonctionnalités du frontend côté utilisateur.

## Structure des tests

```
e2e/
├── auth/                    # Tests d'authentification
│   ├── login.spec.ts       # Connexion utilisateur/admin
│   ├── first-login.spec.ts # Première connexion et changement de mot de passe
│   └── logout.spec.ts      # Déconnexion
├── pages/                   # Tests des pages principales
│   ├── accueil.spec.ts
│   ├── gamme-produits.spec.ts
│   ├── partenaires.spec.ts
│   ├── reglementaire.spec.ts
│   ├── produits-structures.spec.ts
│   ├── simulateurs.spec.ts
│   ├── comptabilite.spec.ts
│   ├── archives.spec.ts
│   └── favoris.spec.ts
├── notifications/           # Tests des notifications
│   ├── notifications-user.spec.ts
│   └── notifications-filter.spec.ts
├── profile/                 # Tests du profil utilisateur
│   └── profile-management.spec.ts
├── config/                  # Configuration et données de test
│   └── test-data.ts
└── helpers/                 # Fonctions utilitaires
    ├── auth.ts
    └── navigation.ts
```

## Installation

Les dépendances sont déjà installées. Si besoin :

```bash
npm install
npx playwright install chromium
```

Pour installer tous les navigateurs :
```bash
npx playwright install
```

## Configuration

Les variables d'environnement peuvent être définies dans un fichier `.env` :

```env
BASE_URL=http://localhost:5173
API_URL=http://localhost:3001
ADMIN_PASSWORD=votre-mot-de-passe-admin
THIERVINVEST_PASSWORD=mot-de-passe-thierinvest
LS_CONSEIL_PASSWORD=mot-de-passe-ls-conseil
```

## Exécution des tests

### Tous les tests
```bash
npm run test:e2e
```

### Interface graphique (recommandé pour le développement)
```bash
npm run test:e2e:ui
```

### Mode debug
```bash
npm run test:e2e:debug
```

### Mode headed (voir le navigateur)
```bash
npm run test:e2e:headed
```

### Tests par catégorie
```bash
npm run test:e2e:auth          # Tests d'authentification
npm run test:e2e:pages          # Tests des pages
npm run test:e2e:notifications  # Tests des notifications
npm run test:e2e:profile        # Tests du profil
```

### Tests par navigateur
```bash
npm run test:e2e:chromium       # Chrome uniquement
npm run test:e2e:firefox        # Firefox uniquement
npm run test:e2e:mobile        # Tests mobiles
```

## Voir les rapports

Après l'exécution des tests, un rapport HTML est généré :

```bash
npm run test:e2e:report
```

## Tests couverts

### Authentification
- ✅ Connexion utilisateur standard
- ✅ Connexion admin
- ✅ Gestion des erreurs de connexion
- ✅ Validation des champs requis
- ✅ Première connexion avec changement de mot de passe obligatoire
- ✅ Validation complète du mot de passe (longueur, majuscule, minuscule, chiffre, caractère spécial)
- ✅ Déconnexion

### Pages principales
- ✅ Accueil
- ✅ Gamme Produits (affichage, filtrage, recherche, détails)
- ✅ Partenaires (liste, détails, filtrage)
- ✅ Réglementaire (navigation, téléchargement, recherche)
- ✅ Produits Structurés (liste, réservation, détails)
- ✅ Simulateurs (utilisation, navigation externe)
- ✅ Comptabilité (visualisation, upload, filtrage, téléchargement)
- ✅ Archives (liste, filtrage par année, recherche, téléchargement)
- ✅ Favoris (affichage, suppression)

### Notifications
- ✅ Affichage des notifications
- ✅ Marquer comme lue
- ✅ Filtrer les non lues
- ✅ Marquer toutes comme lues
- ✅ Filtrage correct selon le rôle (non-admin ne voit pas formation_pending)

### Profil utilisateur
- ✅ Accès au profil
- ✅ Modification des informations
- ✅ Changement de mot de passe

## Bonnes pratiques

1. **Isolation des tests** : Chaque test est indépendant et peut être exécuté seul
2. **Helpers réutilisables** : Les fonctions dans `helpers/` sont utilisées pour éviter la duplication
3. **Attentes explicites** : Utilisation de `waitFor` et `expect` pour garantir que les éléments sont prêts
4. **Gestion des erreurs** : Les tests vérifient les cas d'erreur et les validations
5. **Données de test** : Centralisées dans `config/test-data.ts`

## Débogage

### Mode UI (recommandé)
```bash
npm run test:e2e:ui
```
Permet de voir les tests s'exécuter en temps réel, avec la possibilité de mettre en pause, inspecter, et rejouer.

### Mode debug
```bash
npm run test:e2e:debug
```
Ouvre Playwright Inspector pour déboguer étape par étape.

### Screenshots et vidéos
Les screenshots sont automatiquement capturés en cas d'échec. Les vidéos sont conservées uniquement en cas d'échec (configuré dans `playwright.config.ts`).

## CI/CD

Pour exécuter les tests en CI/CD :

```bash
CI=true npm run test:e2e
```

En mode CI, les tests :
- S'exécutent en mode headless
- Ont 2 tentatives en cas d'échec
- Utilisent 1 worker (séquentiel)
- Génèrent des rapports JSON et HTML

## Notes importantes

1. **Serveur de développement** : Les tests démarrent automatiquement le serveur Vite si nécessaire
2. **Base de données** : Assurez-vous que la base de données contient les utilisateurs de test nécessaires
3. **Environnement** : Les tests utilisent l'environnement local par défaut (`localhost:5173`)
4. **Données de test** : Modifiez `e2e/config/test-data.ts` pour adapter les identifiants de test

## Ajouter de nouveaux tests

1. Créez un nouveau fichier `.spec.ts` dans le dossier approprié
2. Utilisez les helpers existants (`auth.ts`, `navigation.ts`)
3. Suivez la structure des tests existants
4. Ajoutez le script npm si nécessaire dans `package.json`

## Support

Pour toute question ou problème avec les tests, consultez la [documentation Playwright](https://playwright.dev/docs/intro).


