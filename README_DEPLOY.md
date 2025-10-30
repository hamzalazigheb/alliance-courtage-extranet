## Production Docker deployment (frontend + backend + MySQL)

### Files added
- `Dockerfile.frontend`: Build Vite app and serve with nginx
- `backend/Dockerfile.prod`: Backend image listening on port 4000
- `docker-compose.yml`: 3 services: `mysql`, `backend`, `frontend`
- `backend/config.env.example`: Example backend env config

### 1) Create backend env file

Copy and edit:

```bash
cp backend/config.env.example backend/.env
# edit backend/.env and set CORS_ORIGIN (add your EC2 IP), JWT_SECRET, DB_* if needed
```

### 2) Build and run

```bash
docker compose up -d --build
```

### 3) Health checks

```bash
curl -i http://localhost:80/            # frontend
curl -i http://localhost:4000/api/health  # backend
```

### 4) Database initialization

If your app expects tables (e.g., `user_sessions`, `cms_content`, `bordereaux`), run the migrations/scripts you already have, or create tables via SQL.

### 5) Configure frontend API base URL

Ensure your frontend uses `VITE_API_BASE_URL` pointing to `http://<EC2_PUBLIC_IP>:4000` (or domain). Build-time variable.

### 6) EC2 setup (Ubuntu)

```bash
sudo apt update -y
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release; echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt update -y
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

Then clone the repo, create `backend/.env`, and run `docker compose up -d --build`.


