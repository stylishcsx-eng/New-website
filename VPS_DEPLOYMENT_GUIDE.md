# 🚀 VPS Deployment Guide - ShadowZM Website

## Prerequisites

Your VPS needs:
- Ubuntu 20.04/22.04 or Debian 11/12
- Root or sudo access
- At least 2GB RAM
- Python 3.8+
- Node.js 16+

---

## 📦 Part 1: Initial VPS Setup

### 1. Update System
```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install Required Packages
```bash
# Install Python and pip
sudo apt install -y python3 python3-pip python3-venv

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Yarn
npm install -g yarn

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Install Supervisor (for process management)
sudo apt install -y supervisor

# Install Nginx (reverse proxy)
sudo apt install -y nginx
```

### 3. Start and Enable Services
```bash
# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Start Supervisor
sudo systemctl start supervisor
sudo systemctl enable supervisor

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 📁 Part 2: Deploy Your Website Files

### 1. Create Application Directory
```bash
# Create directory
sudo mkdir -p /var/www/shadowzm
cd /var/www/shadowzm

# Create subdirectories
sudo mkdir -p backend frontend
```

### 2. Upload Your Files

**Option A: Using SCP/SFTP (from your local machine)**
```bash
# Upload backend
scp -r backend/* root@YOUR_VPS_IP:/var/www/shadowzm/backend/

# Upload frontend
scp -r frontend/* root@YOUR_VPS_IP:/var/www/shadowzm/frontend/
```

**Option B: Using Git (on VPS)**
```bash
cd /var/www/shadowzm
git clone YOUR_REPO_URL .
```

**Option C: Manual Upload**
Use FileZilla or WinSCP to upload files to `/var/www/shadowzm/`

---

## ⚙️ Part 3: Backend Setup

### 1. Install Backend Dependencies
```bash
cd /var/www/shadowzm/backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Or install manually:
pip install fastapi uvicorn motor pymongo python-dotenv pydantic email-validator pyjwt bcrypt passlib python-a2s requests
```

### 2. Create Backend .env File
```bash
nano /var/www/shadowzm/backend/.env
```

Add this content:
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="shadowzm_database"
CORS_ORIGINS="*"
JWT_SECRET="shadowzm-secret-key-2024"
BAN_WEBHOOK_SECRET="shadowzm-ban-secret-2024"
```

Save: `Ctrl+X`, then `Y`, then `Enter`

---

## 🎨 Part 4: Frontend Setup

### 1. Install Frontend Dependencies
```bash
cd /var/www/shadowzm/frontend

# Install packages
yarn install
# or: npm install
```

### 2. Create Frontend .env File
```bash
nano /var/www/shadowzm/frontend/.env
```

Add this content (replace YOUR_DOMAIN):
```env
REACT_APP_BACKEND_URL=http://YOUR_VPS_IP
# or if you have domain: REACT_APP_BACKEND_URL=https://yourdomain.com
```

Save: `Ctrl+X`, then `Y`, then `Enter`

### 3. Build Frontend
```bash
cd /var/www/shadowzm/frontend
yarn build
# or: npm run build
```

---

## 🔧 Part 5: Setup Supervisor (Process Manager)

### 1. Create Backend Supervisor Config
```bash
sudo nano /etc/supervisor/conf.d/shadowzm-backend.conf
```

Add this content:
```ini
[program:shadowzm-backend]
directory=/var/www/shadowzm/backend
command=/var/www/shadowzm/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
autostart=true
autorestart=true
stderr_logfile=/var/log/shadowzm-backend.err.log
stdout_logfile=/var/log/shadowzm-backend.out.log
user=root
```

### 2. Create Frontend Supervisor Config (Development Mode)
```bash
sudo nano /etc/supervisor/conf.d/shadowzm-frontend.conf
```

Add this content:
```ini
[program:shadowzm-frontend]
directory=/var/www/shadowzm/frontend
command=/usr/bin/yarn start
autostart=true
autorestart=true
stderr_logfile=/var/log/shadowzm-frontend.err.log
stdout_logfile=/var/log/shadowzm-frontend.out.log
environment=PORT="3000"
user=root
```

### 3. Update Supervisor and Start Services
```bash
# Reload supervisor config
sudo supervisorctl reread
sudo supervisorctl update

# Start services
sudo supervisorctl start shadowzm-backend
sudo supervisorctl start shadowzm-frontend

