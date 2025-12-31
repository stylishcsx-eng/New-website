# 🔧 Fix: Yarn Not Found Error

## Error: "can't find command '/usr/bin/yarn'"

This means yarn is either not installed or installed in a different location.

---

## Solution 1: Find Yarn Location (If Already Installed)

```bash
# Check if yarn is installed
which yarn

# Common locations:
# /usr/local/bin/yarn
# /usr/bin/yarn
# ~/.yarn/bin/yarn
```

**If yarn is found**, update supervisor config with correct path:
```bash
sudo nano /etc/supervisor/conf.d/shadowzm-frontend.conf
```

Change the `command` line to the correct path:
```ini
command=/usr/local/bin/yarn start
# or whatever path 'which yarn' showed
```

Then:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl restart shadowzm-frontend
```

---

## Solution 2: Install Yarn (Recommended)

### Method A: Install via npm
```bash
sudo npm install -g yarn

# Verify installation
which yarn
yarn --version
```

### Method B: Install via official repository
```bash
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt update
sudo apt install yarn -y

# Verify installation
yarn --version
```

After installing, find the location:
```bash
which yarn
```

Then update supervisor config:
```bash
sudo nano /etc/supervisor/conf.d/shadowzm-frontend.conf
```

Change to correct path (likely `/usr/local/bin/yarn`):
```ini
[program:shadowzm-frontend]
directory=/var/www/shadowzm/frontend
command=/usr/local/bin/yarn start
autostart=true
autorestart=true
stderr_logfile=/var/log/shadowzm-frontend.err.log
stdout_logfile=/var/log/shadowzm-frontend.out.log
environment=PORT="3000"
user=root
```

Reload:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl restart shadowzm-frontend
```

---

## Solution 3: Use npm Instead (Alternative)

If you prefer to use npm instead of yarn:

```bash
sudo nano /etc/supervisor/conf.d/shadowzm-frontend.conf
```

Change to use npm:
```ini
[program:shadowzm-frontend]
directory=/var/www/shadowzm/frontend
command=/usr/bin/npm start
autostart=true
autorestart=true
stderr_logfile=/var/log/shadowzm-frontend.err.log
stdout_logfile=/var/log/shadowzm-frontend.out.log
environment=PORT="3000"
user=root
```

Then:
```bash
# First install dependencies with npm
cd /var/www/shadowzm/frontend
npm install

# Reload supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl restart shadowzm-frontend
```

---

## Solution 4: Production Build (BEST for VPS!)

**For production VPS, you should use a BUILT version, not development mode!**

### Step 1: Build Frontend
```bash
cd /var/www/shadowzm/frontend

# Install dependencies
npm install
# or: yarn install

# Build for production
npm run build
# or: yarn build
```

This creates a `build/` folder with optimized files.

### Step 2: Serve with a Simple HTTP Server

**Option A: Use serve (npm package)**
```bash
# Install serve globally
sudo npm install -g serve

# Create supervisor config
sudo nano /etc/supervisor/conf.d/shadowzm-frontend.conf
```

Content:
```ini
[program:shadowzm-frontend]
directory=/var/www/shadowzm/frontend
command=/usr/local/bin/serve -s build -l 3000
autostart=true
autorestart=true
stderr_logfile=/var/log/shadowzm-frontend.err.log
stdout_logfile=/var/log/shadowzm-frontend.out.log
user=root
```

**Option B: Serve directly with Nginx (BEST!)**

Remove the frontend supervisor config entirely:
```bash
sudo rm /etc/supervisor/conf.d/shadowzm-frontend.conf
sudo supervisorctl reread
sudo supervisorctl update
```

Update Nginx config:
```bash
sudo nano /etc/nginx/sites-available/shadowzm
```

Change to:
```nginx
server {
    listen 80;
    server_name YOUR_VPS_IP;

    # Serve frontend build files directly
    location / {
        root /var/www/shadowzm/frontend/build;
        try_files $uri $uri/ /index.html;
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
}
```

Test and reload nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## ✅ Recommended Solution for Production VPS:

```bash
# 1. Build frontend
cd /var/www/shadowzm/frontend
npm install
npm run build

# 2. Remove frontend from supervisor (not needed)
sudo rm /etc/supervisor/conf.d/shadowzm-frontend.conf
sudo supervisorctl reread
sudo supervisorctl update

# 3. Configure Nginx to serve build files
sudo nano /etc/nginx/sites-available/shadowzm
```

Add this content:
```nginx
server {
    listen 80;
    server_name YOUR_VPS_IP;  # or your domain

    # Frontend - serve static files
    root /var/www/shadowzm/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Reload:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

# 4. Only backend needs supervisor
```bash
sudo supervisorctl status
# Should only show: shadowzm-backend
```

---

## 🔍 Check Status

```bash
# Backend should be running
sudo supervisorctl status

# Should see:
# shadowzm-backend    RUNNING

# Test backend
curl http://localhost:8001/api/

# Test frontend (open in browser)
http://YOUR_VPS_IP
```

---

## 📝 Summary

**For Production VPS (Recommended):**
1. Build frontend with `npm run build`
2. Serve static files with Nginx (no supervisor needed for frontend)
3. Only backend runs with supervisor
4. Much faster and more stable!

**For Development (if you still want hot-reload):**
1. Install yarn: `sudo npm install -g yarn`
2. Find location: `which yarn`
3. Update supervisor config with correct path
4. Restart: `sudo supervisorctl restart shadowzm-frontend`

---

## 🚀 Quick Fix Commands

```bash
# Quick fix - use npm instead
sudo nano /etc/supervisor/conf.d/shadowzm-frontend.conf
# Change: command=/usr/bin/npm start

# OR better - use production build
cd /var/www/shadowzm/frontend
npm run build
sudo rm /etc/supervisor/conf.d/shadowzm-frontend.conf
sudo supervisorctl reread
sudo supervisorctl update
# Then configure Nginx to serve build folder (see above)
```
