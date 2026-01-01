#!/usr/bin/env python3
"""
Simple CS 1.6 Live Data Sync
Syncs rankings and bans to website database
"""

import struct
import glob
import re
from pymongo import MongoClient
from datetime import datetime
import time
import os

# ============ YOUR CONFIGURATION ============
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "shadowzm_database"

# YOUR EXACT FILE PATHS
CSSTATS_FILE = "/var/lib/pterodactyl/volumes/7cc6beed-d649-427e-b172-3ae51a81a1b9/cstrike/addons/amxmodx/data/csstats.dat"
BAN_LOGS_DIR = "/var/lib/pterodactyl/volumes/7cc6beed-d649-427e-b172-3ae51a81a1b9/cstrike/addons/amxmodx/logs"

SYNC_INTERVAL = 60  # Sync every 60 seconds
CLEAR_OLD_DATA_FIRST = True  # Clear test data on first run
# ===========================================

def parse_csstats(filepath):
    """Parse csstats.dat file"""
    players = []
    
    if not os.path.exists(filepath):
        print(f"⚠️  Stats file not found: {filepath}")
        return []
    
    try:
        with open(filepath, 'rb') as f:
            data = f.read()
    except Exception as e:
        print(f"❌ Error reading stats file: {e}")
        return []
    
    if len(data) < 10:
        print("⚠️  Stats file too small")
        return []
    
    offset = 2  # Skip header
    
    while offset < len(data) - 10:
        try:
            # Read name length
            if offset + 2 > len(data):
                break
            name_len = struct.unpack('<H', data[offset:offset+2])[0]
            offset += 2
            
            if name_len == 0 or name_len > 64:
                break
            
            # Read name
            if offset + name_len > len(data):
                break
            name = data[offset:offset+name_len].rstrip(b'\0').decode('utf-8', errors='ignore')
            offset += name_len
            
            # Read steamid length
            if offset + 2 > len(data):
                break
            steamid_len = struct.unpack('<H', data[offset:offset+2])[0]
            offset += 2
            
            if steamid_len == 0 or steamid_len > 64:
                break
            
            # Read steamid
            if offset + steamid_len > len(data):
                break
            steamid = data[offset:offset+steamid_len].rstrip(b'\0').decode('utf-8', errors='ignore')
            offset += steamid_len
            
            # Read stats (7 integers)
            if offset + 28 > len(data):
                break
            
            stats = list(struct.unpack('<7i', data[offset:offset+28]))
            offset += 28
            
            tks, damage, deaths, kills, shots, hits, headshots = stats
            
            # Skip invalid
            if kills < 0 or deaths < 0 or not steamid:
                continue
            
            kd_ratio = round(kills / deaths, 2) if deaths > 0 else float(kills)
            
            players.append({
                'nickname': name,
                'steamid': steamid,
                'kills': max(0, kills),
                'deaths': max(0, deaths),
                'headshots': max(0, headshots),
                'kd_ratio': kd_ratio,
                'last_seen': datetime.utcnow()
            })
            
        except:
            break
    
    players.sort(key=lambda x: x['kills'], reverse=True)
    return players

