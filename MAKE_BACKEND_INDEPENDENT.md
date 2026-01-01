# 🔧 Make Backend Completely Independent

## The Problem

Right now, your backend is running on THIS Emergent server. When this session sleeps/ends:
- ❌ Backend stops working
- ❌ Login/Register fails
- ❌ Admin panel doesn't work
- ❌ Website goes down

## The Solution

Deploy the backend on YOUR VPS so it runs 24/7 independently!

---

## ✅ Step 1: Verify You Have All Files

You should already have downloaded:
- `/app/shadowzm-website-with-build.tar.gz` (2.4 MB) - Includes backend

This package is **completely standalone** and doesn't depend on Emergent!

---

## ✅ Step 2: Deploy Backend on Your VPS

### Extract Files on Your VPS

```bash
# Upload the tar.gz to your VPS, then:
cd /var/www/shadowzm
tar -xzf shadowzm-website-with-build.tar.gz

# You should now have:
# /var/www/shadowzm/backend/server.py
# /var/www/shadowzm/backend/.env
# /var/www/shadowzm/backend/requirements.txt
```

### Install Dependencies

```bash
cd /var/www/shadowzm/backend

# Install all Python packages
pip3 install fastapi uvicorn motor pymongo python-dotenv pydantic email-validator pyjwt bcrypt passlib python-a2s requests

# Or use requirements.txt:
pip3 install -r requirements.txt
```

### Configure .env File

```bash
cd /var/www/shadowzm/backend
nano .env
```

Make sure it has:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=shadowzm_database
CORS_ORIGINS=*
JWT_SECRET=shadowzm-secret-key-2024
BAN_WEBHOOK_SECRET=shadowzm-ban-secret-2024
```

### Start Backend with PM2

```bash
cd /var/www/shadowzm/backend

# Start backend (will run 24/7)
pm2 start "uvicorn server:app --host 0.0.0.0 --port 8001" --name shadowzm-backend

# Save configuration
pm2 save

# Enable auto-start on reboot
pm2 startup
# Run the command it gives you

# Check status
pm2 status

# Should show: shadowzm-backend | online
```

### Test Backend is Working

```bash
# Test API
curl http://localhost:8001/api/

# Should return: {"message":"shadowzm: Zombie reverse API"...}

# Test server status
curl http://localhost:8001/api/server-status

# Should return JSON with server info
```

---

## ✅ Step 3: Configure Nginx to Serve Everything

```bash
sudo nano /etc/nginx/sites-available/shadowzm
```

Complete working config:
```nginx
server {
    listen 80;
    server_name YOUR_VPS_IP;  # or yourdomain.com

    # Serve frontend (pre-built)
    root /var/www/shadowzm/frontend/build;
    index index.html;

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API (running on YOUR VPS with PM2)
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
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
        
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type';
            add_header 'Content-Length' 0;
            add_header 'Content-Type' 'text/plain';
            return 204;
        }
    }

    # Cache static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Test and restart:
```bash
# Test config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

---

## ✅ Step 4: Update Frontend .env (if needed)

The pre-built frontend should work as-is because nginx proxies `/api` automatically.

But if you want to rebuild with explicit backend URL:

```bash
cd /var/www/shadowzm/frontend

# Create/update .env
echo "REACT_APP_BACKEND_URL=http://YOUR_VPS_IP" > .env

# Rebuild (only if needed)
npm install
npm run build

# Restart nginx
sudo systemctl reload nginx
```

---

## ✅ Step 5: Verify Everything Works on YOUR VPS

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

# 5. Test through nginx
curl http://localhost/api/

# 6. Test in browser
# Open: http://YOUR_VPS_IP
```

---

## ✅ Step 6: Test Login/Register/Admin Panel

**Open in browser: `http://YOUR_VPS_IP`**

### Test Registration:
1. Click "Register"
2. Fill in details
3. Should work! ✅

### Test Login:
1. Click "Login"
2. Use registered account
3. Should work! ✅

### Test Admin Login:
1. Go to: `http://YOUR_VPS_IP/admin-login`
2. Default owner account:
   - Username: `Stylish`
   - Password: `Itachi1849`
3. Should work! ✅

