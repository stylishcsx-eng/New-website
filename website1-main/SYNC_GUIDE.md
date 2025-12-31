# Complete Sync Guide for shadowzm: Zombie reverse

## Summary of What's Fixed

✅ **Admin Login Hidden** - No longer visible on player login page  
✅ **Banlist** - Shows: Player, SteamID, Reason, Banned On, Expires (no IP)  
✅ **Notifications** - Players get notified when application approved/rejected  
✅ **Webhooks** - Your server can push bans and stats to website  

---

## Step 1: Find Your Tables on Game Server

SSH into your game server and check what tables you have:

```bash
mysql -u root -e "USE amx; SHOW TABLES;"
```

Look for:
- **Bans table**: `amx_bans`, `bans`, `amxbans`
- **Stats table**: `csstats`, `csstats2`, `stats`, `players`

Check columns:
```bash
mysql -u root -e "USE amx; DESCRIBE amx_bans;"
mysql -u root -e "USE amx; DESCRIBE csstats;"
```

---

## Step 2: Upload Sync Scripts

Upload these files to your game server:

### File 1: `ban_sync.php` (for bans)
```php
<?php
$config = [
    'website_url' => 'https://cs-server-hub-1.preview.emergentagent.com',
    'secret' => 'shadowzm-ban-secret-2024',
    'mysql_host' => '127.0.0.1',
    'mysql_user' => 'root',
    'mysql_pass' => '',
    'mysql_db'   => 'amx',
    'bans_table' => 'amx_bans'  // <-- YOUR TABLE NAME
];
// Rest of script in /app/ban_sync.php
```

### File 2: `player_sync.php` (for rankings)
```php
<?php
$config = [
    'website_url' => 'https://cs-server-hub-1.preview.emergentagent.com',
    'secret' => 'shadowzm-ban-secret-2024',
    'mysql_host' => '127.0.0.1',
    'mysql_user' => 'root',
    'mysql_pass' => '',
    'mysql_db'   => 'amx',
    'stats_table' => 'csstats'  // <-- YOUR TABLE NAME
];
// Rest of script in /app/player_sync.php
```

---

## Step 3: Test Scripts

```bash
# Test ban sync
php /path/to/ban_sync.php

# Test player sync
php /path/to/player_sync.php
```

---

## Step 4: Automate with Cron

Run both scripts every 5 minutes:

```bash
crontab -e
```

Add:
```
*/5 * * * * php /path/to/ban_sync.php >> /var/log/ban_sync.log 2>&1
*/5 * * * * php /path/to/player_sync.php >> /var/log/player_sync.log 2>&1
```

---

## Manual API Commands

### Add a ban manually:
```bash
curl -X POST "https://cs-server-hub-1.preview.emergentagent.com/api/bans/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "shadowzm-ban-secret-2024",
    "player_nickname": "CheaterName",
    "steamid": "STEAM_0:1:123456",
    "reason": "Aimbot",
    "admin_name": "Stylish",
    "duration": "Permanent"
  }'
```

### Add player stats manually:
```bash
curl -X POST "https://cs-server-hub-1.preview.emergentagent.com/api/players/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "shadowzm-ban-secret-2024",
    "nickname": "ProPlayer",
    "steamid": "STEAM_0:1:123456",
    "kills": 5000,
    "deaths": 2000,
    "headshots": 2500
  }'
```

### Remove a ban:
```bash
curl -X DELETE "https://cs-server-hub-1.preview.emergentagent.com/api/bans/webhook/STEAM_0:1:123456?secret=shadowzm-ban-secret-2024"
```

---

## Access Points

| Page | URL |
|------|-----|
| Home | https://cs-server-hub-1.preview.emergentagent.com |
| Server Status | /server-status |
| Rankings | /rankings |
| Banlist | /banlist |
| Rules | /rules |
| Apply for Admin | /apply-admin |
| Player Login | /login |
| Player Register | /register |
| **Admin Login (SECRET)** | **/admin-login** |
| Admin Panel | /admin (after login) |

---

## Notifications

When you approve/reject an application in Admin Panel:
1. A notification is created automatically
2. When that player logs in, they see a bell icon with notification count
3. They can view and dismiss notifications

---

## Troubleshooting

**Bans not syncing?**
1. Check your table name: `mysql -u root -e "USE amx; SHOW TABLES;"`
2. Check script output: `php ban_sync.php`
3. Check website API: `curl https://cs-server-hub-1.preview.emergentagent.com/api/bans`

**Rankings not updating?**
1. Check your stats table name
2. Make sure players have kills > 0
3. Test: `php player_sync.php`

**Can't find tables?**
Your server might use different plugins. Common setups:
- AMX Mod X + CSStats = `csstats` table
- AMX Mod X + StatsX = `statsx` table
- AMXBans = `amx_bans` table
