# 📦 Complete ShadowZM Website Package

## What's Included

This package contains your complete edited website with:
- ✅ Backend with CS 1.6 server integration
- ✅ Frontend with your logo and all pages
- ✅ All configuration files
- ✅ Ready to deploy

---

## 📁 Package Contents

### Backend Files (`backend/`)
```
backend/
├── server.py              - Main FastAPI backend (EDITED - all features working)
├── .env                   - Environment configuration
└── requirements.txt       - Python dependencies
```

### Frontend Files (`frontend/`)
```
frontend/
├── src/
│   ├── App.js            - Main app component
│   ├── App.css           - Custom CSS with logo animations (EDITED)
│   ├── index.js          - Entry point
│   ├── index.css         - Global styles
│   ├── components/       - All UI components
│   │   └── Navigation.js - Navigation with logo (EDITED)
│   ├── contexts/         - Auth context
│   ├── hooks/            - Custom React hooks
│   ├── lib/              - Utility functions
│   └── pages/            - All pages
│       ├── Home.js       - Home page with logo (EDITED)
│       ├── ServerStatus.js
│       ├── Rankings.js
│       ├── Banlist.js
│       ├── Rules.js
│       ├── ApplyAdmin.js
│       ├── Login.js
│       ├── Register.js
│       ├── AdminLogin.js
│       └── AdminPanel.js
├── public/
│   ├── index.html        - Main HTML with logo favicon (EDITED)
│   ├── shadowzm-logo.png - Your logo (ADDED)
│   └── logo.png          - Original logo
├── package.json          - Dependencies and scripts
├── tailwind.config.js    - Tailwind CSS config
├── craco.config.js       - Create React App config
├── jsconfig.json         - JavaScript config
├── components.json       - UI components config
├── postcss.config.js     - PostCSS config
└── .env                  - Frontend environment variables
```

---

## 🎨 What Was Edited/Added

### Backend Changes:
1. ✅ Complete CS 1.6 server integration with `python-a2s` library
2. ✅ Live server status API (queries your CS server)
3. ✅ Player rankings system with webhooks
4. ✅ Banlist system with webhooks
5. ✅ Admin panel with authentication
6. ✅ User registration and login
7. ✅ MongoDB integration for all data

### Frontend Changes:
1. ✅ **Logo added to navigation bar** with hover effects
2. ✅ **Logo added to home page hero** with floating animation
3. ✅ **Logo added to browser tab (favicon)**
4. ✅ **Custom animations** added (floating logo, pulsing online status)
5. ✅ Updated page title: "ShadowZM | CS 1.6 Zombie Reverse"
6. ✅ All pages fully functional (Home, Server Status, Rankings, Banlist, Rules, Admin)

### Configuration:
1. ✅ Backend configured for CS server: 82.22.174.126:27016
2. ✅ Webhook secret: shadowzm-ban-secret-2024
3. ✅ Database: MongoDB
4. ✅ CORS enabled for all origins

---

## 📥 Download Instructions

### Option 1: Download Archive
The file is located at:
```
/app/shadowzm-website-complete.tar.gz
```

**Size:** 921KB (without node_modules and build)

### Option 2: Copy Individual Files
All files are in:
- Backend: `/app/backend/`
- Frontend: `/app/frontend/`

---

## 🚀 Deployment Instructions

### For Your VPS:

#### 1. Extract the archive on your VPS:
```bash
# Upload the tar.gz file to your VPS, then:
tar -xzf shadowzm-website-complete.tar.gz -C /root/shadowzm/

# You'll have:
# /root/shadowzm/backend/
# /root/shadowzm/frontend/
```

#### 2. Install Backend Dependencies:
```bash
cd /root/shadowzm/backend
pip3 install -r requirements.txt
```

#### 3. Update Backend .env (if needed):
```bash
nano /root/shadowzm/backend/.env
```

Current content:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=shadowzm_database
CORS_ORIGINS=*
AMXBANS_HOST=82.22.174.126
AMXBANS_PORT=3306
AMXBANS_DB=amx
AMXBANS_USER=root
AMXBANS_PASS=
```

#### 4. Install Frontend Dependencies and Build:
```bash
cd /root/shadowzm/frontend

# Update .env with YOUR VPS IP
echo "REACT_APP_BACKEND_URL=http://YOUR_VPS_IP" > .env

# Install and build
npm install
npm run build
```

#### 5. Start with PM2:
```bash
# Start backend
cd /root/shadowzm/backend
pm2 start "uvicorn server:app --host 0.0.0.0 --port 8001" --name shadowzm-backend

# Start frontend
cd /root/shadowzm/frontend
pm2 serve build 3000 --name shadowzm-frontend --spa

