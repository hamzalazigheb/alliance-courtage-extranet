# 🎨 Charte Graphique - Pages Publiques

## Vue d'ensemble
La charte graphique des pages publiques utilise un style **glassmorphism moderne** avec des effets de transparence et de flou, combiné à des dégradés bleus professionnels.

---

## 📍 Page `/accueil` - Éléments Visuels

### Structure de la Page

#### 1. **Section Welcome (Bienvenue)**
- **Container** :
  - Background : `bg-white/70` (blanc à 70% d'opacité)
  - Effet : `backdrop-blur-sm` (flou d'arrière-plan)
  - Forme : `rounded-2xl` (coins très arrondis)
  - Ombre : `shadow-xl` (ombre portée importante)
  - Bordure : `border border-white/20` (bordure blanche semi-transparente)
  - Padding : `p-6 sm:p-8` (responsive : 6 sur mobile, 8 sur desktop)

- **Titre** :
  - Taille : `text-2xl sm:text-3xl` (responsive)
  - Poids : `font-bold`
  - Couleur : `text-gray-800`

#### 2. **Section Actualités**
- **Header de la section** :
  - Background : Dégradé bleu foncé à bleu vif
    - `bg-gradient-to-r from-[#0B1220] to-[#1D4ED8]`
    - Couleur de départ : `#0B1220` (bleu très foncé, presque noir)
    - Couleur d'arrivée : `#1D4ED8` (bleu royal)
  - Padding : `p-4 sm:p-6`
  - Texte : `text-white` (titres en blanc)

- **Container principal** :
  - Background : `bg-white/70 backdrop-blur-sm`
  - Forme : `rounded-2xl`
  - Ombre : `shadow-xl`
  - Bordure : `border border-white/20`

- **Cartes d'actualités** :
  - Background : `bg-gray-50`
  - Forme : `rounded-lg`
  - Padding : `p-3 sm:p-4`
  - Texte titre : `text-gray-800 font-semibold`
  - Texte contenu : `text-gray-600`
  - Date : `text-gray-500 text-xs`

#### 3. **Section Services**
- **Container** :
  - Background : `bg-white/70 backdrop-blur-sm`
  - Forme : `rounded-2xl`
  - Ombre : `shadow-xl`
  - Bordure : `border border-white/20`
  - Padding : `p-4 sm:p-6`

- **Titre** :
  - Taille : `text-lg sm:text-xl`
  - Poids : `font-semibold`
  - Couleur : `text-gray-800`

- **Liste** :
  - Texte : `text-gray-600`
  - Espacement : `space-y-1 sm:space-y-2`
  - Taille : `text-sm sm:text-base`

---

## 🎨 Palette de Couleurs

### Couleurs Principales

#### Dégradés Professionnels
- **Dégradé Principal (Headers)** :
  - `from-[#0B1220]` → `to-[#1D4ED8]`
  - Utilisé pour : En-têtes de sections importantes (Actualités, etc.)

- **Dégradé Indigo-Purple (Boutons/Actions)** :
  - `from-indigo-500` → `to-purple-600`
  - Utilisé pour : Boutons principaux, liens actifs
  - Variantes hover : `from-indigo-600` → `to-purple-700`

#### Couleurs de Texte
- **Titres principaux** : `text-gray-800` (gris foncé)
- **Sous-titres/Contenu** : `text-gray-600` (gris moyen)
- **Texte secondaire** : `text-gray-500` (gris clair)
- **Texte sur fond sombre** : `text-white`

#### Couleurs de Fond
- **Cartes principales** : `bg-white/70` (blanc semi-transparent)
- **Cartes secondaires** : `bg-gray-50`
- **Effet glassmorphism** : `backdrop-blur-sm` (flou d'arrière-plan)

---

## 📐 Typographie

### Hiérarchie des Titres

#### H1 (Page principale)
- Taille : `text-2xl sm:text-3xl` ou `text-3xl`
- Poids : `font-bold`
- Couleur : `text-gray-800`

#### H2 (Sections)
- Taille : `text-xl sm:text-2xl`
- Poids : `font-bold`
- Couleur : `text-white` (sur fond dégradé) ou `text-gray-800`

#### H3 (Sous-sections)
- Taille : `text-lg sm:text-xl`
- Poids : `font-semibold`
- Couleur : `text-gray-800`

#### Texte de corps
- Taille : `text-sm sm:text-base`
- Poids : `font-normal`
- Couleur : `text-gray-600`

#### Texte secondaire
- Taille : `text-xs sm:text-sm`
- Couleur : `text-gray-500`

---

## 🔲 Formes et Bordures

### Rayons de Bordure
- **Cartes principales** : `rounded-2xl` (coins très arrondis - 16px)
- **Cartes secondaires** : `rounded-lg` (coins arrondis - 8px)
- **Boutons** : `rounded-lg` ou `rounded-xl`

### Ombres
- **Cartes principales** : `shadow-xl` (ombre importante)
- **Boutons** : `shadow-lg hover:shadow-xl` (ombre au survol)

---

## 📏 Espacements et Layout

### Container Principal
- **Largeur maximale** : `max-w-5xl` ou `max-w-6xl`
- **Centrage** : `mx-auto`
- **Padding horizontal** : `px-4 sm:px-6 lg:px-8`
- **Espacement vertical** : `space-y-6 sm:space-y-8`

### Padding des Cartes
- **Mobile** : `p-4` ou `p-6`
- **Desktop** : `sm:p-6` ou `sm:p-8`

### Espacements entre éléments
- **Sections** : `space-y-4 sm:space-y-6`
- **Listes** : `space-y-1 sm:space-y-2`

---

## ✨ Effets Visuels

### Glassmorphism
- **Background** : `bg-white/70` (blanc à 70% d'opacité)
- **Flou** : `backdrop-blur-sm` (flou d'arrière-plan léger)
- **Bordure** : `border border-white/20` (bordure blanche semi-transparente)

### Dégradés
- **Direction** : `bg-gradient-to-r` (gauche à droite)
- **Couleurs** : Utilisation de couleurs personnalisées `from-[#0B1220] to-[#1D4ED8]`

### Transitions
- **Boutons** : `transition-all duration-200`
- **Hover** : Effets de changement de couleur et d'ombre

---

## 🖱️ États Interactifs

### Boutons Actifs
- Background : `bg-gradient-to-r from-[#0B1220] to-[#1D4ED8]`
- Texte : `text-white`
- Ombre : `shadow-lg`

### Hover
- Ombre : `hover:shadow-xl`
- Transformation : `hover:-translate-y-0.5` (léger déplacement vers le haut)
- Couleur : Changement de teinte du dégradé

---

## 📱 Responsive Design

### Breakpoints
- **Mobile** : Classes par défaut (sans préfixe)
- **sm** : `sm:` (640px+) - Tablettes
- **md** : `md:` (768px+) - Tablettes landscape
- **lg** : `lg:` (1024px+) - Desktop

### Adaptations Responsive
- **Tailles de texte** : `text-2xl sm:text-3xl`
- **Padding** : `p-4 sm:p-6`
- **Espacements** : `space-y-4 sm:space-y-6`
- **Grid** : `grid-cols-1 md:grid-cols-3`

---

## 🎯 Composants Réutilisables

### Card Pattern (Carte Standard)
```tsx
<div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20">
  {/* Contenu */}
</div>
```

### Header avec Dégradé
```tsx
<div className="bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] p-4 sm:p-6">
  <h2 className="text-xl sm:text-2xl font-bold text-white">Titre</h2>
</div>
```

### Bouton Principal
```tsx
<button className="bg-gradient-to-r from-[#0B1220] to-[#1D4ED8] text-white px-6 py-3 rounded-lg hover:shadow-xl transition-all">
  Action
</button>
```

---

## 📋 Résumé de la Charte Graphique

### Identité Visuelle
- **Style** : Moderne, professionnel, glassmorphism
- **Couleurs principales** : Bleu foncé (#0B1220) → Bleu vif (#1D4ED8)
- **Effets** : Transparence, flou d'arrière-plan, dégradés
- **Typographie** : Hiérarchie claire avec graisses variées
- **Espacements** : Généreux et responsive
- **Formes** : Coins très arrondis (rounded-2xl)

### Points Clés
✅ **Glassmorphism** : Transparence + flou pour un effet moderne
✅ **Dégradés bleus** : Couleurs professionnelles et cohérentes
✅ **Responsive** : Adaptation fluide mobile/desktop
✅ **Hiérarchie visuelle** : Contrastes et espacements clairs
✅ **Cohérence** : Même style appliqué sur toutes les pages publiques

