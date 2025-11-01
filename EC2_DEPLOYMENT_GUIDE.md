# Complete EC2 Deployment Guide - Alliance Courtage Extranet

This guide will walk you through creating an EC2 instance and deploying your application from scratch.

## Prerequisites
- AWS Account
- GitHub repository with your code
- Basic knowledge of terminal/SSH

---

## Part 1: Create EC2 Instance

### Step 1: Launch EC2 Instance

1. **Login to AWS Console**
   - Go to https://console.aws.amazon.com
   - Navigate to **EC2** service

2. **Launch Instance**
   - Click **"Launch Instance"** button
   - Enter name: `alliance-courtage-extranet`

3. **Choose AMI (Amazon Machine Image)**
   - Select **Ubuntu Server 22.04 LTS** (64-bit x86)
   - Free tier eligible

4. **Choose Instance Type**
   - Select **t2.micro** (free tier) or **t3.small** (better performance)
   - Click **"Next: Configure Instance Details"**

5. **Configure Instance**
   - Keep defaults or adjust as needed
   - Click **"Next: Add Storage"**

6. **Add Storage**
   - Default 8 GB is usually enough
   - Increase to 20 GB for production (recommended)
   - Click **"Next: Add Tags"**

7. **Add Tags** (Optional)
   - Key: `Name`, Value: `alliance-courtage-extranet`
   - Click **"Next: Configure Security Group"**

8. **Configure Security Group** (IMPORTANT!)
   - Create a new security group: `alliance-extranet-sg`
   - Add these rules:
   
   | Type | Protocol | Port Range | Source | Description |
   |------|----------|------------|--------|-------------|
   | SSH | TCP | 22 | My IP (or 0.0.0.0/0 for any) | SSH access |
   | HTTP | TCP | 80 | 0.0.0.0/0 | Web traffic |
   | HTTPS | TCP | 443 | 0.0.0.0/0 | Secure web traffic |
   | Custom TCP | TCP | 3001 | 127.0.0.1 | Backend API (optional) |

   - Click **"Review and Launch"**

9. **Review and Launch**
   - Review all settings
   - Click **"Launch"**

10. **Create/Select Key Pair**
   - Choose **"Create a new key pair"**
   - Name: `alliance-extranet-key`
   - Click **"Download Key Pair"** (IMPORTANT: Save this .pem file!)
   - Click **"Launch Instances"**

11. **Wait for Instance**
   - Click **"View Instances"**
   - Wait for Status Checks to show **"2/2 checks passed"** (takes 1-2 minutes)

12. **Get Public IP**
   - Note the **Public IPv4 address** (e.g., `15.237.236.9`)

---

## Part 2: Connect to EC2 Instance

### Option A: Using Termius (Recommended)

1. **Install Termius**
   - Download from https://termius.com or your app store

2. **Import Your Key**
   - Open Termius → **Keychain**
   - Click **"New Key"**
   - Name: `alliance-extranet-key`
   - Click **"Load"** and select your `.pem` file
   - Click **"Save"**

3. **Add Host**
   - Click **"Hosts"** → **"New Host"**
   - Fill in:
     - **Hostname**: `ubuntu@YOUR_PUBLIC_IP` (replace with your actual IP)
     - **Username**: `ubuntu`
     - **Port**: `22`
     - **Authentication**: Select your imported key
   - Click **"Save"**

4. **Connect**
   - Double-click the host to connect

### Option B: Using SSH (Command Line)

```bash
# On Mac/Linux
chmod 400 alliance-extranet-key.pem
ssh -i alliance-extranet-key.pem ubuntu@YOUR_PUBLIC_IP

# On Windows (using Git Bash or WSL)
chmod 400 alliance-extranet-key.pem
ssh -i alliance-extranet-key.pem ubuntu@YOUR_PUBLIC_IP
```

---

## Part 3: Setup Server Environment

### Step 1: Update System

```bash
# Update package list
sudo apt update

# Upgrade system packages
sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential
```

### Step 2: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add ubuntu user to docker group (avoid using sudo)
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt install -y docker-compose-plugin

# Verify installation
docker --version
docker compose version

