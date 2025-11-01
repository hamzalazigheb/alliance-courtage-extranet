# Quick Start - EC2 Deployment (5 Minutes)

## 1. Create EC2 Instance (AWS Console)

1. **EC2** → **Launch Instance**
2. **AMI**: Ubuntu 22.04 LTS
3. **Instance Type**: t2.micro (free tier)
4. **Security Group**:
   - SSH (22) from My IP
   - HTTP (80) from Anywhere (0.0.0.0/0)
   - HTTPS (443) from Anywhere (0.0.0.0/0)
5. **Key Pair**: Create new, download `.pem` file
6. **Launch** and note the **Public IP**

## 2. Connect (Termius)

1. Import `.pem` key into Termius Keychain
2. Add Host: `ubuntu@YOUR_PUBLIC_IP`
3. Connect

## 3. Setup Server (Copy-paste all at once)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
sudo apt install -y docker-compose-plugin

# Logout and login again (for docker group)
exit
# Then reconnect via Termius

# Create project directory
sudo mkdir -p /var/www/gnca && sudo chown ubuntu:ubuntu /var/www/gnca
cd /var/www/gnca

# Clone repository
git clone https://github.com/hamzalazigheb/alliance-courtage-extranet.git .

# Make deploy script executable
chmod +x deploy.sh
```

## 4. Deploy

```bash
cd /var/www/gnca
./deploy.sh
```

## 5. Access Application

- URL: `http://YOUR_PUBLIC_IP`
- Login: `admin@alliance-courtage.fr` / `password`

## Done! 🎉

For detailed instructions, see `EC2_DEPLOYMENT_GUIDE.md`

