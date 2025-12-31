# 🚀 Simple VPS Deployment Guide (That Actually Works!)

## This guide uses the SIMPLEST method possible

**Requirements:**
- Ubuntu 20.04/22.04 VPS
- Root access via PuTTY
- Your VPS IP address

---

## 📦 Step 1: Install Everything (Copy-Paste All at Once)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python, Node.js, MongoDB
sudo apt install -y python3 python3-pip python3-venv nodejs npm mongodb git

# Install PM2 (process manager - much simpler than supervisor)
sudo npm install -g pm2

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

---

## 📁 Step 2: Create Directory and Upload Files

```bash
# Create directory
mkdir -p /root/shadowzm
cd /root/shadowzm
```

**Now upload your files using WinSCP or FileZilla:**
- Upload everything from `/app/backend/` to `/root/shadowzm/backend/`
- Upload everything from `/app/frontend/` to `/root/shadowzm/frontend/`

**OR use this command on VPS to download from this server:**
```bash
# If you have the files in a zip
# Upload the zip via WinSCP, then:
cd /root/shadowzm
unzip your-files.zip
```

---

## ⚙️ Step 3: Setup Backend

```bash
cd /root/shadowzm/backend

# Install Python packages
pip3 install fastapi uvicorn motor pymongo python-dotenv pydantic email-validator pyjwt bcrypt passlib python-a2s requests

# Create .env file
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=shadowzm_database
CORS_ORIGINS=*
JWT_SECRET=shadowzm-secret-key-2024
BAN_WEBHOOK_SECRET=shadowzm-ban-secret-2024
EOF

# Test backend manually
python3 -c "import fastapi; print('Backend dependencies OK!')"
```

---

## 🎨 Step 4: Setup Frontend

```bash
cd /root/shadowzm/frontend

# Create .env file (IMPORTANT: Replace YOUR_VPS_IP!)
echo "REACT_APP_BACKEND_URL=http://YOUR_VPS_IP" > .env

# Install dependencies
npm install

# Build for production (this takes 2-3 minutes)
npm run build

# Verify build was created
ls -la build/
```

---

## 🚀 Step 5: Start Services with PM2

```bash
# Start Backend
cd /root/shadowzm/backend
pm2 start "uvicorn server:app --host 0.0.0.0 --port 8001" --name shadowzm-backend

# Start Frontend (serve the build folder)
cd /root/shadowzm/frontend
pm2 serve build 3000 --name shadowzm-frontend --spa

# Save PM2 configuration
pm2 save

# Make PM2 start on boot
pm2 startup
# Copy and run the command it gives you

# Check status
pm2 status
```

**You should see:**
```
┌─────┬──────────────────────┬─────────┬─────────┐
│ id  │ name                 │ status  │ restart │
├─────┼──────────────────────┼─────────┼─────────┤
│ 0   │ shadowzm-backend     │ online  │ 0       │
│ 1   │ shadowzm-frontend    │ online  │ 0       │
└─────┴──────────────────────┴─────────┴─────────┘
```

---

## 🌐 Step 6: Open Firewall Ports

```bash
# Allow ports 3000 and 8001
sudo ufw allow 3000
sudo ufw allow 8001
sudo ufw allow 80
sudo ufw allow 22

# Enable firewall (if not already)
sudo ufw enable
```

---

## ✅ Step 7: Test Your Website

```bash
# Test backend
curl http://localhost:8001/api/

# Should return: {"message":"shadowzm: Zombie reverse API","version":"1.0.0"}

# Test server status
curl http://localhost:8001/api/server-status
```

**Open in browser:**
- Frontend: `http://YOUR_VPS_IP:3000`
- Backend API: `http://YOUR_VPS_IP:8001/api/`
- Server Status: `http://YOUR_VPS_IP:8001/api/server-status`

---

## 🔄 RESTART COMMANDS (Simple!)

```bash
# Restart backend
pm2 restart shadowzm-backend

# Restart frontend
pm2 restart shadowzm-frontend

# Restart both
pm2 restart all

# Check status
pm2 status

# View logs
pm2 logs shadowzm-backend
pm2 logs shadowzm-frontend

# Stop services
pm2 stop all

# Start services
pm2 start all
```

---

## 🔧 If Something Goes Wrong

