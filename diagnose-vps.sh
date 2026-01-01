#!/bin/bash
# ShadowZM VPS Diagnostic Script
# Run this and send me the output

echo "======================================"
echo "ShadowZM VPS Diagnostic Report"
echo "======================================"
echo ""

# 1. Check PM2 Backend
echo "1. PM2 Backend Status:"
pm2 status 2>&1 | grep -E "shadowzm|online|errored|stopped"
echo ""

# 2. Check if backend is actually running
echo "2. Backend Process Check:"
ps aux | grep "uvicorn\|shadowzm" | grep -v grep
echo ""

# 3. Test backend API directly
echo "3. Backend API Test:"
curl -s http://localhost:8001/api/ 2>&1 | head -3
echo ""

# 4. Check MongoDB
echo "4. MongoDB Status:"
sudo systemctl status mongod 2>&1 | grep -E "Active|Main PID"
echo ""

# 5. Check Nginx
echo "5. Nginx Status:"
sudo systemctl status nginx 2>&1 | grep -E "Active|Main PID"
echo ""

# 6. Check Nginx config for /api proxy
echo "6. Nginx API Proxy Config:"
cat /etc/nginx/sites-enabled/shadowzm 2>&1 | grep -A 5 "location /api"
echo ""

# 7. Check backend logs
echo "7. Backend Logs (last 20 lines):"
pm2 logs shadowzm-backend --nostream --lines 20 2>&1
echo ""

# 8. Check if port 8001 is listening
echo "8. Port 8001 Status:"
sudo netstat -tlnp 2>&1 | grep 8001
echo ""

# 9. Test backend from outside (through nginx)
echo "9. Test API through Nginx:"
curl -s http://localhost/api/ 2>&1 | head -3
echo ""

# 10. Check backend .env file
echo "10. Backend .env Configuration:"
if [ -f /var/www/shadowzm/backend/.env ]; then
    echo "✓ .env file exists"
    cat /var/www/shadowzm/backend/.env 2>&1
else
    echo "✗ .env file NOT FOUND"
fi
echo ""

# 11. Check if backend files exist
echo "11. Backend Files Check:"
ls -la /var/www/shadowzm/backend/server.py 2>&1
echo ""

# 12. Check MongoDB connection from backend
echo "12. MongoDB Connection Test:"
cd /var/www/shadowzm/backend 2>/dev/null
python3 -c "from motor.motor_asyncio import AsyncIOMotorClient; import asyncio; asyncio.run(AsyncIOMotorClient('mongodb://localhost:27017').admin.command('ping')); print('✓ MongoDB connection OK')" 2>&1
echo ""

echo "======================================"
echo "Diagnostic Complete"
echo "======================================"
