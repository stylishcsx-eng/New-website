# 🔄 Server Restart Commands Guide

## Quick Reference Commands

### Restart Individual Services

```bash
# Restart Backend Only
sudo supervisorctl restart backend

# Restart Frontend Only
sudo supervisorctl restart frontend

# Restart MongoDB
sudo supervisorctl restart mongodb
```

### Restart All Services

```bash
# Restart Everything at Once
sudo supervisorctl restart all
```

### Check Service Status

```bash
# Check Status of All Services
sudo supervisorctl status

# Expected Output:
# backend                          RUNNING   pid 870, uptime 0:06:51
# frontend                         RUNNING   pid 935, uptime 0:06:36
# mongodb                          RUNNING   pid 49, uptime 0:21:28
```

### Stop/Start Services

```bash
# Stop Backend
sudo supervisorctl stop backend

# Start Backend
sudo supervisorctl start backend

# Stop Frontend
sudo supervisorctl stop frontend

# Start Frontend
sudo supervisorctl start frontend
```

### View Service Logs

```bash
# Backend Logs (errors)
tail -n 50 /var/log/supervisor/backend.err.log

# Backend Logs (output)
tail -n 50 /var/log/supervisor/backend.out.log

# Frontend Logs (output)
tail -n 50 /var/log/supervisor/frontend.out.log

# Frontend Logs (errors)
tail -n 50 /var/log/supervisor/frontend.err.log

# Follow logs in real-time (use Ctrl+C to exit)
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/frontend.out.log
```

## When to Restart?

### ✅ Restart Backend When:
- You modify `/app/backend/server.py`
- You update `/app/backend/.env` file
- You install new Python packages
- API endpoints are not responding correctly

### ✅ Restart Frontend When:
- You modify React components in `/app/frontend/src/`
- You update `/app/frontend/.env` file
- You install new npm/yarn packages
- CSS/styling changes are not showing up

### ⚠️ Note About Hot Reload:
- Frontend has **hot reload enabled** - most changes appear automatically
- Backend has **hot reload enabled** - most changes appear automatically
- **ONLY restart when:**
  - Installing new dependencies
  - Updating .env files
  - Server crashes or stops responding

## Common Issues & Solutions

### Issue: Backend not starting
```bash
# Check error logs
tail -n 100 /var/log/supervisor/backend.err.log

# Usually caused by:
# - Missing Python package
# - Syntax error in server.py
# - MongoDB connection issue
```

### Issue: Frontend not compiling
```bash
# Check output logs
tail -n 100 /var/log/supervisor/frontend.out.log

# Usually caused by:
# - Missing npm package
# - Syntax error in React components
# - Import path issues
```

### Issue: Changes not showing up
```bash
# 1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
# 2. Check if service is running
sudo supervisorctl status
# 3. Restart the specific service
sudo supervisorctl restart frontend  # or backend
```

## API Testing Commands

```bash
# Test Backend API Root
curl http://localhost:8001/api/

# Test Server Status
curl http://localhost:8001/api/server-status

# Test Rankings
curl http://localhost:8001/api/rankings/top?limit=5

# Test Bans
curl http://localhost:8001/api/bans

# Test with Pretty JSON Output
curl -s http://localhost:8001/api/server-status | python3 -m json.tool
```

## Emergency Reset

```bash
# If everything is broken, restart all services
sudo supervisorctl restart all

# Wait 10 seconds
sleep 10

# Check status
sudo supervisorctl status

# Check logs
tail -n 50 /var/log/supervisor/backend.err.log
tail -n 50 /var/log/supervisor/frontend.out.log
```

## Quick Tips

1. **Always check logs first** before restarting
2. **Hot reload works for most changes** - don't restart unnecessarily
3. **Backend restarts in ~2 seconds**
4. **Frontend restarts take ~30-60 seconds** (compiling React)
5. **Use `status` command** to verify services are running

## Most Common Commands (Copy-Paste Ready)

```bash
# Check everything is running
sudo supervisorctl status

# Restart backend after code changes
sudo supervisorctl restart backend

# Restart frontend after major changes
sudo supervisorctl restart frontend

# View backend errors
tail -n 50 /var/log/supervisor/backend.err.log

# Test API is working
curl http://localhost:8001/api/server-status
```

---

**💡 Pro Tip:** Bookmark this file! These are the commands you'll use most often.