def parse_ban_logs(log_dir):
    """Parse ban logs"""
    if not os.path.exists(log_dir):
        print(f"⚠️  Ban logs not found: {log_dir}")
        return []
    
    log_files = glob.glob(f"{log_dir}/BAN_HISTORY_*.log")
    
    if not log_files:
        return []
    
    all_bans = []
    unbanned_steamids = set()
    
    for log_file in sorted(log_files):
        try:
            with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
                for line in f:
                    line = line.strip()
                    
                    # Check for unban
                    if 'unbanned' in line or 'Ban time is up' in line:
                        unban_match = re.search(r'unbanned .+? <([^>]+)>', line)
                        if unban_match:
                            unbanned_steamids.add(unban_match.group(1))
                        expire_match = re.search(r'Ban time is up for: .+ \[([^\]]+)\]', line)
                        if expire_match:
                            unbanned_steamids.add(expire_match.group(1))
                    
                    # Check for ban
                    elif 'banned' in line and '||' in line:
                        pattern = r'L (\d{2}/\d{2}/\d{4} - \d{2}:\d{2}:\d{2}): (.+?) <([^>]*)> banned (.+?) <([^>]+)> \|\| Reason: "([^"]*)" \|\| Ban Length: (.+)'
                        match = re.match(pattern, line)
                        if match:
                            timestamp_str, admin_name, admin_steam, player_name, player_steam, reason, duration = match.groups()
                            all_bans.append({
                                'player_nickname': player_name.strip(),
                                'steamid': player_steam.strip(),
                                'reason': reason.strip() if reason.strip() else "Banned",
                                'admin_name': admin_name.strip(),
                                'duration': duration.strip(),
                                'ban_date': datetime.utcnow()
                            })
        except:
            continue
    
    # Filter unbanned
    latest_bans = {}
    for ban in all_bans:
        steamid = ban['steamid']
        latest_bans[steamid] = ban
    
    active_bans = [v for k, v in latest_bans.items() if k not in unbanned_steamids]
    
    return active_bans

def sync_data():
    """Sync data to MongoDB"""
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
        db = client[DB_NAME]
        
        # Test connection
        client.admin.command('ping')
        
        print("=" * 60)
        print(f"🔄 Sync at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        
        # Parse players
        players = parse_csstats(CSSTATS_FILE)
        print(f"📊 Found {len(players)} players")
        
        # Sync players
        if players:
            synced = 0
            for player in players:
                try:
                    db.players.update_one(
                        {"steamid": player['steamid']},
                        {"$set": player},
                        upsert=True
                    )
                    synced += 1
                except:
                    pass
            print(f"✅ Synced {synced} players to database")
        
        # Parse bans
        bans = parse_ban_logs(BAN_LOGS_DIR)
        print(f"🚫 Found {len(bans)} active bans")
        
        # Clear old bans and insert new
        db.bans.delete_many({})
        if bans:
            db.bans.insert_many(bans)
            print(f"✅ Synced {len(bans)} bans to database")
        
        client.close()
        print("✅ Sync complete!\n")
        return True
        
    except Exception as e:
        print(f"❌ Sync failed: {e}\n")
        return False

def main():
    print("""
╔════════════════════════════════════════╗
║   CS 1.6 Live Data Sync (Simple)      ║
╚════════════════════════════════════════╝
""")
    
    print(f"MongoDB: {MONGO_URL}")
    print(f"Database: {DB_NAME}")
    print(f"Stats file: {CSSTATS_FILE}")
    print(f"Ban logs: {BAN_LOGS_DIR}")
    print(f"Sync interval: {SYNC_INTERVAL} seconds\n")
    
    # Clear old data on first run
    if CLEAR_OLD_DATA_FIRST:
        try:
            client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
            db = client[DB_NAME]
            
            count_p = db.players.count_documents({})
            count_b = db.bans.count_documents({})
            
            if count_p > 0 or count_b > 0:
                print(f"🗑️  Clearing old data ({count_p} players, {count_b} bans)...")
                db.players.delete_many({})
                db.bans.delete_many({})
                print("✅ Old data cleared\n")
            
            client.close()
        except Exception as e:
            print(f"⚠️  Could not clear old data: {e}\n")
    
    print("🔄 Starting continuous sync (Press Ctrl+C to stop)\n")
    
    # Continuous sync loop
    while True:
        try:
            sync_data()
            time.sleep(SYNC_INTERVAL)
        except KeyboardInterrupt:
            print("\n⏹️  Stopping sync...")
            break
        except Exception as e:
            print(f"❌ Error: {e}")
            time.sleep(SYNC_INTERVAL)

if __name__ == "__main__":
    main()
