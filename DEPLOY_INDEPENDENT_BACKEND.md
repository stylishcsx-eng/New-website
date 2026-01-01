# 🚀 Deploy Standalone Backend on YOUR VPS (24/7)

## ✅ THE BACKEND IS ALREADY STANDALONE!

The backend in `shadowzm-website-with-build.tar.gz` is **100% independent** and works without Emergent!

**It already has:**
- ✅ Complete FastAPI backend
- ✅ MongoDB integration
- ✅ CS server status queries
- ✅ User authentication (login/register)
- ✅ Admin panel
- ✅ Banlist & Rankings APIs
- ✅ Webhook endpoints

**You just need to deploy it on YOUR VPS!**

---

## 🎯 Complete VPS Deployment (Works 24/7)

### Prerequisites

- ✅ Ubuntu VPS (20.04/22.04)
- ✅ Root or sudo access
- ✅ MongoDB installed
- ✅ PM2 installed

---

## Step 1: Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python
sudo apt install -y python3 python3-pip python3-venv

# Install MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod

# Install Node.js and PM2
sudo apt install -y nodejs npm
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

---

## Step 2: Extract Backend Files

```bash
# Create directory
sudo mkdir -p /var/www/shadowzm
cd /var/www/shadowzm

# Extract your website package
# (Upload shadowzm-website-with-build.tar.gz to this directory first)
tar -xzf shadowzm-website-with-build.tar.gz

# Verify files extracted
ls -la backend/
ls -la frontend/
```

---

## Step 3: Setup Backend

```bash
cd /var/www/shadowzm/backend

# Install Python dependencies
pip3 install fastapi uvicorn motor pymongo python-dotenv pydantic email-validator pyjwt bcrypt passlib python-a2s requests

# Create .env file
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=shadowzm_database
CORS_ORIGINS=*
JWT_SECRET=shadowzm-secret-key-2024
BAN_WEBHOOK_SECRET=shadowzm-ban-secret-2024
EOF

# Test backend can start
python3 -c "import fastapi; import uvicorn; print('✅ Backend dependencies OK!')"
```

---

## Step 4: Start Backend with PM2 (24/7 Operation)

```bash
cd /var/www/shadowzm/backend

# Start backend with PM2
pm2 start "uvicorn server:app --host 0.0.0.0 --port 8001" --name shadowzm-backend

# Check status
pm2 status

# Should show:
# shadowzm-backend │ online │ 0

# Save PM2 configuration
pm2 save

# Enable PM2 to start on boot
pm2 startup systemd

# Copy and run the command PM2 gives you
# It will look like: sudo env PATH=$PATH:/usr/bin...
```

**✅ Your backend is now running 24/7 on YOUR VPS!**

---

## Step 5: Setup Frontend

```bash
cd /var/www/shadowzm/frontend

# The build folder is already included in the package!
# Verify it exists
ls -la build/

# Should see: index.html, static/, etc.

# If .env needs updating (optional):
echo "REACT_APP_BACKEND_URL=http://YOUR_VPS_IP" > .env

# If you need to rebuild (only if you changed .env):
# npm install
# npm run build
```

---

## Step 6: Configure Nginx (Serve Website)

```bash
# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Create shadowzm config
sudo nano /etc/nginx/sites-available/shadowzm
```

**Paste this complete configuration:**

```nginx
server {
    listen 80;
    server_name YOUR_VPS_IP;  # Or your domain

    # Serve frontend (pre-built)
    root /var/www/shadowzm/frontend/build;
    index index.html;

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API (running on port 8001 with PM2)
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/json application/javascript;
}
```

**Enable and start nginx:**

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/shadowzm /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Should say: "syntax is ok"

# Start nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## Step 7: Configure Firewall

```bash
# Allow HTTP, HTTPS, SSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status
```

---

## Step 8: Verify Everything Works

```bash
# 1. Check PM2 backend
pm2 status
# Should show: shadowzm-backend | online

# 2. Check MongoDB
sudo systemctl status mongod
# Should show: active (running)

# 3. Check Nginx
sudo systemctl status nginx
# Should show: active (running)

# 4. Test backend API
curl http://localhost:8001/api/

# Should return: {"message":"shadowzm: Zombie reverse API"...}

# 5. Test through nginx
curl http://localhost/api/

# Should return same response

# 6. Test server status
curl http://localhost:8001/api/server-status

# Should return server info
```

---

## Step 9: Test in Browser

**Open in browser:**
```
http://YOUR_VPS_IP
```

**Test these:**
1. ✅ Home page loads
2. ✅ Server status shows (live CS server query)
3. ✅ Register new account
4. ✅ Login works
5. ✅ Admin login: `http://YOUR_VPS_IP/admin-login`
   - Username: `Stylish`
   - Password: `Itachi1849`

**All should work! ✅**

---

## 🎯 Your 24/7 Setup

**What's Running on YOUR VPS:**

1. **MongoDB** (systemd service)
   - Database for users, players, bans
   - Auto-starts on reboot
   - Check: `sudo systemctl status mongod`

2. **Backend** (PM2 process)
   - FastAPI on port 8001
   - Auto-restarts if crashes
   - Auto-starts on reboot
   - Check: `pm2 status`

