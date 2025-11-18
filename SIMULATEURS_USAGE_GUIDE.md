# Guide : Vérification de l'Accès et de l'Utilisation des Simulateurs

## 📋 Vue d'ensemble

Le système de tracking des simulateurs permet de :
- ✅ Vérifier qui utilise les simulateurs
- ✅ Enregistrer les paramètres utilisés
- ✅ Suivre les résultats calculés
- ✅ Générer des statistiques d'utilisation

## 🔐 Accès aux Simulateurs

**Actuellement, tous les utilisateurs connectés ont accès aux simulateurs** (pas de restriction de rôle).

### Types de simulateurs disponibles :
1. **IR** - Impôt sur le Revenu
2. **IFI** - Impôt sur la Fortune Immobilière
3. **Succession** - Diagnostic Succession
4. **Placement** - Simulateur Placement

## 📊 Comment Vérifier l'Utilisation

### 1. Créer la table de tracking

Exécutez le script de migration :
```bash
node backend/scripts/addSimulatorUsageTable.js
```

### 2. Accéder aux statistiques (Admin uniquement)

#### Via l'API :

**GET `/api/simulators/usage/stats`** - Statistiques agrégées
```javascript
// Exemple avec fetch
const response = await fetch('/api/simulators/usage/stats', {
  headers: {
    'x-auth-token': localStorage.getItem('token')
  }
});
const stats = await response.json();
```

**GET `/api/simulators/usage`** - Liste détaillée des utilisations
```javascript
// Avec filtres optionnels
const response = await fetch('/api/simulators/usage?simulator_type=ir&limit=50', {
  headers: {
    'x-auth-token': localStorage.getItem('token')
  }
});
const usage = await response.json();
```

#### Paramètres de filtrage disponibles :
- `simulator_type` : Type de simulateur (ir, ifi, succession, placement)
- `user_id` : ID de l'utilisateur
- `start_date` : Date de début (format YYYY-MM-DD)
- `end_date` : Date de fin (format YYYY-MM-DD)
- `limit` : Nombre maximum de résultats (défaut: 100)

### 3. Structure des données

#### Table `simulator_usage` :
```sql
- id : ID unique
- user_id : ID de l'utilisateur
- simulator_type : Type de simulateur (ir, ifi, succession, placement)
- parameters : Paramètres utilisés (JSON)
- result_summary : Résumé du résultat (texte)
- created_at : Date et heure d'utilisation
```

#### Exemple de données enregistrées :

**Simulateur IR :**
```json
{
  "simulator_type": "ir",
  "parameters": {
    "revenu_net": 50000,
    "situation": "marie",
    "nb_enfants": 2
  },
  "result_summary": "Impôt: 3 500 € (Taux: 7.0%)"
}
```

**Simulateur IFI :**
```json
{
  "simulator_type": "ifi",
  "parameters": {
    "patrimoine": 2000000,
    "dettes": 300000,
    "patrimoine_net": 1700000
  },
  "result_summary": "IFI: 6 300 € (Base: 400 000 €)"
}
```

## 🔍 Requêtes SQL utiles

### Voir toutes les utilisations :
```sql
SELECT 
  su.*,
  u.nom,
  u.prenom,
  u.email
FROM simulator_usage su
LEFT JOIN users u ON su.user_id = u.id
ORDER BY su.created_at DESC
LIMIT 100;
```

### Statistiques par type de simulateur :
```sql
SELECT 
  simulator_type,
  COUNT(*) as total_uses,
  COUNT(DISTINCT user_id) as unique_users
FROM simulator_usage
GROUP BY simulator_type;
```

### Utilisateurs les plus actifs :
```sql
SELECT 
  u.nom,
  u.prenom,
  u.email,
  COUNT(su.id) as total_uses
FROM users u
INNER JOIN simulator_usage su ON u.id = su.user_id
GROUP BY u.id, u.nom, u.prenom, u.email
ORDER BY total_uses DESC
LIMIT 10;
```

### Utilisations par jour (30 derniers jours) :
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as uses,
  COUNT(DISTINCT user_id) as users
FROM simulator_usage
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## 🎯 Utilisation dans le Frontend

Le tracking est automatique. Chaque fois qu'un utilisateur :
1. Ouvre un simulateur
2. Modifie les paramètres
3. Obtient un résultat

Les données sont automatiquement enregistrées via l'API `/api/simulators/usage`.

## 📝 Notes importantes

1. **Confidentialité** : Les paramètres et résultats sont enregistrés pour des statistiques uniquement
2. **Performance** : Le logging est asynchrone et n'affecte pas les performances du simulateur
3. **Erreurs** : Les erreurs de logging sont silencieuses (ne bloquent pas l'utilisation)
4. **Accès Admin** : Seuls les administrateurs peuvent voir les statistiques

## 🚀 Prochaines étapes

Pour ajouter une page admin de visualisation des statistiques dans le CMS, vous pouvez :
1. Créer un nouveau composant `SimulatorStatsPage.tsx`
2. L'ajouter dans `ManagePage.tsx` sous l'onglet approprié
3. Utiliser `simulatorsAPI.getStats()` et `simulatorsAPI.getUsage()` pour afficher les données