# Check status
sudo supervisorctl status
```

---

## 🌐 Part 6: Setup Nginx (Reverse Proxy)

### Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/shadowzm
```

Add this content:
```nginx
server {
    listen 80;
    server_name YOUR_VPS_IP;  # or your domain name

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support for hot reload
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

### Enable Site and Restart Nginx
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/shadowzm /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

---

## 🔄 RESTART COMMANDS (WHAT YOU ASKED FOR!)

### Check Status
```bash
sudo supervisorctl status
```

### Restart Backend ONLY
```bash
sudo supervisorctl restart shadowzm-backend

# View logs
tail -f /var/log/shadowzm-backend.err.log
```

### Restart Frontend ONLY
```bash
sudo supervisorctl restart shadowzm-frontend

# View logs
tail -f /var/log/shadowzm-frontend.out.log
```

### Restart BOTH (Backend + Frontend)
```bash
sudo supervisorctl restart shadowzm-backend shadowzm-frontend
```

### Restart EVERYTHING (Including Nginx)
```bash
sudo supervisorctl restart all
sudo systemctl restart nginx
```

### Stop Services
```bash
sudo supervisorctl stop shadowzm-backend
sudo supervisorctl stop shadowzm-frontend
```

### Start Services
```bash
sudo supervisorctl start shadowzm-backend
sudo supervisorctl start shadowzm-frontend
```

### View Logs
```bash
# Backend errors
tail -n 100 /var/log/shadowzm-backend.err.log

# Backend output
tail -n 100 /var/log/shadowzm-backend.out.log

# Frontend output
tail -n 100 /var/log/shadowzm-frontend.out.log

# Follow logs in real-time
tail -f /var/log/shadowzm-backend.err.log
```

---

## 🔥 Quick Restart After Code Changes

```bash
# After modifying backend/server.py
cd /var/www/shadowzm/backend
sudo supervisorctl restart shadowzm-backend

# After modifying frontend files
cd /var/www/shadowzm/frontend
yarn build  # if production
sudo supervisorctl restart shadowzm-frontend

# Check if working
curl http://localhost:8001/api/server-status
```

---

## 📊 Testing Your Deployment

```bash
# Test backend
curl http://localhost:8001/api/

# Test server status
curl http://localhost:8001/api/server-status

# Test from outside (replace YOUR_VPS_IP)
curl http://YOUR_VPS_IP/api/

# Open in browser
http://YOUR_VPS_IP
```

---

## 🛠️ Troubleshooting

### Backend won't start
```bash
# Check logs
tail -n 100 /var/log/shadowzm-backend.err.log

# Test manually
cd /var/www/shadowzm/backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001
```

### Frontend won't start
```bash
# Check logs
tail -n 100 /var/log/shadowzm-frontend.out.log

# Test manually
cd /var/www/shadowzm/frontend
yarn start
```

### MongoDB connection issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod

# Check MongoDB logs
sudo tail -n 50 /var/log/mongodb/mongod.log
```

### Port already in use
```bash
# Find what's using port 8001
sudo lsof -i :8001

# Kill process if needed
sudo kill -9 PID_NUMBER

# Find what's using port 3000
sudo lsof -i :3000
```

---

## 🔐 Optional: Setup SSL (HTTPS)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## 📋 Summary of Commands You Need

```bash
# After uploading new backend code
sudo supervisorctl restart shadowzm-backend

# After uploading new frontend code
cd /var/www/shadowzm/frontend
yarn build
sudo supervisorctl restart shadowzm-frontend

# Check everything is running
sudo supervisorctl status

# View backend logs
tail -f /var/log/shadowzm-backend.err.log

# View frontend logs
tail -f /var/log/shadowzm-frontend.out.log

# Restart everything
sudo supervisorctl restart all
sudo systemctl restart nginx
```

---

## 🎯 Your Website Structure on VPS

```
/var/www/shadowzm/
├── backend/
│   ├── venv/              (Python virtual environment)
│   ├── server.py          (Your backend code)
│   ├── requirements.txt
│   └── .env              (Backend config)
├── frontend/
│   ├── src/              (React source)
│   ├── build/            (Production build)
│   ├── package.json
│   └── .env              (Frontend config)
```

---

**Your website will be accessible at:**
- `http://YOUR_VPS_IP` (frontend)
- `http://YOUR_VPS_IP/api` (backend API)

Good luck with your VPS deployment! 🚀