### Backend not starting?
```bash
# Check logs
pm2 logs shadowzm-backend --lines 50

# Stop it
pm2 stop shadowzm-backend
pm2 delete shadowzm-backend

# Start manually to see error
cd /root/shadowzm/backend
python3 -m uvicorn server:app --host 0.0.0.0 --port 8001

# Fix the error, then restart with PM2
pm2 start "uvicorn server:app --host 0.0.0.0 --port 8001" --name shadowzm-backend
```

### Frontend not starting?
```bash
# Check logs
pm2 logs shadowzm-frontend --lines 50

# Rebuild
cd /root/shadowzm/frontend
rm -rf build node_modules
npm install
npm run build

# Restart
pm2 restart shadowzm-frontend
```

### Can't access from browser?
```bash
# Check if services are running
pm2 status

# Check firewall
sudo ufw status

# Check if ports are listening
sudo netstat -tulpn | grep 3000
sudo netstat -tulpn | grep 8001

# Check VPS provider firewall (AWS, DigitalOcean, etc.)
# Make sure ports 3000 and 8001 are allowed
```

---

## 🎯 Alternative: Run on Port 80 (Standard HTTP Port)

If you want to access without :3000 in URL:

### Install Nginx
```bash
sudo apt install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/shadowzm
```

Paste this:
```nginx
server {
    listen 80;
    server_name YOUR_VPS_IP;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable and start:
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/shadowzm /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

Now access: `http://YOUR_VPS_IP` (no port needed!)

---

## 📋 Quick Reference

### Check Everything is Running
```bash
pm2 status
sudo systemctl status mongodb
sudo systemctl status nginx
```

### Restart After Code Changes
```bash
# Backend changes
cd /root/shadowzm/backend
pm2 restart shadowzm-backend

# Frontend changes
cd /root/shadowzm/frontend
npm run build
pm2 restart shadowzm-frontend
```

### View Logs
```bash
pm2 logs
pm2 logs shadowzm-backend
pm2 logs shadowzm-frontend --lines 100
```

### Complete Reset
```bash
pm2 stop all
pm2 delete all

cd /root/shadowzm/backend
pm2 start "uvicorn server:app --host 0.0.0.0 --port 8001" --name shadowzm-backend

cd /root/shadowzm/frontend
pm2 serve build 3000 --name shadowzm-frontend --spa

pm2 save
```

---

## 🎮 Update Sync Scripts

On your Pterodactyl server, update scripts to point to your VPS:

**stats_sync.py:**
```python
WEBSITE_URL = "http://YOUR_VPS_IP:8001"
SECRET = "shadowzm-ban-secret-2024"
```

**import_bans.py:**
```python
WEBSITE_URL = "http://YOUR_VPS_IP:8001"
SECRET = "shadowzm-ban-secret-2024"
```

Test from Pterodactyl:
```bash
curl -X POST "http://YOUR_VPS_IP:8001/api/players/webhook" \
  -H "Content-Type: application/json" \
  -d '{"secret":"shadowzm-ban-secret-2024","nickname":"Test","steamid":"STEAM_0:1:123","kills":100,"deaths":50,"headshots":30}'
```

---

## ✅ Summary

**What we installed:**
- Python 3 + packages (backend)
- Node.js + npm (frontend)
- MongoDB (database)
- PM2 (process manager)
- Nginx (optional, for port 80)

**Services running:**
- Backend: PM2 process on port 8001
- Frontend: PM2 process on port 3000
- MongoDB: System service on port 27017

**How to restart:**
- `pm2 restart shadowzm-backend` (backend)
- `pm2 restart shadowzm-frontend` (frontend)
- `pm2 restart all` (both)

**Access website:**
- With Nginx: `http://YOUR_VPS_IP`
- Without Nginx: `http://YOUR_VPS_IP:3000`

---

## 🚨 Still Not Working?

**Run this diagnostic script:**
```bash
echo "=== System Check ==="
python3 --version
node --version
npm --version
pm2 --version
sudo systemctl status mongodb | head -5

echo -e "\n=== Services ==="
pm2 status

echo -e "\n=== Ports ==="
sudo netstat -tulpn | grep -E '3000|8001|27017'

echo -e "\n=== Backend Test ==="
curl -s http://localhost:8001/api/ || echo "Backend not responding!"

echo -e "\n=== Frontend Files ==="
ls -la /root/shadowzm/frontend/build/ | head -10
```

Send me the output and I'll help debug!

---

**This method is MUCH simpler than using supervisor. PM2 is easier and works better! 🚀**
