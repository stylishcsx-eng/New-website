# 🔧 Backend Not Working - Troubleshooting Guide

## Step-by-Step Debugging

Run these commands ON YOUR VPS to find the problem:

---

## Step 1: Check if Backend is Running

```bash
# Check PM2 status
pm2 status

# Should show shadowzm-backend as "online"
# If it shows "stopped" or "errored", that's the problem
```

**If backend is NOT running:**
```bash
# Try to start it
pm2 start shadowzm-backend

# Or restart
pm2 restart shadowzm-backend
```

---

## Step 2: Check Backend Logs (MOST IMPORTANT!)

```bash
# View last 50 lines of backend logs
pm2 logs shadowzm-backend --lines 50

# Or view real-time logs
pm2 logs shadowzm-backend

# Press Ctrl+C to stop viewing
```

**Look for errors like:**
- "ModuleNotFoundError" - Missing Python package
- "Connection refused" - MongoDB not running
- "Port already in use" - Port 8001 is blocked
- "ImportError" - Missing dependencies

**Send me the error messages you see!**

---

## Step 3: Test Backend API Directly

```bash
# Test if backend is responding
curl http://localhost:8001/api/

# Should return: {"message":"shadowzm: Zombie reverse API","version":"1.0.0"}

# Test server status endpoint
curl http://localhost:8001/api/server-status

# Should return JSON with server info
```

**If curl fails**, backend is not running or has errors.

---

## Step 4: Check MongoDB is Running

```bash
# Check MongoDB status
sudo systemctl status mongod

# Should show "active (running)"

# If not running, start it
sudo systemctl start mongod
```

---

## Step 5: Check Backend .env File

```bash
cd /var/www/shadowzm/backend
cat .env
```

**Should contain:**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=shadowzm_database
CORS_ORIGINS=*
JWT_SECRET=shadowzm-secret-key-2024
BAN_WEBHOOK_SECRET=shadowzm-ban-secret-2024
```

**If .env is missing or wrong, create it:**
```bash
cd /var/www/shadowzm/backend
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=shadowzm_database
CORS_ORIGINS=*
JWT_SECRET=shadowzm-secret-key-2024
BAN_WEBHOOK_SECRET=shadowzm-ban-secret-2024
EOF

# Restart backend
pm2 restart shadowzm-backend
```

---

## Step 6: Check if Port 8001 is Open

```bash
# Check what's listening on port 8001
sudo netstat -tulpn | grep 8001

# Should show Python/uvicorn listening on port 8001

# If nothing, backend is not running
```

---

## Step 7: Test Backend Manually (Debug Mode)

```bash
# Stop PM2 backend
pm2 stop shadowzm-backend

# Go to backend directory
cd /var/www/shadowzm/backend

# Try to run manually to see errors
python3 -m uvicorn server:app --host 0.0.0.0 --port 8001

# You'll see the REAL error here
# Press Ctrl+C to stop
```

**Common errors:**

### Error: "No module named 'fastapi'"
```bash
pip3 install fastapi uvicorn motor pymongo python-dotenv pydantic email-validator pyjwt bcrypt passlib python-a2s requests
```

### Error: "Cannot connect to MongoDB"
```bash
# Start MongoDB
sudo systemctl start mongod

# Check it's running
sudo systemctl status mongod
```

### Error: "Address already in use"
```bash
# Kill whatever is on port 8001
sudo lsof -ti:8001 | xargs kill -9

# Then restart backend
pm2 restart shadowzm-backend
```

---

## Step 8: Check Frontend is Pointing to Correct Backend

```bash
# Check nginx configuration
cat /etc/nginx/sites-enabled/shadowzm

# Should have:
# location /api {
#     proxy_pass http://localhost:8001;
# }
```

**Test nginx config:**
```bash
sudo nginx -t

# Should say "syntax is ok"

# Restart nginx
sudo systemctl restart nginx
```

---

## Step 9: Test Login from VPS

```bash
# Test registration endpoint
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nickname":"testuser","email":"test@test.com","password":"test123"}'

# Should return: {"access_token":"...","token_type":"bearer","user":{...}}

# If it works from VPS but not from browser, it's a frontend/nginx issue
```

---

## Step 10: Check Browser Console (Frontend Issue?)

**On your computer:**
1. Open website in browser
2. Press F12 (open Developer Tools)
3. Go to "Console" tab
4. Try to login
5. Look for errors (red text)

**Common frontend errors:**
- "Network Error" - Backend not reachable
- "CORS Error" - CORS not configured
- "404 Not Found" - Wrong API URL
- "Failed to fetch" - Backend down

**Send me what you see in the console!**

---

## 🚨 Quick Fixes

### Fix 1: Restart Everything
```bash
# Restart backend
pm2 restart shadowzm-backend