# Save
pm2 save
pm2 startup
```

---

## 🔄 Update Instructions

### When You Need to Update Backend:
```bash
# 1. Upload new server.py to /root/shadowzm/backend/
# 2. Restart
pm2 restart shadowzm-backend
```

### When You Need to Update Frontend:
```bash
# 1. Upload new files to /root/shadowzm/frontend/src/
# 2. Rebuild
cd /root/shadowzm/frontend
npm run build
# 3. Restart
pm2 restart shadowzm-frontend
```

---

## 📝 Important Files to Remember

### Backend .env (Configure for your needs):
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=shadowzm_database
CORS_ORIGINS=*
JWT_SECRET=shadowzm-secret-key-2024
BAN_WEBHOOK_SECRET=shadowzm-ban-secret-2024
```

### Frontend .env (MUST change YOUR_VPS_IP):
```env
REACT_APP_BACKEND_URL=http://YOUR_VPS_IP
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

### CS Server Config in Backend (server.py line 34-36):
```python
CS_SERVER_IP = "82.22.174.126"
CS_SERVER_PORT = 27016
CS_SERVER_NAME = "ShadowZM : Zombie Reverse"
```

---

## 🎮 Pterodactyl Sync Scripts Configuration

Update these in your stats_sync.py and import_bans.py:

```python
WEBSITE_URL = "http://YOUR_VPS_IP:8001"
SECRET = "shadowzm-ban-secret-2024"
```

---

## 🔐 Default Admin Account

```
Username: Stylish
Email: owner@shadowzm.com
Password: Itachi1849
```

Login at: `http://YOUR_VPS_IP:3000/admin-login`

---

## 📊 API Endpoints

**Server Status:**
```
GET http://YOUR_VPS_IP:8001/api/server-status
```

**Player Rankings:**
```
GET http://YOUR_VPS_IP:8001/api/rankings/top?limit=15
```

**Banlist:**
```
GET http://YOUR_VPS_IP:8001/api/bans
```

**Add Player (Webhook from Pterodactyl):**
```
POST http://YOUR_VPS_IP:8001/api/players/webhook
{
  "secret": "shadowzm-ban-secret-2024",
  "nickname": "PlayerName",
  "steamid": "STEAM_0:1:123456",
  "kills": 100,
  "deaths": 50,
  "headshots": 30
}
```

**Add Ban (Webhook from Pterodactyl):**
```
POST http://YOUR_VPS_IP:8001/api/bans/webhook
{
  "secret": "shadowzm-ban-secret-2024",
  "player_nickname": "PlayerName",
  "steamid": "STEAM_0:1:123456",
  "reason": "Cheating",
  "admin_name": "AdminName",
  "duration": "Permanent"
}
```

---

## ✅ Features Included

### Frontend:
- ✅ Home page with live server stats
- ✅ Server status page (real-time CS 1.6 server query)
- ✅ Player rankings (top players by kills)
- ✅ Banlist (active bans)
- ✅ Rules page
- ✅ Admin application form
- ✅ User registration/login
- ✅ Admin panel
- ✅ Your logo everywhere (nav, home, browser tab)
- ✅ Custom animations and effects

### Backend:
- ✅ FastAPI REST API
- ✅ Live CS 1.6 server queries (A2S protocol)
- ✅ MongoDB database integration
- ✅ JWT authentication
- ✅ User management (register, login, roles)
- ✅ Player stats system
- ✅ Ban management system
- ✅ Admin panel APIs
- ✅ Webhook endpoints for Pterodactyl sync

---

## 🎯 Quick Start Summary

```bash
# 1. Extract files on VPS
tar -xzf shadowzm-website-complete.tar.gz -C /root/shadowzm/

# 2. Install backend
cd /root/shadowzm/backend
pip3 install -r requirements.txt

# 3. Install & build frontend
cd /root/shadowzm/frontend
echo "REACT_APP_BACKEND_URL=http://YOUR_VPS_IP" > .env
npm install
npm run build

# 4. Start with PM2
cd /root/shadowzm/backend
pm2 start "uvicorn server:app --host 0.0.0.0 --port 8001" --name shadowzm-backend

cd /root/shadowzm/frontend
pm2 serve build 3000 --name shadowzm-frontend --spa

pm2 save
pm2 startup

# 5. Open in browser
# http://YOUR_VPS_IP:3000
```

---

## 📞 Support

If you have issues:
1. Check PM2 logs: `pm2 logs`
2. Check backend status: `curl http://localhost:8001/api/`
3. Check MongoDB: `sudo systemctl status mongodb`
4. Review the deployment guides in the package

---

**Your complete edited website is ready to deploy! 🚀**
