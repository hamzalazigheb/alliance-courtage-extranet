# Architecture du Système de Notifications

## Vue d'ensemble

Le système de notifications permet aux administrateurs et aux utilisateurs de recevoir des notifications dans l'application. Les notifications peuvent être **globales** (visibles par tous) ou **individuelles** (destinées à un utilisateur spécifique).

---

## 📋 Liste des Notifications

### 1. **Notifications Automatiques (Système)**

#### A. **Notifications pour les Administrateurs**

| Type | Déclencheur | Description | Route Backend |
|------|------------|-------------|---------------|
| `formation_pending` | Soumission d'une formation | Un utilisateur soumet une nouvelle formation en attente d'approbation | `POST /api/formations` |
| `document` | Upload d'un document financier | Un nouveau document financier est ajouté | `POST /api/financial-documents` |
| `product` | Ajout d'un produit structuré | Un nouveau produit structuré est ajouté | `POST /api/structured-products` |
| `reservation` | Réservation d'un produit (Admin) | Un utilisateur réserve un produit structuré - visible uniquement par les admins avec le nom | `POST /api/structured-products/:id/reserve` |
| `reservation_public` | Réservation d'un produit (Public) | Un utilisateur réserve un produit structuré - visible par tous les utilisateurs sans nom | `POST /api/structured-products/:id/reserve` |
| `document` | Upload d'un document réglementaire | Un nouveau document réglementaire est ajouté | `POST /api/reglementaire/documents` |
| `archive` | Upload d'une archive | Une nouvelle archive est ajoutée | `POST /api/archives` |
| `meeting` | Ajout d'une rencontre | Une nouvelle rencontre est ajoutée dans le CMS | `PUT /api/cms/rencontres` |

#### B. **Notifications pour les Utilisateurs**

| Type | Déclencheur | Description | Route Backend |
|------|------------|-------------|---------------|
| `reservation` | Approbation d'une réservation | La réservation d'un produit est approuvée par un admin | `PUT /api/structured-products/reservations/:id/approve` |
| `reservation` | Rejet d'une réservation | La réservation d'un produit est rejetée par un admin | `PUT /api/structured-products/reservations/:id/reject` |

### 2. **Notifications Manuelles (CMS)**

#### A. **Notification Globale (Broadcast)**
- **Destinataire** : Tous les utilisateurs (sauf admins)
- **Création** : Via CMS → Section Notifications → "Notification à tous"
- **Route** : `POST /api/notifications/broadcast`

#### B. **Notification Individuelle**
- **Destinataire** : Un utilisateur spécifique
- **Création** : Via CMS → Section Notifications → "Notification individuelle"
- **Route** : `POST /api/notifications/send`

---

## 🏗️ Architecture Technique

### **Base de Données**

#### Table `notifications`

