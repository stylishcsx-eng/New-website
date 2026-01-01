# 🔧 TROUBLESHOOTING: Backend Still Failing

## Step 1: Run Diagnostic Script

**On your VPS, run this:**

```bash
# Download diagnostic script
curl -o diagnose.sh https://pastebin.com/raw/YOURPASTE

# Or create it manually:
nano diagnose.sh
# Paste the script content (from diagnose-vps.sh file)

# Make executable
chmod +x diagnose.sh

# Run it
./diagnose.sh
```

**SEND ME THE OUTPUT!** This will tell me exactly what's failing.

---

## Step 2: Quick Checks (Run These Now)

### Check 1: Is backend running on VPS?

```bash
pm2 status
```

**What do you see?**
- ✅ `shadowzm-backend │ online` → Backend is running
- ❌ `shadowzm-backend │ errored` → Backend crashed
- ❌ `shadowzm-backend │ stopped` → Backend not started
- ❌ Nothing shows → Backend not registered with PM2

### Check 2: Can backend respond?

```bash
curl http://localhost:8001/api/
```

**What do you see?**
- ✅ `{"message":"shadowzm: Zombie reverse API"...}` → Backend working!
- ❌ `Connection refused` → Backend not listening on port 8001
- ❌ `curl: command not found` → Install curl: `sudo apt install curl`

### Check 3: Is MongoDB running?

```bash
sudo systemctl status mongod
```

**What do you see?**
- ✅ `Active: active (running)` → MongoDB working!
- ❌ `Active: failed` or `inactive` → MongoDB not running

### Check 4: Check backend logs

```bash
pm2 logs shadowzm-backend --lines 30
```

**Look for errors like:**
- "Connection refused" → MongoDB not running
- "Port already in use" → Port 8001 blocked
- "ModuleNotFoundError" → Missing dependencies
- "ImportError" → Package installation issue

---

## Common Issues & Fixes

### Issue 1: Backend Shows "errored" or Keeps Restarting

```bash
# View error logs
pm2 logs shadowzm-backend --lines 50

# Common causes:
```

**If you see: "Cannot connect to MongoDB"**
```bash
# Start MongoDB
sudo systemctl start mongod

# Check it's running
sudo systemctl status mongod

# Restart backend
pm2 restart shadowzm-backend
```

**If you see: "No module named 'fastapi'" or similar**
```bash
# Reinstall dependencies
cd /var/www/shadowzm/backend
pip3 install --upgrade fastapi uvicorn motor pymongo python-dotenv pydantic email-validator pyjwt bcrypt passlib python-a2s requests

# Restart backend
pm2 restart shadowzm-backend
```

**If you see: "Address already in use" or "port 8001"**
```bash
# Kill whatever is on port 8001
sudo lsof -ti:8001 | xargs kill -9

# Restart backend
pm2 restart shadowzm-backend
```

### Issue 2: Backend Not in PM2 List

```bash
# Go to backend directory
cd /var/www/shadowzm/backend

# Check files exist
ls -la server.py .env

# Start backend with PM2
pm2 start "uvicorn server:app --host 0.0.0.0 --port 8001" --name shadowzm-backend

# Save
pm2 save
```

### Issue 3: Backend Runs But Website Still Fails

This means **nginx isn't proxying correctly** or **frontend is calling wrong URL**.

**Check nginx config:**
```bash
# View nginx config
cat /etc/nginx/sites-enabled/shadowzm | grep -A 10 "location /api"

# Should show:
# location /api {
#     proxy_pass http://127.0.0.1:8001;
#     ...
# }
```

**If missing or wrong, fix it:**
```bash
sudo nano /etc/nginx/sites-enabled/shadowzm

# Make sure it has:
location /api {
    proxy_pass http://127.0.0.1:8001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

# Save and restart
sudo nginx -t
sudo systemctl restart nginx
```

**Test nginx proxy:**
```bash
# This should work (backend directly):
curl http://localhost:8001/api/

# This should also work (through nginx):
curl http://localhost/api/

# If first works but second fails → nginx issue
# If both fail → backend issue
```

### Issue 4: "502 Bad Gateway" Error

```bash
# Backend is down or not responding
pm2 restart shadowzm-backend

# Check backend is actually running
pm2 status

# Check backend logs for errors
pm2 logs shadowzm-backend
```

### Issue 5: Frontend Shows Old Data or Doesn't Connect

