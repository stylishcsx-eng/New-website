# 🔧 Fix: Bans Not Syncing to Website

## Problem Analysis

The script is detecting bans correctly but failing to send to website:
```
✗ Failed: (empty response)
```

This means the HTTP request to your website is failing.

---

## 🔍 Step 1: Check Website URL in Script

**On your Pterodactyl server:**

```bash
cd /home/shadowzm-scripts

# Check what URL is configured
grep WEBSITE_URL autoban.sh

# Should show YOUR VPS IP or domain, NOT "YOUR_VPS_IP"
# Example: WEBSITE_URL="http://82.22.174.126"
```

**If it still says `YOUR_VPS_IP`:**
```bash
nano autoban.sh

# Find line 8:
# WEBSITE_URL="http://YOUR_VPS_IP"

# Change to your ACTUAL VPS IP:
# WEBSITE_URL="http://82.22.174.126"  # Replace with your IP!

# Save: Ctrl+X, Y, Enter
```

---

## 🔍 Step 2: Test Connection from Pterodactyl to Website

**On your Pterodactyl server (PuTTY):**

```bash
# Test if website is reachable
curl http://YOUR_VPS_IP/api/

# Replace YOUR_VPS_IP with actual IP like 82.22.174.126

# Should return:
# {"message":"shadowzm: Zombie reverse API","version":"1.0.0"}
```

**If this fails:**
- Website backend is not running
- Firewall blocking connection
- Wrong IP address

**If this works, test the ban webhook:**
```bash
# Test ban webhook directly
curl -X POST "http://YOUR_VPS_IP/api/bans/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "shadowzm-ban-secret-2024",
    "player_nickname": "TestPlayer",
    "steamid": "STEAM_0:1:123456",
    "reason": "Testing",
    "admin_name": "Admin",
    "duration": "Permanent"
  }'

# Should return:
# {"message":"Ban added","id":"..."}
```

---

## 🔍 Step 3: Check if VPS Backend is Running

**On your VPS (where website is hosted):**

```bash
# Check backend status
pm2 status

# Should show shadowzm-backend as "online"

# If not online:
pm2 restart shadowzm-backend

# Check logs
pm2 logs shadowzm-backend --lines 20
```

---

## 🔍 Step 4: Test Ban Webhook from Pterodactyl

**Most likely issue: Network routing or URL**

**On Pterodactyl server:**

```bash
# Get your VPS public IP
VPS_IP="82.22.174.126"  # Replace with YOUR IP!

# Test basic connectivity
ping -c 3 $VPS_IP

# Test HTTP connection
curl -v http://$VPS_IP/api/

# Test ban endpoint
curl -v -X POST "http://$VPS_IP/api/bans/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "shadowzm-ban-secret-2024",
    "player_nickname": "Stylish",
    "steamid": "STEAM_0:0:171538078",
    "reason": "test",
    "admin_name": "Stylish",
    "duration": "5 minutes"
  }'

# The -v flag shows verbose output
# This will tell you exactly where it's failing
```

---

## ⚡ Quick Fix: Update autoban.sh with Correct URL

**On Pterodactyl server:**

```bash
cd /home/shadowzm-scripts

# Stop autoban if running
# Press Ctrl+C

# Edit script
nano autoban.sh

# Update line 8:
WEBSITE_URL="http://YOUR_ACTUAL_VPS_IP"  # e.g., http://82.22.174.126

# Or if you have domain:
WEBSITE_URL="http://yourdomain.com"

# Save and exit (Ctrl+X, Y, Enter)

# Test manually first
curl -X POST "http://YOUR_ACTUAL_VPS_IP/api/bans/webhook" \
  -H "Content-Type: application/json" \
  -d '{"secret":"shadowzm-ban-secret-2024","player_nickname":"Test","steamid":"STEAM_0:1:999","reason":"test","admin_name":"Admin","duration":"Permanent"}'

# If this works, restart autoban.sh
bash autoban.sh
```

---

## 🔍 Step 5: Check Backend Logs on VPS

**On your VPS:**

