# ⚡ Build Rapide du Frontend sur le Serveur

## Problème

Le frontend sur le serveur est ancien - l'icône ✏️ pour modifier les catégories n'apparaît pas.

## Solution : Build avec Docker (Pas besoin de npm)

### Commandes à Exécuter

```bash
cd ~/alliance/alliance

# 1. Résoudre les conflits Git
git stash
git pull origin main

# 2. Builder avec Docker
chmod +x build-frontend-docker.sh
./build-frontend-docker.sh
```

### Ou en une seule ligne

```bash
cd ~/alliance/alliance && git stash && git pull origin main && chmod +x build-frontend-docker.sh && ./build-frontend-docker.sh
```

## Ce que le Script Fait

1. ✅ Met à jour le code (git pull)
2. ✅ Crée un conteneur Docker temporaire avec Node.js
3. ✅ Build le frontend dans le conteneur
4. ✅ Extrait le dossier dist/
5. ✅ Copie dans le conteneur frontend
6. ✅ Nettoie les conteneurs temporaires
7. ✅ Redémarre le conteneur frontend

## Résultat Attendu

Après le build, vous devriez voir :
- ✅ L'icône ✏️ à côté de chaque catégorie
- ✅ Possibilité de modifier la catégorie en cliquant sur ✏️
- ✅ Filtre par catégorie fonctionnel
- ✅ Messages d'erreur détaillés dans la console

## Vérification

1. **Vider le cache** : `Ctrl+Shift+R` dans le navigateur
2. **Recharger** : `http://13.38.115.36/#manage`
3. **Vérifier** : L'icône ✏️ devrait apparaître à côté de "Général"

---

**Note** : Le build peut prendre 2-3 minutes. Soyez patient !

