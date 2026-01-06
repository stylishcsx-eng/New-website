# How to Sync Bans from Your Game Server

## The Simple Solution

Since MySQL remote connection is complicated, I created a **PHP script** that runs on YOUR game server and sends bans to the website.

---

## Step 1: Find Your Bans Table

First, check what tables you have in MySQL. On your game server run:

```bash
mysql -u root -e "USE amx; SHOW TABLES;"
```

Look for a table like: `amx_bans`, `bans`, `amxbans`, etc.

Then check the columns:
```bash
mysql -u root -e "USE amx; DESCRIBE amx_bans;"
```

---

## Step 2: Upload the Script

1. Download `ban_sync.php` from this project
2. Upload it to your game server (anywhere, like `/home/`)
3. Edit the config section:

```php
$config = [
    'website_url' => 'https://frag-tracker.preview.emergentagent.com',
    'secret' => 'shadowzm-ban-secret-2024',
    'mysql_host' => '127.0.0.1',
    'mysql_user' => 'root',
    'mysql_pass' => '',
    'mysql_db'   => 'amx',
    'bans_table' => 'amx_bans'  // <-- Change this to YOUR table name
];
```

---

## Step 3: Test the Script

```bash
php ban_sync.php
```

You should see:
```
=== Ban Sync Script ===
Connecting to MySQL...
Connected to MySQL!
✓ Synced: PlayerName (STEAM_0:1:123456)
=== Sync Complete ===
Synced: 5
```

---

## Step 4: Automate It (Cron Job)

Run every 5 minutes automatically:

```bash
crontab -e
```

Add this line:
```
*/5 * * * * php /home/ban_sync.php >> /var/log/ban_sync.log 2>&1
```

---

## Alternative: Manual Ban via Website API

You can also add bans directly using curl:

```bash
curl -X POST "https://frag-tracker.preview.emergentagent.com/api/bans/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "shadowzm-ban-secret-2024",
    "player_nickname": "Cheater123",
    "steamid": "STEAM_0:1:999999",
    "reason": "Aimbot",
    "admin_name": "Stylish",
    "duration": "Permanent"
  }'
```

---

## What Shows on Website

- ✅ Player Nickname
- ✅ SteamID  
- ✅ Reason
- ✅ Admin who banned
- ✅ Duration
- ✅ Date/Time
- ❌ IP (Hidden for privacy)

---

## Need Help?

1. Check your table name in MySQL
2. Check if PHP is installed: `php -v`
3. Check if curl is installed: `php -m | grep curl`

If you don't have PHP, you can use this bash alternative:

```bash
#!/bin/bash
# Simple ban add script
curl -X POST "https://frag-tracker.preview.emergentagent.com/api/bans/webhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"secret\": \"shadowzm-ban-secret-2024\",
    \"player_nickname\": \"$1\",
    \"steamid\": \"$2\",
    \"reason\": \"$3\",
    \"admin_name\": \"$4\",
    \"duration\": \"$5\"
  }"
```

Usage: `./add_ban.sh "PlayerName" "STEAM_0:1:123" "Cheating" "Stylish" "Permanent"`
