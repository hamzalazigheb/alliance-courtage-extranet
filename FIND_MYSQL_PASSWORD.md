# 🔑 Trouver le Mot de Passe MySQL

## Méthode 1 : Vérifier docker-compose.yml

```bash
# Voir la configuration MySQL
cat docker-compose.yml | grep -A 10 MYSQL
# ou
cat docker-compose.yml | grep -i password
```

## Méthode 2 : Vérifier les Variables d'Environnement du Conteneur

```bash
# Voir toutes les variables d'environnement du conteneur MySQL
docker exec alliance-courtage-mysql env | grep MYSQL

# Ou voir toutes les variables
docker exec alliance-courtage-mysql env
```

## Méthode 3 : Vérifier le Fichier .env

```bash
# Chercher un fichier .env
ls -la .env
cat .env | grep MYSQL

# Ou chercher dans tous les fichiers
grep -r "MYSQL_ROOT_PASSWORD" .
```

## Méthode 4 : Vérifier la Configuration Docker

```bash
# Voir la configuration complète du conteneur
docker inspect alliance-courtage-mysql | grep -i password
docker inspect alliance-courtage-mysql | grep -A 20 Env
```

---

## Solution Alternative : Utiliser le Mot de Passe Par Défaut

Si vous avez créé le conteneur avec un mot de passe par défaut, essayez :
- `root`
- `password`
- `admin`
- `alliance`
- `alliance_courtage`

---

**Exécutez ces commandes dans Termius pour trouver le mot de passe !**


