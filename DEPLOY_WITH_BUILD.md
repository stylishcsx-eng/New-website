# 🚀 Ready-to-Deploy Package (With Pre-Built Frontend!)

## 📦 Download This Package

**File:** `/app/shadowzm-website-with-build.tar.gz`  
**Size:** 2.4 MB  
**Includes:** Backend + Frontend source + **Pre-built frontend (build folder)**

---

## ✅ What's Different

**This package includes the BUILT frontend!**
- ✅ No need to run `npm install` on VPS
- ✅ No need to run `npm run build` on VPS
- ✅ Just extract and deploy!
- ✅ Much faster deployment
- ✅ No Node.js build errors on VPS

**Perfect for:**
- Low-memory VPS (512MB-1GB RAM)
- Quick deployments
- Avoiding npm/node issues on VPS

---

## 🚀 Super Fast Deployment (5 Minutes!)

### Step 1: Install Base Packages on VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install only Python, MongoDB, and Nginx (no Node.js needed!)
sudo apt install -y python3 python3-pip nginx curl gnupg

# Install MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update && sudo apt install -y mongodb-org
sudo systemctl start mongod && sudo systemctl enable mongod

# Install PM2 (minimal Node.js install just for PM2)
sudo apt install -y npm
sudo npm install -g pm2
```

### Step 2: Extract Files

```bash
# Create directory
sudo mkdir -p /var/www/shadowzm
sudo chown -R $USER:$USER /var/www/shadowzm

# Upload the tar.gz file to your VPS, then:
cd /var/www/shadowzm
tar -xzf shadowzm-website-with-build.tar.gz

# Verify build folder exists
ls -la frontend/build/
# Should see: index.html, static/, etc.
```

### Step 3: Setup Backend

```bash
cd /var/www/shadowzm/backend

# Install Python dependencies
pip3 install fastapi uvicorn motor pymongo python-dotenv pydantic email-validator pyjwt bcrypt passlib python-a2s requests

# Backend .env is already included, just verify
cat .env
```

### Step 4: Update Frontend .env

```bash
cd /var/www/shadowzm/frontend

# Update with YOUR VPS IP
nano .env
# Change to: REACT_APP_BACKEND_URL=http://YOUR_VPS_IP
# Save: Ctrl+X, Y, Enter

# Note: Since build is included, you DON'T need to rebuild!
# But if you change .env, you need to rebuild:
# npm install
# npm run build
```

**Important:** The build folder is already configured with a generic backend URL. If you want to change it, you'll need to:
1. Edit `.env` file
2. Rebuild: `npm install && npm run build`

**OR** just use nginx proxy and it will work without changing anything!

### Step 5: Start Backend

```bash
cd /var/www/shadowzm/backend

# Start with PM2
pm2 start "uvicorn server:app --host 0.0.0.0 --port 8001" --name shadowzm-backend

# Save and enable startup
pm2 save
pm2 startup
# Run the command it gives you

# Check status
pm2 status
```

### Step 6: Configure Nginx

```bash
# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Create config
sudo nano /etc/nginx/sites-available/shadowzm
```

**Paste this:**

```nginx
server {
    listen 80;
    server_name YOUR_VPS_IP;  # Replace with your IP

    # Serve pre-built frontend
    root /var/www/shadowzm/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Cache static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/shadowzm /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

### Step 7: Configure Firewall

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw --force enable
```

### Step 8: Test!

```bash
# Test backend
curl http://localhost:8001/api/server-status

# Open in browser
http://YOUR_VPS_IP
```

**Done! Your website should be live! 🎉**

---

## 📦 Package Contents

```
shadowzm-website-with-build.tar.gz (2.4 MB)
├── backend/
│   ├── server.py           (Complete backend)
│   ├── .env                (Configuration)
│   └── requirements.txt    (Dependencies)
└── frontend/
    ├── src/                (Source code - optional)
    ├── public/             (Assets including logo)
    ├── build/              ✅ PRE-BUILT! Ready to deploy!
    │   ├── index.html
    │   ├── static/
    │   │   ├── js/
    │   │   └── css/
    │   └── shadowzm-logo.png
    ├── package.json
    └── .env
```

---

## 🔄 Updates After Deployment

### Update Backend:
```bash
cd /var/www/shadowzm/backend
# Upload new server.py
pm2 restart shadowzm-backend
```

### Update Frontend:
```bash
cd /var/www/shadowzm/frontend
# Upload new files to src/

# Rebuild (need Node.js for this)
npm install
npm run build

# Reload nginx
sudo systemctl reload nginx
```

### View Logs:
```bash
# Backend logs
pm2 logs shadowzm-backend

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## ⚡ Advantages of This Package

**Pre-built frontend means:**
- ✅ No `npm install` on VPS (saves time and RAM)
- ✅ No `npm run build` on VPS (saves CPU and time)
- ✅ No Node.js version conflicts
- ✅ Faster deployment (5 mins vs 15 mins)
- ✅ Works on low-spec VPS (512MB RAM)
- ✅ Less chance of errors

**Just:**
1. Install base packages
2. Extract files
3. Start backend with PM2
4. Configure nginx
5. Done!

---

## 🎯 Super Quick Start (Copy-Paste All)

```bash
#!/bin/bash
# ShadowZM Quick Deploy Script

# Variables (CHANGE THIS!)
VPS_IP="YOUR_VPS_IP"

# Install packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip nginx curl gnupg npm

# Install MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update && sudo apt install -y mongodb-org
sudo systemctl start mongod && sudo systemctl enable mongod

# Install PM2
sudo npm install -g pm2

# Create directory
sudo mkdir -p /var/www/shadowzm
sudo chown -R $USER:$USER /var/www/shadowzm

echo "✅ Base setup complete!"
echo "Now:"
echo "1. Upload shadowzm-website-with-build.tar.gz to /var/www/shadowzm/"
echo "2. Extract: cd /var/www/shadowzm && tar -xzf shadowzm-website-with-build.tar.gz"
echo "3. Setup backend: cd backend && pip3 install -r requirements.txt"
echo "4. Start backend: pm2 start 'uvicorn server:app --host 0.0.0.0 --port 8001' --name shadowzm-backend"
echo "5. Configure nginx (see guide)"
echo "6. Access: http://$VPS_IP"
```

---

## 📊 Deployment Checklist

- [ ] Install Python, Nginx, MongoDB, PM2
- [ ] Create `/var/www/shadowzm` directory
- [ ] Upload and extract tar.gz file
- [ ] Verify `frontend/build/` exists
- [ ] Install backend Python packages
- [ ] Start backend with PM2
- [ ] Configure nginx to serve build folder
- [ ] Enable firewall (ports 22, 80, 443)
- [ ] Test in browser

---

## 🎉 Result

**Your website will be accessible at:**
- `http://YOUR_VPS_IP` - Frontend (served by nginx from build folder)
- `http://YOUR_VPS_IP/api/` - Backend API

**Features working:**
- ✅ Live CS 1.6 server status
- ✅ Player rankings
- ✅ Banlist
- ✅ Admin panel
- ✅ User authentication
- ✅ Your logo everywhere

**No frontend build needed - it's ready to go! 🚀**