# Note: You may need to logout and login again for group changes
```

### Step 3: Create Project Directory

```bash
# Create directory for the project
sudo mkdir -p /var/www/gnca
sudo chown ubuntu:ubuntu /var/www/gnca
cd /var/www/gnca
```

### Step 4: Clone Your Repository

```bash
# Clone your GitHub repository
git clone https://github.com/hamzalazigheb/alliance-courtage-extranet.git .

# Or if you have SSH key set up:
# git clone git@github.com:hamzalazigheb/alliance-courtage-extranet.git .
```

---

## Part 4: Configure Environment Variables

### Step 1: Backend Configuration

```bash
cd /var/www/gnca/backend

# Create config file (if needed)
# The docker-compose.yml already has environment variables set,
# but you can customize them if needed:
nano docker-compose.yml
```

The `docker-compose.yml` already has default values:
- DB_HOST: mysql
- DB_PORT: 3306
- DB_NAME: alliance_courtage
- DB_USER: alliance_user
- DB_PASSWORD: alliance_pass
- JWT_SECRET: alliance_courtage_secret_key_2024

**For production, you should change these passwords!**

---

## Part 5: Deploy Application

### Option A: Using the Deploy Script (Recommended)

```bash
cd /var/www/gnca

# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### Option B: Manual Deployment

```bash
cd /var/www/gnca

# Step 1: Stop any existing containers
docker stop alliance-courtage-extranet 2>/dev/null || true
docker rm alliance-courtage-extranet 2>/dev/null || true

# Step 2: Build and start backend (MySQL + API)
cd backend
docker compose build --no-cache
docker compose up -d

# Wait for MySQL to be ready
sleep 15

# Step 3: Run database migrations
docker compose exec -T backend node scripts/runAllMigrations.js || true

# Step 4: Build frontend
cd ..
docker build -t alliance-courtage-frontend:latest .

# Step 5: Start frontend (connected to backend network)
docker run -d \
  --name alliance-courtage-extranet \
  --network backend_alliance-network \
  -p 80:80 \
  --restart unless-stopped \
  alliance-courtage-frontend:latest

# Step 6: Verify everything is running
docker ps
cd backend && docker compose ps && cd ..
```

---

## Part 6: Verify Deployment

### Step 1: Check Container Status

```bash
# Check all containers
docker ps

# Should show:
# - alliance-courtage-extranet (frontend)
# - alliance-courtage-backend (backend)
# - alliance-courtage-mysql (database)
```

### Step 2: Test API Endpoints

```bash
# Test backend health
curl http://localhost:3001/api/health

# Test through nginx proxy
curl http://localhost/api/health

# Expected output:
# {"status":"OK","message":"Alliance Courtage API is running",...}
```

### Step 3: Test in Browser

1. Open browser
2. Go to: `http://YOUR_PUBLIC_IP`
3. You should see the login page
4. Try logging in with:
   - Email: `admin@alliance-courtage.fr`
   - Password: `password` (default from initDatabase.js)

### Step 4: Check Logs

```bash
# Frontend/Nginx logs
docker logs alliance-courtage-extranet

# Backend logs
cd backend && docker compose logs backend

# MySQL logs
cd backend && docker compose logs mysql
```

---

## Part 7: Setup Domain Name (Optional)

### Option 1: Using Route 53

1. Go to **Route 53** in AWS Console
2. Create hosted zone for your domain
3. Create **A Record** pointing to your EC2 Public IP
4. Wait for DNS propagation (5-60 minutes)

### Option 2: Using Your Domain Provider

1. Login to your domain registrar
2. Add **A Record**:
   - Name: `@` (or `www` for subdomain)
   - Value: Your EC2 Public IP
   - TTL: 3600

---

## Part 8: Setup HTTPS (SSL Certificate)

### Using Certbot with Let's Encrypt (Free SSL)

```bash
# Install Nginx and Certbot on host (if not using container nginx)
sudo apt install -y nginx certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Or if you want to configure manually:
sudo certbot certonly --standalone -d your-domain.com
```

**Note**: For HTTPS, you'll need to configure Nginx on the host to proxy to port 80 of your container, or configure the container to handle HTTPS directly.

---

## Part 9: Useful Maintenance Commands

### View Logs

```bash
# Frontend logs (last 50 lines)
docker logs --tail 50 alliance-courtage-extranet

# Backend logs (follow in real-time)
cd backend && docker compose logs -f backend

# All services logs
cd backend && docker compose logs -f
```