```bash
# Watch backend logs in real-time
pm2 logs shadowzm-backend

# In another window, trigger a ban on CS server
# You should see the webhook request in logs

# If you see errors like:
# - "Invalid secret" → SECRET doesn't match
# - "Method not allowed" → Wrong endpoint
# - Nothing appears → Request not reaching backend
```

---

## 🔧 Common Issues & Solutions

### Issue 1: Wrong IP Address

```bash
# On Pterodactyl server, check what IP you're using
cat /home/shadowzm-scripts/autoban.sh | grep WEBSITE_URL

# Make sure it matches your VPS IP
# On VPS, check your IP:
curl ifconfig.me
```

### Issue 2: Firewall Blocking

**On VPS:**
```bash
# Make sure port 80 is open
sudo ufw status

# Should show:
# 80/tcp    ALLOW

# If not:
sudo ufw allow 80/tcp
```

### Issue 3: Backend Not Running or Crashed

**On VPS:**
```bash
pm2 status

# If shadowzm-backend is stopped:
pm2 restart shadowzm-backend

# Check why it crashed:
pm2 logs shadowzm-backend --lines 50
```

### Issue 4: Using Internal IP Instead of Public IP

```bash
# DON'T use these in your scripts:
# - localhost
# - 127.0.0.1
# - 10.x.x.x (internal network)

# USE your public VPS IP:
# - Get it with: curl ifconfig.me
# - Or use your domain name
```

### Issue 5: Nginx Not Proxying /api

**On VPS:**
```bash
# Check nginx config has /api proxy
cat /etc/nginx/sites-enabled/shadowzm | grep -A 5 "location /api"

# Should have:
# location /api {
#     proxy_pass http://127.0.0.1:8001;
# }

# If missing, add it and restart nginx
sudo systemctl restart nginx
```

---

## 🎯 Complete Debug Script

**Run this on Pterodactyl server:**

```bash
#!/bin/bash
echo "=== Debugging Ban Sync ==="

# Check script config
echo "1. Script WEBSITE_URL:"
grep WEBSITE_URL /home/shadowzm-scripts/autoban.sh | head -1

# Test connectivity
echo -e "\n2. Testing website connectivity:"
curl -s http://YOUR_VPS_IP/api/ || echo "❌ Can't reach website!"

# Test ban webhook
echo -e "\n3. Testing ban webhook:"
response=$(curl -s -X POST "http://YOUR_VPS_IP/api/bans/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "shadowzm-ban-secret-2024",
    "player_nickname": "DebugTest",
    "steamid": "STEAM_0:1:999",
    "reason": "Debug test",
    "admin_name": "System",
    "duration": "Permanent"
  }')

echo "Response: $response"

if echo "$response" | grep -q "Ban added"; then
    echo "✅ Ban webhook working!"
else
    echo "❌ Ban webhook failed!"
    echo "Response was: $response"
fi
```

**Replace `YOUR_VPS_IP` with your actual IP and run it!**

---

## ✅ Final Solution

**Most likely you need to:**

1. **Update the WEBSITE_URL in autoban.sh:**
```bash
nano /home/shadowzm-scripts/autoban.sh
# Change line 8 to: WEBSITE_URL="http://82.22.174.126"  # Your IP!
```

2. **Make sure VPS backend is running:**
```bash
# On VPS
pm2 status
pm2 restart shadowzm-backend
```

3. **Test from Pterodactyl:**
```bash
curl -X POST "http://82.22.174.126/api/bans/webhook" \
  -H "Content-Type: application/json" \
  -d '{"secret":"shadowzm-ban-secret-2024","player_nickname":"Test","steamid":"STEAM_0:1:123","reason":"test","admin_name":"Admin","duration":"5 minutes"}'
```

4. **If test works, restart autoban.sh:**
```bash
cd /home/shadowzm-scripts
bash autoban.sh
```

---

**Tell me:**
1. What does `grep WEBSITE_URL autoban.sh` show?
2. What happens when you run the test curl command from Pterodactyl server?

This will help me pinpoint the exact issue! 🔧
