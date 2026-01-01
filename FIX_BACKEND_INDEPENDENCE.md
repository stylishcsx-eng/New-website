# 🚨 CRITICAL: Move Backend to YOUR VPS (Works 24/7)

## THE PROBLEM

Right now, your backend is running **HERE on Emergent** (where I am).

When this session sleeps:
- ❌ Backend stops
- ❌ Admin panel fails
- ❌ Server status fails
- ❌ Login/Register fails
- ❌ Everything fails

**Solution: Deploy backend on YOUR VPS!**

---

## ✅ SIMPLE 5-STEP FIX

### Step 1: Download Backend Files

You already have: `shadowzm-website-with-build.tar.gz`

If not, download from: `/app/shadowzm-website-with-build.tar.gz`

---

### Step 2: Upload to YOUR VPS

```bash
# On YOUR VPS (via SSH/PuTTY)
cd /var/www/shadowzm

# If files not there yet, upload the tar.gz and extract:
tar -xzf shadowzm-website-with-build.tar.gz

# Verify files exist
ls -la backend/server.py
ls -la frontend/build/index.html
```

---

### Step 3: Install Backend Dependencies

```bash
cd /var/www/shadowzm/backend

# Install ALL dependencies
pip3 install fastapi uvicorn motor pymongo python-dotenv pydantic email-validator pyjwt bcrypt passlib python-a2s requests

# Verify .env file exists
cat .env

# Should show:
# MONGO_URL=mongodb://localhost:27017
# DB_NAME=shadowzm_database
# etc.
```

---

### Step 4: Start Backend with PM2 (24/7)

```bash
cd /var/www/shadowzm/backend

# STOP any old backend first
pm2 stop shadowzm-backend 2>/dev/null
pm2 delete shadowzm-backend 2>/dev/null

# START new backend
pm2 start "uvicorn server:app --host 0.0.0.0 --port 8001" --name shadowzm-backend

# SAVE configuration (auto-start on reboot)
pm2 save

# ENABLE auto-start
pm2 startup systemd
# Copy and run the command it gives you (starts with "sudo env...")

# CHECK status
pm2 status

# Should show:
# shadowzm-backend │ online │ 0
```

**✅ Backend is now running 24/7 on YOUR VPS!**

---

### Step 5: Configure Nginx (Serve Website)

```bash
# Edit nginx config
sudo nano /etc/nginx/sites-available/shadowzm
```

**DELETE OLD CONTENT AND PASTE THIS:**

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name shadowzm.xyz www.shadowzm.xyz;

    # SSL Configuration (if you have SSL)
    ssl_certificate /etc/letsencrypt/live/shadowzm.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/shadowzm.xyz/privkey.pem;

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
        
        # CORS
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

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/json application/javascript;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name shadowzm.xyz www.shadowzm.xyz;
    return 301 https://$host$request_uri;
}
```

**Test and restart nginx:**

```bash
# Test config
sudo nginx -t

# Should say: "syntax is ok"

# Restart nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

---

## ✅ VERIFY IT'S WORKING ON YOUR VPS

### Check 1: Backend Running on YOUR VPS

```bash
# Check PM2
pm2 status

# Should show: shadowzm-backend | online

# Test backend API
curl http://localhost:8001/api/

# Should return: {"message":"shadowzm: Zombie reverse API"...}
```

### Check 2: MongoDB Running

```bash
sudo systemctl status mongod

# Should show: active (running)
```

### Check 3: Nginx Running

```bash
sudo systemctl status nginx

# Should show: active (running)
```

### Check 4: Test from Browser

**Open:** `https://shadowzm.xyz`

1. ✅ Home page loads
2. ✅ Server status shows (top of page)
3. ✅ Try register - Should work!
4. ✅ Try login - Should work!
5. ✅ Try admin panel: `https://shadowzm.xyz/admin-login`
   - Username: `Stylish`
   - Password: `Itachi1849`
   - Should work! ✅

**If ALL tests pass, backend is running on YOUR VPS! 🎉**

---

## 🔍 TROUBLESHOOTING

### Backend not starting?