```sql
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NULL,                    -- NULL = notification globale, sinon ID utilisateur
  type VARCHAR(50) NOT NULL,           -- Type: info, success, warning, error, announcement, etc.
  title VARCHAR(255) NOT NULL,         -- Titre de la notification
  message TEXT NOT NULL,               -- Message de la notification
  related_id INT NULL,                 -- ID de l'entité liée (ex: formation_id, document_id)
  related_type VARCHAR(50) NULL,        -- Type d'entité liée (ex: 'formation', 'document')
  link VARCHAR(500) NULL,               -- Lien optionnel vers une page
  is_read BOOLEAN DEFAULT FALSE,       -- Statut de lecture
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at),
  INDEX idx_type (type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Logique de visibilité** :
- Si `user_id IS NULL` → Notification **globale** (visible par tous)
- Si `user_id = X` → Notification **individuelle** (visible uniquement par l'utilisateur X)

---

### **Backend**

#### Routes API (`backend/routes/notifications.js`)

##### 1. **GET /api/notifications**
- **Accès** : Privé (utilisateur connecté)
- **Description** : Récupère les notifications de l'utilisateur
- **Logique** : Retourne les notifications personnelles (`user_id = user.id`) + les notifications globales (`user_id IS NULL`)
- **Paramètres** :
  - `unread_only=true` : Filtrer uniquement les non lues
- **Limite** : 50 dernières notifications

##### 2. **GET /api/notifications/unread-count**
- **Accès** : Privé (utilisateur connecté)
- **Description** : Retourne le nombre de notifications non lues
- **Retour** : `{ count: number }`

##### 3. **PUT /api/notifications/:id/read**
- **Accès** : Privé (utilisateur connecté)
- **Description** : Marque une notification comme lue
- **Sécurité** : L'utilisateur ne peut marquer que ses propres notifications ou les notifications globales

##### 4. **PUT /api/notifications/read-all**
- **Accès** : Privé (utilisateur connecté)
- **Description** : Marque toutes les notifications (personnelles + globales) comme lues

##### 5. **POST /api/notifications/broadcast**
- **Accès** : Privé (Admin seulement)
- **Description** : Crée une notification globale pour tous les utilisateurs
- **Body** :
  ```json
  {
    "type": "info|success|warning|error|announcement",
    "title": "Titre de la notification",
    "message": "Message de la notification",
    "link": "http://..." // Optionnel
  }
  ```
- **Retour** : `{ message, notificationId, recipientCount }`

##### 6. **POST /api/notifications/send**
- **Accès** : Privé (Admin seulement)
- **Description** : Envoie une notification à un utilisateur spécifique
- **Body** :
  ```json
  {
    "userId": 123,
    "type": "info|success|warning|error|announcement",
    "title": "Titre de la notification",
    "message": "Message de la notification",
    "link": "http://..." // Optionnel
  }
  ```
- **Retour** : `{ message, notificationId, recipient }`

#### Fonctions Utilitaires

##### `createNotification(type, title, message, userId, relatedId, relatedType, link)`
- **Description** : Fonction utilitaire pour créer une notification
- **Paramètres** :
  - `type` : Type de notification (info, success, warning, error, etc.)
  - `title` : Titre
  - `message` : Message
  - `userId` : ID utilisateur (NULL pour notification globale)
  - `relatedId` : ID de l'entité liée (optionnel)
  - `relatedType` : Type d'entité liée (optionnel)
  - `link` : Lien optionnel
- **Retour** : `insertId` ou `null` en cas d'erreur

##### `notifyAdmins(type, title, message, relatedId, relatedType)`
- **Description** : Crée une notification globale pour tous les admins
- **Utilisation** : Utilisée par les routes pour notifier les admins d'événements système

---

### **Frontend**

#### Composant `NotificationsPage` (`src/NotificationsPage.tsx`)

**Fonctionnalités** :
- Affichage de la liste des notifications (personnelles + globales)
- Badge avec le nombre de notifications non lues
- Marquer une notification comme lue
- Marquer toutes les notifications comme lues
- Filtrage par type (toutes, non lues, lues)
- Support des liens cliquables
- Affichage par type avec icônes et couleurs

**Types de notifications affichés** :
- `info` : ℹ️ Information (bleu)
- `success` : ✅ Succès (vert)
- `warning` : ⚠️ Avertissement (orange)
- `error` : ❌ Erreur (rouge)
- `announcement` : 📢 Annonce (violet)
- `reservation` : 💰 Réservation (vert)
- `formation_pending` : 📚 Formation (bleu)
- `document` : 📄 Document (bleu)
- `product` : 📦 Produit (violet)
- `meeting` : 📅 Rencontre (indigo)
- `archive` : 📁 Archive (gris)

#### Composant CMS (`src/CMSManagementPage.tsx`)

**Deux formulaires de notification** :

1. **NotificationBroadcastForm** :
   - Envoie une notification à tous les utilisateurs
   - Champs : Type, Titre, Message, Lien (optionnel)

2. **NotificationIndividualForm** :
   - Envoie une notification à un utilisateur spécifique
   - Champs : Utilisateur (sélection), Type, Titre, Message, Lien (optionnel)

#### API Frontend (`src/api.js`)

```javascript
export const notificationsAPI = {
  getAll: async (unreadOnly = false) => {...},
  getUnreadCount: async () => {...},
  markAsRead: async (id) => {...},
  markAllAsRead: async () => {...},
  broadcast: async (type, title, message, link = null) => {...},
  send: async (userId, type, title, message, link = null) => {...}
};
```

---

## 🔄 Flux de Notifications

### **Notification Automatique (Exemple : Upload de Formation)**

```
1. Utilisateur upload une formation
   ↓
2. POST /api/formations
   ↓
3. Backend crée la formation dans la DB
   ↓
4. Backend appelle notifyAdmins('formation_pending', ...)
   ↓
5. createNotification() crée une notification avec user_id = NULL
   ↓
6. Notification visible par tous les admins
   ↓
7. Frontend affiche le badge de notification
   ↓
8. Admin clique sur la notification
   ↓
9. Notification marquée comme lue
```

### **Notification Manuelle (Exemple : Broadcast)**

```
1. Admin va dans CMS → Notifications
   ↓
2. Remplit le formulaire "Notification à tous"
   ↓
3. Frontend appelle notificationsAPI.broadcast()
   ↓
4. POST /api/notifications/broadcast
   ↓
5. Backend crée une notification avec user_id = NULL
   ↓
6. Notification visible par tous les utilisateurs
   ↓
7. Chaque utilisateur voit la notification dans sa liste
```

### **Notification Individuelle**

```
1. Admin va dans CMS → Notifications
   ↓
2. Remplit le formulaire "Notification individuelle"
   ↓
3. Sélectionne un utilisateur
   ↓
