# VPS Deployment Guide for shadowzm: Zombie reverse

## Prerequisites
Your VPS needs:
- Ubuntu 20.04+ or Debian 11+
- Nginx installed
- Node.js 18+ (for React)
- Python 3.11+ (for FastAPI)
- MongoDB installed and running

## Step 1: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3-pip

# Install MongoDB
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update && sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Yarn
sudo npm install -g yarn
```

## Step 2: Upload Files
Upload the entire `/app` folder to your VPS, for example to `/var/www/shadowzm/`

## Step 3: Setup Backend

```bash
cd /var/www/shadowzm/backend

# Create Python virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=shadowzm
CORS_ORIGINS=*
JWT_SECRET=your-super-secret-jwt-key-change-this
AMXBANS_HOST=82.22.174.126
AMXBANS_PORT=3306
AMXBANS_DB=bans
AMXBANS_USER=Stylish
AMXBANS_PASS=Itachi1849
EOF

# Start backend with PM2
pm2 start "source venv/bin/activate && uvicorn server:app --host 0.0.0.0 --port 8001" --name shadowzm-backend
pm2 save
```

## Step 4: Setup Frontend

```bash
cd /var/www/shadowzm/frontend

# Create .env file (replace YOUR_DOMAIN with your actual domain)
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=https://YOUR_DOMAIN.com
EOF

# Install dependencies and build
yarn install
yarn build
```

## Step 5: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/shadowzm
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN.com;  # Replace with your domain or IP

    # Frontend (React build)
    location / {
        root /var/www/shadowzm/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API (proxy to FastAPI)
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/shadowzm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 6: Setup SSL (Optional but Recommended)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d YOUR_DOMAIN.com
```

## Step 7: Enable PM2 on Boot

```bash
pm2 startup
pm2 save
```

## AMXBans MySQL Connection

For the live banlist to work, your MySQL server needs to allow remote connections:

1. On your game server, edit MySQL config:
```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
# Change: bind-address = 127.0.0.1
# To: bind-address = 0.0.0.0
```

2. Grant remote access:
```sql
GRANT ALL PRIVILEGES ON bans.* TO 'Stylish'@'%' IDENTIFIED BY 'Itachi1849';
FLUSH PRIVILEGES;
```

3. Open firewall port 3306:
```bash
sudo ufw allow 3306
```

## Troubleshooting

**Blank screen?**
- Check if frontend build exists: `ls /var/www/shadowzm/frontend/build`
- Check nginx logs: `sudo tail -f /var/log/nginx/error.log`

**API not working?**
- Check backend logs: `pm2 logs shadowzm-backend`
- Verify backend is running: `pm2 status`

**MongoDB errors?**
- Check MongoDB: `sudo systemctl status mongod`
- View logs: `sudo tail -f /var/log/mongodb/mongod.log`

## Quick Test

After setup, test your API:
```bash
curl http://localhost:8001/api/server-status
```

Visit your website: `http://YOUR_DOMAIN.com`