3. **Frontend** (Nginx static files)
   - Pre-built React app
   - Served from `/var/www/shadowzm/frontend/build/`
   - Check: `sudo systemctl status nginx`

4. **Nginx** (systemd service)
   - Serves frontend
   - Proxies `/api` to backend
   - Auto-starts on reboot

---

## 🔄 Management Commands

### Backend Management

```bash
# Restart backend
pm2 restart shadowzm-backend

# Stop backend
pm2 stop shadowzm-backend

# Start backend
pm2 start shadowzm-backend

# View logs
pm2 logs shadowzm-backend

# View last 50 lines
pm2 logs shadowzm-backend --lines 50

# Monitor in real-time
pm2 monit
```

### Check All Services

```bash
# Check everything
pm2 status                        # Backend
sudo systemctl status mongod      # MongoDB
sudo systemctl status nginx       # Nginx

# Quick check script
cat > /root/check-status.sh << 'EOF'
#!/bin/bash
echo "=== ShadowZM Status Check ==="
echo ""
echo "Backend (PM2):"
pm2 status | grep shadowzm-backend
echo ""
echo "MongoDB:"
sudo systemctl status mongod | grep Active
echo ""
echo "Nginx:"
sudo systemctl status nginx | grep Active
echo ""
echo "Backend API:"
curl -s http://localhost:8001/api/ | head -1
EOF

chmod +x /root/check-status.sh

# Run status check
/root/check-status.sh
```

### View Logs

```bash
# Backend logs
pm2 logs shadowzm-backend

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

---

## 🔧 Troubleshooting

### Backend Not Starting

```bash
# Check logs
pm2 logs shadowzm-backend --lines 100

# Common issues:
# 1. MongoDB not running
sudo systemctl start mongod

# 2. Port 8001 in use
sudo lsof -ti:8001 | xargs kill -9

# 3. Missing dependencies
cd /var/www/shadowzm/backend
pip3 install -r requirements.txt

# 4. Test manually
cd /var/www/shadowzm/backend
python3 -m uvicorn server:app --host 0.0.0.0 --port 8001
# Press Ctrl+C after checking error
```

### Frontend Not Loading

```bash
# Check nginx
sudo nginx -t
sudo systemctl status nginx

# Rebuild frontend (if needed)
cd /var/www/shadowzm/frontend
npm run build
sudo systemctl reload nginx
```

### Login Not Working

```bash
# Check backend logs
pm2 logs shadowzm-backend

# Test registration endpoint
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nickname":"test","email":"test@test.com","password":"test123"}'

# Should return: {"access_token":"..."}
```

### MongoDB Issues

```bash
# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Test connection
mongosh
# Should open MongoDB shell
```

---

## 📊 Monitoring & Health

### Setup Health Check Script

```bash
cat > /root/health-check.sh << 'EOF'
#!/bin/bash

echo "🔍 ShadowZM Health Check"
echo "========================"

# Check backend
if curl -s http://localhost:8001/api/ | grep -q "shadowzm"; then
    echo "✅ Backend: Healthy"
else
    echo "❌ Backend: Down"
    pm2 restart shadowzm-backend
fi

# Check MongoDB
if sudo systemctl is-active --quiet mongod; then
    echo "✅ MongoDB: Running"
else
    echo "❌ MongoDB: Down"
    sudo systemctl start mongod
fi

# Check Nginx
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx: Running"
else
    echo "❌ Nginx: Down"
    sudo systemctl start nginx
fi

# Check disk space
df -h / | awk 'NR==2 {print "💾 Disk: " $5 " used"}'

# Check memory
free -h | awk 'NR==2 {print "🧠 Memory: " $3 "/" $2 " used"}'

echo "========================"
EOF

chmod +x /root/health-check.sh

# Run health check
/root/health-check.sh

# Setup cron for automated checks (every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /root/health-check.sh >> /var/log/health-check.log 2>&1") | crontab -
```

---

## 🎉 Success Checklist

- [ ] MongoDB installed and running
- [ ] PM2 installed
- [ ] Backend files extracted to `/var/www/shadowzm/backend/`
- [ ] Backend dependencies installed
- [ ] Backend `.env` configured
- [ ] Backend running with PM2 (shows "online")
- [ ] PM2 startup enabled (survives reboot)
- [ ] Frontend build exists at `/var/www/shadowzm/frontend/build/`
- [ ] Nginx configured and running
- [ ] Firewall allows ports 22, 80, 443
- [ ] Website loads in browser
- [ ] Registration works
- [ ] Login works
- [ ] Admin panel works
- [ ] Server status shows live data

---

## 🚀 Your Backend is Now 24/7!

**What you now have:**
- ✅ Backend runs on YOUR VPS (port 8001)
- ✅ PM2 manages backend (auto-restart, auto-start on boot)
- ✅ MongoDB stores all data locally
- ✅ Nginx serves frontend and proxies API
- ✅ Everything runs 24/7 independently
- ✅ NO dependency on Emergent
- ✅ NO dependency on this session
- ✅ Survives VPS reboots

**Access your website:**
```
http://YOUR_VPS_IP
```

**Check anytime:**
```bash
pm2 status
/root/check-status.sh
```

**Your backend is now completely independent and runs 24/7! 🎉**