# Restart MongoDB
sudo systemctl restart mongod

# Restart nginx
sudo systemctl restart nginx

# Check status
pm2 status
sudo systemctl status mongod
sudo systemctl status nginx
```

### Fix 2: Reinstall Backend Dependencies
```bash
cd /var/www/shadowzm/backend
pip3 install --upgrade fastapi uvicorn motor pymongo python-dotenv pydantic email-validator pyjwt bcrypt passlib python-a2s requests

pm2 restart shadowzm-backend
```

### Fix 3: Check Firewall
```bash
# Make sure port 80 is open
sudo ufw status

# Should show: 80/tcp ALLOW

# If not:
sudo ufw allow 80/tcp
```

---

## 🔍 Complete Diagnostic Script

**Run this and send me the output:**

```bash
#!/bin/bash
echo "=== ShadowZM Backend Diagnostic ==="

echo -e "\n1. PM2 Status:"
pm2 status

echo -e "\n2. MongoDB Status:"
sudo systemctl status mongod | head -3

echo -e "\n3. Nginx Status:"
sudo systemctl status nginx | head -3

echo -e "\n4. Port 8001 Check:"
sudo netstat -tulpn | grep 8001

echo -e "\n5. Backend .env exists:"
ls -la /var/www/shadowzm/backend/.env

echo -e "\n6. Backend API Test:"
curl -s http://localhost:8001/api/ || echo "❌ Backend not responding"

echo -e "\n7. MongoDB Connection Test:"
curl -s http://localhost:8001/api/server-status | head -1 || echo "❌ API call failed"

echo -e "\n8. Backend Logs (last 20 lines):"
pm2 logs shadowzm-backend --lines 20 --nostream

echo -e "\n9. Nginx Config Check:"
sudo nginx -t

echo -e "\n10. Firewall Status:"
sudo ufw status | grep 80
```

---

## 📋 What I Need From You

**To help you fix this, run these commands and send me the output:**

```bash
# 1. PM2 status
pm2 status

# 2. Backend logs
pm2 logs shadowzm-backend --lines 50 --nostream

# 3. Test API
curl http://localhost:8001/api/

# 4. Check MongoDB
sudo systemctl status mongod

# 5. Try manual start (this will show the real error)
cd /var/www/shadowzm/backend
python3 -m uvicorn server:app --host 0.0.0.0 --port 8001
# Send me what you see
# Press Ctrl+C after seeing the error
```

---

## 💡 Most Common Issues

### Issue 1: Backend Dependencies Not Installed
```bash
cd /var/www/shadowzm/backend
pip3 install -r requirements.txt
pm2 restart shadowzm-backend
```

### Issue 2: MongoDB Not Running
```bash
sudo systemctl start mongod
pm2 restart shadowzm-backend
```

### Issue 3: Wrong Backend URL in Frontend
```bash
# Frontend .env should have:
# REACT_APP_BACKEND_URL=http://YOUR_VPS_IP

# If you changed it, rebuild:
cd /var/www/shadowzm/frontend
npm run build
sudo systemctl reload nginx
```

### Issue 4: CORS Issues
Backend .env should have:
```
CORS_ORIGINS=*
```

---

## ⚡ Emergency Reset

**If nothing works, do a complete reset:**

```bash
# 1. Stop everything
pm2 stop shadowzm-backend
pm2 delete shadowzm-backend

# 2. Reinstall backend
cd /var/www/shadowzm/backend
pip3 install --force-reinstall fastapi uvicorn motor pymongo python-dotenv pydantic email-validator pyjwt bcrypt passlib python-a2s requests

# 3. Make sure .env exists
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=shadowzm_database
CORS_ORIGINS=*
JWT_SECRET=shadowzm-secret-key-2024
BAN_WEBHOOK_SECRET=shadowzm-ban-secret-2024
EOF

# 4. Restart MongoDB
sudo systemctl restart mongod

# 5. Start backend fresh
pm2 start "uvicorn server:app --host 0.0.0.0 --port 8001" --name shadowzm-backend

# 6. Check logs
pm2 logs shadowzm-backend

# 7. Test
curl http://localhost:8001/api/
```

---

**Run the diagnostic commands and send me the output so I can help you fix it! 🔧**