```bash
# Clear browser cache completely
# In browser: Ctrl+Shift+Delete → Clear everything

# Or hard reload
# Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

# Check frontend .env
cat /var/www/shadowzm/frontend/.env

# Should have:
# REACT_APP_BACKEND_URL=https://shadowzm.xyz
```

---

## Step 3: Complete Reset (If Nothing Works)

**Stop everything and start fresh:**

```bash
# 1. Stop old backend
pm2 stop all
pm2 delete all

# 2. Make sure MongoDB is running
sudo systemctl restart mongod
sudo systemctl status mongod

# 3. Go to backend directory
cd /var/www/shadowzm/backend

# 4. Verify files exist
ls -la server.py .env

# 5. Reinstall ALL dependencies
pip3 install --force-reinstall fastapi uvicorn motor pymongo python-dotenv pydantic email-validator pyjwt bcrypt passlib python-a2s requests

# 6. Test manually first
python3 -m uvicorn server:app --host 0.0.0.0 --port 8001

# Press Ctrl+C after seeing "Application startup complete"

# 7. If manual test works, start with PM2
pm2 start "uvicorn server:app --host 0.0.0.0 --port 8001" --name shadowzm-backend

# 8. Save PM2
pm2 save

# 9. Check status
pm2 status

# 10. Test API
curl http://localhost:8001/api/

# 11. Restart nginx
sudo systemctl restart nginx

# 12. Test in browser
# Open: https://shadowzm.xyz
```

---

## Step 4: Test Backend Manually (Detailed)

```bash
# Go to backend directory
cd /var/www/shadowzm/backend

# Activate virtual environment (if using one)
# source venv/bin/activate

# Run backend directly
python3 -m uvicorn server:app --host 0.0.0.0 --port 8001

# Watch the output - you should see:
# INFO:     Started server process
# INFO:     Waiting for application startup.
# INFO:     Default owner created: Stylish
# INFO:     Application startup complete.
# INFO:     Uvicorn running on http://0.0.0.0:8001

# In another terminal, test:
curl http://localhost:8001/api/server-status

# Press Ctrl+C to stop manual test
```

**If manual test works:**
- Problem is with PM2 configuration

**If manual test fails:**
- Check error messages
- Usually MongoDB connection or missing dependencies

---

## Step 5: What to Send Me

**Please run these and send me the output:**

```bash
# 1. PM2 status
pm2 status

# 2. PM2 logs
pm2 logs shadowzm-backend --lines 50 --nostream

# 3. Backend test
curl http://localhost:8001/api/

# 4. Nginx test
curl http://localhost/api/

# 5. MongoDB status
sudo systemctl status mongod | head -10

# 6. Nginx config
cat /etc/nginx/sites-enabled/shadowzm | grep -A 15 "location /api"

# 7. Backend files check
ls -la /var/www/shadowzm/backend/

# 8. Python packages
pip3 list | grep -E "fastapi|uvicorn|motor|pymongo"
```

---

## Specific Error Messages

### "ModuleNotFoundError: No module named 'motor'"

```bash
cd /var/www/shadowzm/backend
pip3 install motor pymongo
pm2 restart shadowzm-backend
```

### "Connection refused" when accessing website

```bash
# Backend not running
pm2 restart shadowzm-backend

# Or backend not listening
pm2 logs shadowzm-backend
```

### "502 Bad Gateway"

```bash
# Backend crashed or not running
pm2 restart shadowzm-backend
pm2 logs shadowzm-backend
```

### "404 Not Found" on /api/...

```bash
# Nginx not proxying correctly
sudo nano /etc/nginx/sites-enabled/shadowzm
# Add /api location block (see above)
sudo nginx -t
sudo systemctl restart nginx
```

---

## Emergency: Start Backend Manually (Temporary)

If PM2 isn't working, run backend manually:

```bash
# Open screen session
screen -S backend

# Go to backend directory
cd /var/www/shadowzm/backend

# Start backend
python3 -m uvicorn server:app --host 0.0.0.0 --port 8001

# Detach from screen: Ctrl+A then D
# Reattach later: screen -r backend
```

---

## What I Need From You

To help you fix this, please send me:

1. **PM2 status output**: `pm2 status`
2. **Backend logs**: `pm2 logs shadowzm-backend --lines 30 --nostream`
3. **Backend test**: `curl http://localhost:8001/api/`
4. **What error do you see in browser?**
   - Login button does nothing?
   - Error message shows?
   - Page loads but features don't work?
   - Specific error in browser console (F12)?

**With this information, I can give you exact commands to fix it! 🔧**
