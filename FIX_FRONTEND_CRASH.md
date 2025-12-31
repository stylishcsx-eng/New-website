# 🔧 Fix: Frontend Exited Too Quickly Error

## Error: "FATAL Exited too quickly (process log may have details)"

This means the frontend process crashes immediately after starting.

---

## Step 1: Check the Logs (MOST IMPORTANT!)

```bash
# View error log
tail -n 100 /var/log/shadowzm-frontend.err.log

# View output log
tail -n 100 /var/log/shadowzm-frontend.out.log

# Or both at once
cat /var/log/shadowzm-frontend.err.log
cat /var/log/shadowzm-frontend.out.log
```

**Look for error messages like:**
- "Module not found"
- "Cannot find package"
- "Port already in use"
- "Permission denied"
- Syntax errors

---

## Common Causes & Solutions

### Cause 1: Dependencies Not Installed

```bash
cd /var/www/shadowzm/frontend

# Install dependencies
npm install
# or: yarn install

# Then restart
sudo supervisorctl restart shadowzm-frontend
```

### Cause 2: Port 3000 Already in Use

```bash
# Check what's using port 3000
sudo lsof -i :3000

# If something is using it, kill it
sudo kill -9 PID_NUMBER

# Or change port in supervisor config
sudo nano /etc/supervisor/conf.d/shadowzm-frontend.conf
# Add: environment=PORT="3001"

# Restart
sudo supervisorctl restart shadowzm-frontend
```

### Cause 3: Missing package.json or scripts

```bash
# Check if package.json exists
ls -la /var/www/shadowzm/frontend/package.json

# Check if start script exists
cat /var/www/shadowzm/frontend/package.json | grep "\"start\""

# Should see: "start": "react-scripts start" or "start": "craco start"
```

### Cause 4: Wrong Directory Path

```bash
# Verify directory exists
ls -la /var/www/shadowzm/frontend/

# Should see: node_modules, package.json, src, public

# If not, you may have uploaded to wrong directory
```

### Cause 5: Permission Issues

```bash
# Fix permissions
sudo chown -R root:root /var/www/shadowzm/frontend
sudo chmod -R 755 /var/www/shadowzm/frontend
```

### Cause 6: Node.js/npm Issues

```bash
# Check Node.js version (needs 14+)
node --version

# Check npm version
npm --version

# Reinstall node_modules
cd /var/www/shadowzm/frontend
rm -rf node_modules package-lock.json
npm install
```

---

## Step 2: Test Manually (Debug Mode)

Run the frontend manually to see the actual error:

```bash
# Go to frontend directory
cd /var/www/shadowzm/frontend

# Try to start manually
npm start

# Watch for errors - this will show the REAL problem
```

**Common errors you might see:**
- "react-scripts: not found" → Run `npm install`
- "Port 3000 is already in use" → Kill the process or use different port
- "Cannot find module" → Missing dependencies, run `npm install`
- ".env file" errors → Check your .env file

---

## ✅ BEST SOLUTION: Use Production Build

**Development server (npm start) is NOT recommended for production VPS!**

Instead, build the frontend and serve with Nginx:

### Step 1: Build Frontend
```bash
cd /var/www/shadowzm/frontend

# Make sure .env is correct
nano .env
# Should have: REACT_APP_BACKEND_URL=http://YOUR_VPS_IP

# Install dependencies
npm install

# Build for production (this may take 2-3 minutes)
npm run build

# Verify build folder created
ls -la build/
```

### Step 2: Remove Frontend from Supervisor
```bash
# Stop frontend supervisor
sudo supervisorctl stop shadowzm-frontend

# Remove config
sudo rm /etc/supervisor/conf.d/shadowzm-frontend.conf

# Reload supervisor
sudo supervisorctl reread
sudo supervisorctl update
```

### Step 3: Configure Nginx to Serve Build Files
```bash
# Edit nginx config
sudo nano /etc/nginx/sites-available/shadowzm
```

**Replace entire content with this:**
```nginx
server {
    listen 80;
    server_name YOUR_VPS_IP;  # Replace with your IP or domain

    # Serve frontend static files
    root /var/www/shadowzm/frontend/build;
    index index.html index.htm;

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
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
}
```

### Step 4: Test and Reload Nginx
```bash
# Test nginx config
sudo nginx -t

# Should say: "syntax is ok" and "test is successful"

# Reload nginx
sudo systemctl reload nginx

# Or restart nginx
sudo systemctl restart nginx
```

### Step 5: Check Status
```bash
# Only backend should be running now
sudo supervisorctl status

# Should show:
# shadowzm-backend    RUNNING

# Test backend
curl http://localhost:8001/api/

# Test in browser
# Open: http://YOUR_VPS_IP
```

---

## 🔍 Debugging Checklist

```bash
# 1. Check if frontend directory is correct
ls -la /var/www/shadowzm/frontend/
# Should see: src/, public/, package.json, node_modules/

# 2. Check if dependencies are installed
ls /var/www/shadowzm/frontend/node_modules/ | wc -l
# Should be more than 500

# 3. Check frontend logs
tail -n 50 /var/log/shadowzm-frontend.err.log

# 4. Check backend is running
sudo supervisorctl status shadowzm-backend

# 5. Test backend API
curl http://localhost:8001/api/server-status

# 6. Check nginx is running
sudo systemctl status nginx

# 7. Check nginx config
sudo nginx -t
```

---

## 📋 Quick Fix Steps (Copy-Paste)

```bash
# Step 1: Check logs to find error
tail -n 100 /var/log/shadowzm-frontend.err.log

# Step 2: Try manual start to see error
cd /var/www/shadowzm/frontend
npm install
npm start
# Press Ctrl+C after seeing the error

# Step 3: Build for production instead
npm run build

# Step 4: Stop supervisor frontend
sudo supervisorctl stop shadowzm-frontend
sudo rm /etc/supervisor/conf.d/shadowzm-frontend.conf
sudo supervisorctl reread
sudo supervisorctl update

# Step 5: Update nginx config (see above)
sudo nano /etc/nginx/sites-available/shadowzm
# Paste the nginx config above

# Step 6: Reload nginx
sudo nginx -t
sudo systemctl reload nginx

# Step 7: Test
curl http://YOUR_VPS_IP/api/
# Open http://YOUR_VPS_IP in browser
```

---

## 🚨 If Still Not Working

**Send me these outputs:**

```bash
# 1. Frontend error log
tail -n 100 /var/log/shadowzm-frontend.err.log

# 2. Frontend output log
tail -n 100 /var/log/shadowzm-frontend.out.log

# 3. Directory contents
ls -la /var/www/shadowzm/frontend/

# 4. Package.json
cat /var/www/shadowzm/frontend/package.json

# 5. Manual start error
cd /var/www/shadowzm/frontend
npm start
# Copy the error message
```

---

## ✅ Recommended Production Setup

**Backend:** Runs with Supervisor (needs to stay running)
```bash
sudo supervisorctl status shadowzm-backend
# Should show: RUNNING
```

**Frontend:** Built and served by Nginx (no process needed)
```bash
ls -la /var/www/shadowzm/frontend/build/
# Should see: index.html, static/, etc.
```

**Nginx:** Routes traffic
```bash
sudo systemctl status nginx
# Should show: active (running)
```

---

## 🎯 Final Check

```bash
# Everything running
sudo supervisorctl status        # Only backend
sudo systemctl status nginx      # Active
sudo systemctl status mongod     # Active

# Test API
curl http://localhost:8001/api/server-status

# Open browser
http://YOUR_VPS_IP
```

**This setup is much more stable and faster than running development server!**