4. Frontend appelle notificationsAPI.send(userId, ...)
   ↓
5. POST /api/notifications/send
   ↓
6. Backend crée une notification avec user_id = userId
   ↓
7. Seul cet utilisateur voit la notification
```

---

## 📊 Types de Notifications

### **Types Système (Automatiques)**

| Type | Utilisé pour | Destinataire |
|------|-------------|--------------|
| `formation_pending` | Nouvelle formation soumise | Admins |
| `document` | Nouveau document financier/réglementaire | Admins |
| `product` | Nouveau produit structuré | Admins |
| `reservation` | Nouvelle réservation | Admins |
| `reservation` | Réservation approuvée/rejetée | Utilisateur |
| `archive` | Nouvelle archive | Admins |
| `meeting` | Nouvelle rencontre | Admins |

### **Types Manuels (CMS)**

| Type | Description | Utilisation |
|------|-------------|-------------|
| `info` | Information générale | Broadcast / Individuelle |
| `success` | Succès / Confirmation | Broadcast / Individuelle |
| `warning` | Avertissement | Broadcast / Individuelle |
| `error` | Erreur / Problème | Broadcast / Individuelle |
| `announcement` | Annonce importante | Broadcast / Individuelle |

---

## 🔐 Sécurité

1. **Authentification** : Toutes les routes nécessitent un token JWT
2. **Autorisation** :
   - Les utilisateurs ne peuvent voir que leurs notifications personnelles + les notifications globales
   - Seuls les admins peuvent créer des notifications (broadcast/send)
3. **Validation** : Les champs requis sont validés côté backend
4. **Isolation** : Les notifications individuelles sont isolées par `user_id`
5. **Protection de la vie privée** :
   - Lorsqu'un utilisateur fait une réservation, **deux notifications** sont créées :
     - `reservation` (Admin) : Visible uniquement par les admins, contient le nom/prénom de l'utilisateur
     - `reservation_public` : Visible par tous les utilisateurs, ne contient **pas** le nom/prénom (message : "Un utilisateur a réservé...")
   - Les notifications de type `reservation` avec `user_id = NULL` (globales) ne sont **visibles que par les admins**
   - Les notifications de type `reservation_public` sont visibles par tous les utilisateurs

---

## 📝 Exemples d'Utilisation

### **Créer une notification automatique (Backend)**

```javascript
const { createNotification } = require('./routes/notifications');

// Notification globale pour tous les admins
await createNotification(
  'document',
  'Nouveau document financier',
  'Un nouveau document a été ajouté.',
  null, // user_id = NULL = globale
  documentId,
  'financial_document',
  '/financial-documents'
);

// Notification individuelle pour un utilisateur
await createNotification(
  'reservation',
  'Réservation approuvée',
  'Votre réservation a été approuvée.',
  userId, // user_id spécifique
  reservationId,
  'product_reservation',
  '/structured-products'
);
```

### **Créer une notification manuelle (Frontend)**

```javascript
// Broadcast à tous
await notificationsAPI.broadcast(
  'announcement',
  'Nouvelle fonctionnalité',
  'Une nouvelle fonctionnalité est disponible !',
  '/new-feature'
);

// Notification individuelle
await notificationsAPI.send(
  123, // userId
  'info',
  'Rappel important',
  'N\'oubliez pas de soumettre votre formation.',
  '/formations'
);
```

---

## 🎨 Interface Utilisateur

### **Badge de Notification**
- Affiché dans le header de l'application
- Badge rouge avec le nombre de notifications non lues
- Animation pulse si des notifications non lues

### **Page Notifications**
- Liste des notifications avec :
  - Icône selon le type
  - Titre et message
  - Date de création
  - Badge "Non lue" si applicable
  - Lien cliquable si disponible
- Bouton "Tout marquer comme lu"
- Filtres : Toutes / Non lues / Lues

---

## 🔧 Maintenance

### **Nettoyage des Notifications**
- Les notifications sont conservées indéfiniment
- Pour nettoyer les anciennes notifications :
  ```sql
  DELETE FROM notifications 
  WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR) 
  AND is_read = TRUE;
  ```

### **Ajout d'un Nouveau Type**
1. Ajouter le type dans la base de données (si nécessaire)
2. Utiliser `createNotification()` avec le nouveau type
3. Ajouter l'affichage dans `NotificationsPage.tsx` si besoin d'un style spécifique

---

## 📌 Points Importants

1. **Notifications Globales** : `user_id = NULL` → Visible par tous
2. **Notifications Individuelles** : `user_id = X` → Visible uniquement par l'utilisateur X
3. **Lien Optionnel** : Permet de rediriger vers une page spécifique
4. **Related ID/Type** : Permet de lier une notification à une entité (formation, document, etc.)
5. **Non-bloquant** : Les erreurs de notification ne bloquent pas les opérations principales


