# 📧 Configurer Mailtrap sur le Serveur

## Problème
Les emails sont loggés dans la console au lieu d'être envoyés via Mailtrap.

## Solution

Le fichier `config.env` existe sur le serveur mais les variables SMTP doivent être passées via `docker-compose.yml` OU chargées depuis `config.env`.

### Option 1 : Vérifier que config.env est correctement monté (Recommandé)

Sur le serveur, vérifiez que le fichier `config.env` contient bien les credentials Mailtrap :

```bash
cd /var/www/alliance-courtage/backend
cat config.env | grep SMTP
```

Vous devriez voir :
```
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=01b3043c145590
SMTP_PASSWORD=2409ccf792d22c
SMTP_FROM=noreply@alliance-courtage.fr
FRONTEND_URL=http://13.38.115.36
```

### Option 2 : Créer un fichier .env pour docker-compose

Sur le serveur :

```bash
cd /var/www/alliance-courtage/backend
cat > .env <<EOF
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=01b3043c145590
SMTP_PASSWORD=2409ccf792d22c
SMTP_FROM=noreply@alliance-courtage.fr
FRONTEND_URL=http://13.38.115.36
EOF
```

### Redémarrer le backend

Après avoir configuré :

```bash
cd /var/www/alliance-courtage/backend
docker compose restart backend
```

### Vérifier que Mailtrap fonctionne

```bash
# Vérifier les variables d'environnement dans le container
docker exec alliance-courtage-backend env | grep SMTP

# Vous devriez voir :
# SMTP_HOST=sandbox.smtp.mailtrap.io
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=01b3043c145590
# SMTP_PASSWORD=2409ccf792d22c
```

### Tester

1. Allez sur `http://13.38.115.36/#manage`
2. Cliquez sur "Mot de passe oublié ?"
3. Entrez un email admin
4. L'email devrait apparaître dans votre inbox Mailtrap (https://mailtrap.io)

## Si cela ne fonctionne toujours pas

Vérifiez les logs du backend lors de l'envoi d'un email :

```bash
docker logs -f alliance-courtage-backend
```

Si vous voyez `⚠️ SMTP non configuré. Mode développement activé.`, cela signifie que les variables ne sont pas chargées.

### Solution : Forcer les variables dans docker-compose.yml

Le fichier `docker-compose.yml` a été mis à jour pour inclure les variables SMTP. Après `git pull`, redémarrez :

```bash
cd /var/www/alliance-courtage
git pull origin main
cd backend
docker compose down
docker compose up -d
```