### Restart Services

```bash
# Restart frontend
docker restart alliance-courtage-extranet

# Restart backend
cd backend && docker compose restart backend

# Restart all backend services
cd backend && docker compose restart
```

### Update Application

```bash
cd /var/www/gnca

# Pull latest code
git pull origin main

# Rebuild and redeploy
./deploy.sh
```

### Backup Database

```bash
cd backend

# Create backup
docker compose exec mysql mysqldump -u alliance_user -palliance_pass alliance_courtage > backup_$(date +%Y%m%d).sql

# Restore from backup
docker compose exec -T mysql mysql -u alliance_user -palliance_pass alliance_courtage < backup_20240101.sql
```

### Clean Up

```bash
# Remove unused images
docker image prune -f

# Remove unused volumes (BE CAREFUL!)
docker volume prune -f

# Remove everything (nuclear option - will delete all containers/images)
# docker system prune -a --volumes
```

---

## Troubleshooting

### Connection Refused Errors

1. **Check if backend is running**:
   ```bash
   cd backend && docker compose ps
   ```

2. **Check network connectivity**:
   ```bash
   docker network inspect backend_alliance-network
   ```

3. **Check firewall**:
   ```bash
   sudo ufw status
   # Allow HTTP if needed
   sudo ufw allow 80/tcp
   ```

### Can't Connect via SSH

1. **Check Security Group**: Ensure port 22 is open to your IP
2. **Check instance status**: Should be "running"
3. **Check public IP**: Make sure you're using the correct IP

### Database Connection Issues

```bash
# Check MySQL logs
cd backend && docker compose logs mysql

# Test MySQL connection
cd backend && docker compose exec mysql mysql -u alliance_user -palliance_pass alliance_courtage

# Reset database (WARNING: deletes all data)
cd backend && docker compose down -v && docker compose up -d
```

### Frontend Not Loading

```bash
# Check frontend container
docker ps | grep alliance-courtage-extranet

# Check nginx configuration
docker exec alliance-courtage-extranet cat /etc/nginx/conf.d/default.conf

# Rebuild frontend
docker stop alliance-courtage-extranet
docker rm alliance-courtage-extranet
docker build -t alliance-courtage-frontend:latest .
docker run -d --name alliance-courtage-extranet --network backend_alliance-network -p 80:80 --restart unless-stopped alliance-courtage-frontend:latest
```

---

## Security Checklist

- [ ] Change default database passwords in `docker-compose.yml`
- [ ] Change JWT_SECRET in `docker-compose.yml`
- [ ] Setup firewall (UFW): `sudo ufw enable && sudo ufw allow 22 && sudo ufw allow 80 && sudo ufw allow 443`
- [ ] Setup SSL/HTTPS certificate
- [ ] Configure automatic security updates: `sudo apt install unattended-upgrades`
- [ ] Use strong SSH key (already done)
- [ ] Restrict security group to specific IPs if possible
- [ ] Regular backups of database

---

## Cost Optimization

- Use **t2.micro** for testing (free tier eligible)
- Use **t3.small** for production (better performance, ~$0.02/hour)
- Stop instance when not in use: `sudo shutdown -h now` (start from AWS Console)
- Use **Spot Instances** for non-critical workloads (up to 90% discount)
- Setup **CloudWatch Alarms** to monitor costs

---

## Next Steps

1. ✅ Your app should now be accessible at `http://YOUR_PUBLIC_IP`
2. Configure domain name and SSL certificate
3. Setup monitoring and alerts
4. Configure automatic backups
5. Setup CI/CD pipeline for automatic deployments

---

## Quick Reference

```bash
# Access application
http://YOUR_PUBLIC_IP

# Default admin login
Email: admin@alliance-courtage.fr
Password: password

# Project directory
/var/www/gnca

# Backend directory
/var/www/gnca/backend

# Deploy script
/var/www/gnca/deploy.sh

# View logs
docker logs alliance-courtage-extranet
cd backend && docker compose logs

# Restart everything
cd /var/www/gnca && ./deploy.sh
```

---

**Need Help?** Check the `TROUBLESHOOTING.md` file for more detailed troubleshooting steps.