**If login still fails, check browser console (F12) for errors!**

---

## 🔍 Troubleshooting

### Issue 1: Backend Not Starting

```bash
# Check logs
pm2 logs shadowzm-backend

# Common issues:
# - MongoDB not running: sudo systemctl start mongod
# - Port 8001 in use: sudo lsof -ti:8001 | xargs kill -9
# - Missing dependencies: pip3 install -r requirements.txt
```

### Issue 2: Can't Login/Register

```bash
# Check backend is responding
curl http://localhost:8001/api/auth/register \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"nickname":"test","email":"test@test.com","password":"test123"}'

# Should return: {"access_token":"...","user":{...}}

# If fails, check:
pm2 logs shadowzm-backend
```

### Issue 3: CORS Errors in Browser

**Check nginx config has CORS headers:**
```bash
cat /etc/nginx/sites-enabled/shadowzm | grep -A 3 "Access-Control"

# Should show CORS headers

# If missing, add them and restart nginx
sudo systemctl restart nginx
```

### Issue 4: 404 Not Found

```bash
# Make sure nginx is proxying /api
sudo nginx -t

# Check nginx error log
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

---

## 🎯 Complete Independence Checklist

- [ ] Uploaded website files to YOUR VPS at `/var/www/shadowzm/`
- [ ] Installed MongoDB on YOUR VPS: `sudo systemctl status mongod`
- [ ] Installed Python dependencies: `pip3 install -r requirements.txt`
- [ ] Configured backend .env with correct settings
- [ ] Started backend with PM2: `pm2 start ...`
- [ ] Configured nginx to proxy /api to backend
- [ ] Tested backend API: `curl http://localhost:8001/api/`
- [ ] Tested frontend loads: `http://YOUR_VPS_IP`
- [ ] Tested registration works
- [ ] Tested login works
- [ ] Tested admin panel works
- [ ] PM2 auto-starts on reboot: `pm2 startup`

---

## ✅ Your Setup After This

**Before (dependent on Emergent):**
```
Your Browser → Emergent Server (sleeps) → ❌ Website down
```

**After (completely independent):**
```
Your Browser → YOUR VPS → ✅ Website works 24/7!
```

**What runs on YOUR VPS:**
- ✅ Nginx (serves frontend, proxies API)
- ✅ Backend (PM2 process on port 8001)
- ✅ MongoDB (database)
- ✅ Everything 24/7, no dependency on Emergent!

---

## 🚀 Quick Deploy Script

**Run this on YOUR VPS:**

```bash
#!/bin/bash
echo "=== Deploying ShadowZM Website ==="

# Assuming files already extracted to /var/www/shadowzm

cd /var/www/shadowzm/backend

# Install dependencies
pip3 install -r requirements.txt

# Check .env exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=shadowzm_database
CORS_ORIGINS=*
JWT_SECRET=shadowzm-secret-key-2024
BAN_WEBHOOK_SECRET=shadowzm-ban-secret-2024
EOF
fi

# Stop old backend if running
pm2 stop shadowzm-backend 2>/dev/null
pm2 delete shadowzm-backend 2>/dev/null

# Start backend
pm2 start "uvicorn server:app --host 0.0.0.0 --port 8001" --name shadowzm-backend

# Save PM2 config
pm2 save

# Test backend
sleep 3
curl -s http://localhost:8001/api/

echo ""
echo "✅ Backend deployed!"
echo "   Check status: pm2 status"
echo "   View logs: pm2 logs shadowzm-backend"
echo ""
echo "Next: Configure nginx and test in browser"
```

---

## 📋 Summary

**The backend is now:**
- ✅ Running on YOUR VPS (not Emergent)
- ✅ Managed by PM2 (auto-restart, auto-start on boot)
- ✅ Independent and works 24/7
- ✅ No connection to Emergent needed

**Your website now works completely standalone! 🎉**

When you open `http://YOUR_VPS_IP`:
- ✅ Frontend loads from nginx
- ✅ Backend responds from YOUR VPS
- ✅ Login/Register works
- ✅ Admin panel works
- ✅ Everything works 24/7!

**No more dependency on this Emergent session! 🚀**
