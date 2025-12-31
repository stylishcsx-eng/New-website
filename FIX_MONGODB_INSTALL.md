# 🔧 Fix: MongoDB Installation Error

## Error: "Package 'mongodb' has no installation candidate"

This happens because MongoDB is not in Ubuntu's default repositories anymore.

---

## ✅ Solution 1: Install MongoDB Community Edition (Recommended)

### For Ubuntu 20.04/22.04:

```bash
# Step 1: Import MongoDB public GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor

# Step 2: Create list file for MongoDB
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Step 3: Update package database
sudo apt update

# Step 4: Install MongoDB
sudo apt install -y mongodb-org

# Step 5: Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Step 6: Verify it's running
sudo systemctl status mongod
```

### For Ubuntu 18.04:
```bash
# Import key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update and install
sudo apt update
sudo apt install -y mongodb-org

# Start
sudo systemctl start mongod
sudo systemctl enable mongod
```

---

## ✅ Solution 2: Use Docker (Easiest!)

If you have Docker installed:

```bash
# Install Docker (if not installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Run MongoDB in Docker
docker run -d \
  --name mongodb \
  --restart always \
  -p 27017:27017 \
  -v /data/mongodb:/data/db \
  mongo:latest

# MongoDB is now running on localhost:27017
```

To manage:
```bash
# Check status
docker ps | grep mongodb

# Stop
docker stop mongodb

# Start
docker start mongodb

# View logs
docker logs mongodb
```

---

## ✅ Solution 3: Install from Ubuntu Universe (Simpler but Older Version)

```bash
# Enable universe repository
sudo apt update

# Install mongodb from universe (older version but works)
sudo apt install -y mongodb-server mongodb-clients

# Start
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Check status
sudo systemctl status mongodb
```

---

## 🔍 Check Which Solution Worked

```bash
# Check if MongoDB is running
sudo systemctl status mongod
# or
sudo systemctl status mongodb

# Test connection
mongo --version
# or
mongosh --version

# Connect to MongoDB
mongo
# or
mongosh

# Should see MongoDB shell prompt
```

---

## 🚀 After Installing MongoDB

### Update Your Backend .env

Make sure your backend .env has correct MongoDB URL:

```bash
cd /root/shadowzm/backend
nano .env
```

Should contain:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=shadowzm_database
```

### Test Backend Connection

```bash
cd /root/shadowzm/backend

# Create test script
cat > test_mongo.py << 'EOF'
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def test():
    try:
        client = AsyncIOMotorClient("mongodb://localhost:27017")
        await client.admin.command('ping')
        print("✅ MongoDB connection successful!")
        client.close()
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")

asyncio.run(test())
EOF

# Run test
python3 test_mongo.py
```

Should see: `✅ MongoDB connection successful!`

---

## 🎯 Recommended: Complete MongoDB Setup Commands

**Copy and paste this entire block:**

```bash
# Install MongoDB 7.0 (Community Edition)
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update
sudo apt install -y mongodb-org

# Start and enable
sudo systemctl start mongod
sudo systemctl enable mongod

# Check status
sudo systemctl status mongod

# If running, you'll see "active (running)"
```

---

## 🛠️ Troubleshooting

### If MongoDB won't start:

```bash
# Check logs
sudo journalctl -u mongod -n 50

# Check if port 27017 is free
sudo netstat -tulpn | grep 27017

# Create data directory if missing
sudo mkdir -p /var/lib/mongodb
sudo chown -R mongodb:mongodb /var/lib/mongodb

# Restart
sudo systemctl restart mongod
```

### If still having issues:

```bash
# Check Ubuntu version
lsb_release -a

# For Ubuntu 24.04 or newer, use this:
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update
sudo apt install -y mongodb-org
```

---

## ✅ Quick Check List

After installation, verify:

```bash
# 1. MongoDB service is running
sudo systemctl status mongod
# Should show: "active (running)"

# 2. MongoDB is listening on port 27017
sudo netstat -tulpn | grep 27017
# Should show: mongod listening on 27017

# 3. Can connect
mongosh
# Should open MongoDB shell
# Type: exit to quit

# 4. Test from Python
cd /root/shadowzm/backend
python3 -c "from motor.motor_asyncio import AsyncIOMotorClient; import asyncio; asyncio.run(AsyncIOMotorClient('mongodb://localhost:27017').admin.command('ping')); print('MongoDB OK!')"
```

---

## 📝 Updated Simple VPS Guide Commands

**Replace the MongoDB installation line with:**

```bash
# OLD (doesn't work):
sudo apt install -y mongodb

# NEW (works):
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

---

## 🚀 Complete Working Installation Script

**Copy this entire block (all at once):**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python, Node.js, Git
sudo apt install -y python3 python3-pip python3-venv nodejs npm git curl gnupg

# Install MongoDB (correct method)
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install PM2
sudo npm install -g pm2

# Verify everything
echo "=== Checking installations ==="
python3 --version
node --version
npm --version
pm2 --version
sudo systemctl status mongod | head -3

echo "✅ All installed successfully!"
```

---

## 🎯 Next Steps

After MongoDB is installed and running:

1. Continue with backend setup:
```bash
cd /root/shadowzm/backend
pip3 install -r requirements.txt
```

2. Start backend with PM2:
```bash
pm2 start "uvicorn server:app --host 0.0.0.0 --port 8001" --name shadowzm-backend
```

3. Check backend can connect to MongoDB:
```bash
pm2 logs shadowzm-backend
# Should not show MongoDB connection errors
```

Good luck! 🚀
