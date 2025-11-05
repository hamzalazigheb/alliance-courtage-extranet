# 🔒 Configuration HTTPS pour résoudre l'avertissement de sécurité

## Problème
L'avertissement "The file at 'blob:...' was loaded over an insecure connection" apparaît car le site est servi via HTTP au lieu de HTTPS.

## Solutions

### Option 1 : Configurer HTTPS avec un certificat SSL (RECOMMANDÉ pour production)

#### A. Utiliser Let's Encrypt (gratuit)

```bash
# Installer certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtenir un certificat SSL pour votre domaine
sudo certbot --nginx -d votre-domaine.com

# Vérifier le renouvellement automatique
sudo certbot renew --dry-run
```

#### B. Configurer Nginx pour HTTPS

Créer/modifier `/etc/nginx/sites-available/alliance-courtage` :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com;

    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;

    # Configuration SSL sécurisée
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Option 2 : Ignorer l'avertissement (pour développement/test)

Cet avertissement n'est pas bloquant. C'est juste un avertissement de sécurité du navigateur. Les fonctionnalités continuent de fonctionner normalement.

### Option 3 : Modifier le code pour éviter les URLs blob (si nécessaire)

Si vous voulez éviter complètement les URLs blob, vous pouvez servir les fichiers directement depuis le serveur au lieu d'utiliser `window.URL.createObjectURL()`.

## Commandes rapides pour HTTPS

```bash
# Si vous avez un domaine configuré
sudo certbot --nginx -d votre-domaine.com

# Redémarrer Nginx
sudo systemctl restart nginx

# Vérifier la configuration
sudo nginx -t
```

## Note importante

- **Pour la production** : HTTPS est fortement recommandé pour la sécurité
- **Pour le développement/test** : L'avertissement peut être ignoré, il n'affecte pas le fonctionnement
- **Les URLs blob** : Sont créées localement dans le navigateur et ne sont pas réellement "servies" par HTTP, mais le navigateur montre cet avertissement par sécurité

**Recommandation** : Si vous avez un domaine, configurez HTTPS avec Let's Encrypt. Sinon, l'avertissement peut être ignoré pour l'instant.

