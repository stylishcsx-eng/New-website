# 🚀 CORRECTED VPS Deployment Guide (Proper /var/www Location)

## Using Standard /var/www Directory (Best Practice!)

**You're right - web apps should go in /var/www, not /root!**

---

## 📦 Step 1: Install Everything

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python, Node.js, Git
sudo apt install -y python3 python3-pip python3-venv nodejs npm git curl gnupg

# Install MongoDB (correct method)
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

---

## 📁 Step 2: Create Directory in /var/www (Proper Location!)

```bash
sudo mkdir -p /var/www/shadowzm# Create directory in standard web location

cd /var/www/shadowzm

# Create subdirectories
sudo mkdir -p backend frontend

# Set proper ownership
sudo chown -R $USER:$USER /var/www/shadowzm
```

---

## 📥 Step 3: Upload Your Files

**Upload to /var/www/shadowzm/ using:**
- FileZilla, WinSCP, or SCP

```bash
# If using tar.gz archive:
cd /var/www/shadowzm
tar -xzf shadowzm-website-complete.tar.gz

# Or manually upload:
# - backend files to /var/www/shadowzm/backend/
# - frontend files to /var/www/shadowzm/frontend/
```

---

## ⚙️ Step 4: Setup Backend

```bash
cd /var/www/shadowzm/backend

# Install Python dependencies
pip3 install fastapi uvicorn motor pymongo python-dotenv pydantic email-validator pyjwt bcrypt passlib python-a2s requests

# Create/update .env file
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=shadowzm_database
CORS_ORIGINS=*
JWT_SECRET=shadowzm-secret-key-2024
BAN_WEBHOOK_SECRET=shadowzm-ban-secret-2024
EOF

# Test backend can be imported
python3 -c "import fastapi; print('✅ Backend dependencies OK!')"
```

---

## 🎨 Step 5: Setup Frontend

```bash
cd /var/www/shadowzm/frontend

# Create .env file (IMPORTANT: Replace YOUR_VPS_IP!)
echo "REACT_APP_BACKEND_URL=http://YOUR_VPS_IP" > .env

# Install dependencies
npm install

# Build for production (takes 2-3 minutes)
npm run build

# Verify build was created
ls -la build/
```

---

## 🚀 Step 6: Start Services with PM2

```bash
# Start Backend
cd /var/www/shadowzm/backend
pm2 start "uvicorn server:app --host 0.0.0.0 --port 8001" --name shadowzm-backend

# Check backend is running
pm2 status

# Test backend
curl http://localhost:8001/api/
```

---

## 🌐 Step 7: Configure Nginx (Proper Setup!)

### Remove default site
```bash
sudo rm /etc/nginx/sites-enabled/default
```

### Create Nginx configuration
```bash
sudo nano /etc/nginx/sites-available/shadowzm
```

**Paste this configuration:**

```nginx
server {
    listen 80;
    server_name YOUR_VPS_IP;  # Replace with your IP or domain

    # Root directory for frontend build
    root /var/www/shadowzm/frontend/build;
    index index.html;

    # Frontend - serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
}
```

### Enable site and start Nginx
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/shadowzm /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Should say: "syntax is ok" and "test is successful"

# Start/restart nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

---

## 🔥 Step 8: Configure Firewall

```bash
# Allow HTTP, HTTPS, and SSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status
```

---

## ✅ Step 9: Save PM2 Configuration

```bash
# Save current PM2 processes
pm2 save

# Setup PM2 to start on boot
pm2 startup

# It will give you a command to run, copy and run it
# Example: sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u username --hp /home/username
```

---

## 🎯 Test Your Website

```bash
# Test backend API
curl http://localhost:8001/api/server-status

# Test Nginx is serving frontend
curl http://localhost/

# Open in browser
http://YOUR_VPS_IP
```

**You should see your website! 🎉**

---

## 🔄 RESTART COMMANDS

### After Backend Code Changes:
```bash
cd /var/www/shadowzm/backend
# Upload new server.py

# Restart backend
pm2 restart shadowzm-backend

# View logs
pm2 logs shadowzm-backend
```

### After Frontend Code Changes:
```bash
cd /var/www/shadowzm/frontend
# Upload new files to src/

# Rebuild
npm run build

# Reload nginx
sudo systemctl reload nginx
```

### Check Status:
```bash
# Check PM2 processes
pm2 status

# Check Nginx
sudo systemctl status nginx

# Check MongoDB
sudo systemctl status mongod

# View backend logs
pm2 logs shadowzm-backend

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 📊 Directory Structure (Standard!)

```
/var/www/shadowzm/
├── backend/
│   ├── server.py
│   ├── .env
│   └── requirements.txt
└── frontend/
    ├── src/               (source code)
    ├── public/            (static assets)
    ├── build/             (production build - served by nginx)
    ├── package.json
    └── .env
```

**Nginx serves:** `/var/www/shadowzm/frontend/build/`  
**PM2 runs:** Backend on port 8001  
**Public access:** `http://YOUR_VPS_IP` (port 80)

---

## 🎯 Why This is Better

**Using /var/www:**
- ✅ Standard Linux convention
- ✅ Proper permissions structure
- ✅ Expected by sysadmins
- ✅ Better for backups
- ✅ Easier for SSL certificates (Let's Encrypt)
- ✅ Works with standard nginx configs

**Using Nginx to serve frontend:**
- ✅ No PM2 process needed for frontend
- ✅ Much faster (nginx is optimized for static files)
- ✅ Better caching
- ✅ Less memory usage
- ✅ Industry standard

---

## 🔒 Optional: Add SSL (HTTPS)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com

# Certbot will automatically update nginx config

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## 🛠️ Troubleshooting

### Nginx shows 404
```bash
# Check build folder exists
ls -la /var/www/shadowzm/frontend/build/

# If missing, rebuild
cd /var/www/shadowzm/frontend
npm run build

# Reload nginx
sudo systemctl reload nginx
```

### Backend API not working
```bash
# Check PM2 status
pm2 status

# View backend logs
pm2 logs shadowzm-backend

# Check MongoDB
sudo systemctl status mongod

# Restart backend
pm2 restart shadowzm-backend
```

### Permission issues
```bash
# Fix ownership
sudo chown -R $USER:$USER /var/www/shadowzm

# Fix nginx permissions for build folder
sudo chown -R www-data:www-data /var/www/shadowzm/frontend/build
sudo chmod -R 755 /var/www/shadowzm/frontend/build
```

---

## 📋 Quick Reference

### Update Backend:
```bash
cd /var/www/shadowzm/backend
# Upload new server.py
pm2 restart shadowzm-backend
```

### Update Frontend:
```bash
cd /var/www/shadowzm/frontend
# Upload new files
npm run build
sudo systemctl reload nginx
```

### View Logs:
```bash
pm2 logs shadowzm-backend
sudo tail -f /var/log/nginx/error.log
```

### Restart Everything:
```bash
pm2 restart all
sudo systemctl restart nginx
sudo systemctl restart mongod
```

---

## ✅ Complete Setup Script (All in One)

**Copy and paste this entire block:**

```bash
#!/bin/bash
echo "Installing ShadowZM Website..."

# Install packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip nodejs npm git curl gnupg nginx

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

echo "✅ Base installation complete!"
echo "Next steps:"
echo "1. Upload your files to /var/www/shadowzm/"
echo "2. Setup backend and frontend (see guide)"
echo "3. Configure nginx (see guide)"
```

---

**This is the PROPER way to deploy on VPS! 🚀**