```bash
# Check logs
pm2 logs shadowzm-backend

# Common issues:
# 1. MongoDB not running
sudo systemctl start mongod

# 2. Port 8001 in use
sudo lsof -ti:8001 | xargs kill -9

# 3. Missing dependencies
cd /var/www/shadowzm/backend
pip3 install -r requirements.txt

# Restart backend
pm2 restart shadowzm-backend
```

### Login still not working?

```bash
# Test backend directly
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nickname":"test123","email":"test123@test.com","password":"test123"}'

# Should return: {"access_token":"..."}

# If it works, problem is nginx/frontend
# If it fails, check backend logs:
pm2 logs shadowzm-backend
```

### Nginx errors?

```bash
# Check nginx error log
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

---

## 🎯 FINAL TEST: Kill This Session

**To prove it's working independently:**

1. Close this browser tab (kill the agent session)
2. Wait 5 minutes
3. Open `https://shadowzm.xyz`
4. Try login, admin panel, server status

**If everything still works → SUCCESS! ✅**

Your backend is now on YOUR VPS and works 24/7!

---

## 📊 WHERE IS EVERYTHING NOW?

**BEFORE (Broken):**
```
Browser → Emergent Server (sleeps) → ❌ Everything fails
```

**AFTER (Fixed):**
```
Browser → YOUR VPS (24/7) → ✅ Everything works!

Your VPS:
├── Nginx (port 80/443) → Serves frontend
├── Backend (PM2, port 8001) → Handles API
└── MongoDB (port 27017) → Stores data

All running 24/7, no dependency on Emergent!
```

---

## ✅ CHECKLIST

Complete this checklist to ensure independence:

- [ ] Backend files extracted to `/var/www/shadowzm/backend/`
- [ ] Dependencies installed (`pip3 install fastapi uvicorn motor ...`)
- [ ] MongoDB running (`sudo systemctl status mongod`)
- [ ] Backend running with PM2 (`pm2 status` shows "online")
- [ ] PM2 auto-start enabled (`pm2 startup` command run)
- [ ] Nginx configured (updated `/etc/nginx/sites-available/shadowzm`)
- [ ] Nginx restarted (`sudo systemctl restart nginx`)
- [ ] Backend test works (`curl http://localhost:8001/api/`)
- [ ] Website loads (`https://shadowzm.xyz`)
- [ ] Login works (test it!)
- [ ] Admin panel works (test it!)
- [ ] Server status shows (check home page)
- [ ] Tested after closing this session (final proof!)

---

## 🚀 QUICK DEPLOY SCRIPT

**Run this on YOUR VPS (all at once):**

```bash
#!/bin/bash
echo "=== Deploying ShadowZM Backend to VPS ==="

# Go to backend directory
cd /var/www/shadowzm/backend

# Install dependencies
echo "Installing dependencies..."
pip3 install fastapi uvicorn motor pymongo python-dotenv pydantic email-validator pyjwt bcrypt passlib python-a2s requests

# Stop old backend
pm2 stop shadowzm-backend 2>/dev/null
pm2 delete shadowzm-backend 2>/dev/null

# Start backend with PM2
echo "Starting backend with PM2..."
pm2 start "uvicorn server:app --host 0.0.0.0 --port 8001" --name shadowzm-backend

# Save PM2 config
pm2 save

# Test backend
sleep 3
echo "Testing backend..."
curl -s http://localhost:8001/api/

echo ""
echo "✅ Backend deployed!"
echo ""
echo "Next steps:"
echo "1. Run: pm2 startup systemd"
echo "2. Copy and run the command it gives you"
echo "3. Update nginx config (see guide above)"
echo "4. Test website: https://shadowzm.xyz"
```

---

## 🎉 SUCCESS!

Once done, your backend:
- ✅ Runs on YOUR VPS (not Emergent)
- ✅ Managed by PM2 (auto-restart, auto-start on boot)
- ✅ Works 24/7 independently
- ✅ No dependency on this session
- ✅ Admin panel works always
- ✅ Login/Register works always
- ✅ Server status works always

**Your website is now completely independent! 🚀**
