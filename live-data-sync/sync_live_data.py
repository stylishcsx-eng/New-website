#!/usr/bin/env python3
"""
Live CS 1.6 Data Sync to Website Database
Reads directly from server files and updates MongoDB
Run this on your VPS or Pterodactyl server
"""

import struct
import glob
import re
import a2s
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import asyncio
import os
from typing import List, Dict

# ============ CONFIGURATION ============
# MongoDB Connection (Your website's database)
MONGO_URL = "mongodb://localhost:27017"  # Change if MongoDB is on different server
DB_NAME = "shadowzm_database"  # Your website's database name

# CS Server
CS_SERVER_IP = "82.22.174.126"
CS_SERVER_PORT = 27016

# File Paths (on Pterodactyl server or wherever CS files are)
CSSTATS_FILE = "/var/lib/pterodactyl/volumes/d8109667-ac86-4f43-aeb3-5e84ed58df07/cstrike/addons/amxmodx/data/csstats.dat"
BAN_LOGS_DIR = "/var/lib/pterodactyl/volumes/d8109667-ac86-4f43-aeb3-5e84ed58df07/cstrike/addons/amxmodx/logs"

# Sync Settings
SYNC_INTERVAL = 60  # Seconds between syncs (60 = every minute)
CLEAR_OLD_DATA = True  # Clear old test data on first run
# =======================================

class CS16DataSync:
    def __init__(self):
        self.client = None
        self.db = None
        
    async def connect_db(self):
        """Connect to MongoDB"""
        print("🔌 Connecting to MongoDB...")
        self.client = AsyncIOMotorClient(MONGO_URL)
        self.db = self.client[DB_NAME]
        
        # Test connection
        try:
            await self.client.admin.command('ping')
            print("✅ MongoDB connected successfully")
        except Exception as e:
            print(f"❌ MongoDB connection failed: {e}")
            raise
    
    async def clear_old_data(self):
        """Clear old test data"""
        print("\n🗑️  Clearing old data...")
        await self.db.players.delete_many({})
        await self.db.bans.delete_many({})
        print("✅ Old data cleared")
    
    def query_server_status(self):
        """Query CS 1.6 server status"""
        try:
            address = (CS_SERVER_IP, CS_SERVER_PORT)
            info = a2s.info(address, timeout=5.0)
            
            # Get player list
            players = []
            try:
                players_response = a2s.players(address, timeout=5.0)
                players = [{"name": p.name, "score": p.score} for p in players_response]
            except:
                pass
            
            return {
                "online": True,
                "server_name": info.server_name,
                "map": info.map_name,
                "players": info.player_count,
                "max_players": info.max_players,
                "players_list": players
            }
        except Exception as e:
            print(f"⚠️  Server query failed: {e}")
            return {
                "online": False,
                "server_name": "ShadowZM : Zombie Reverse",
                "map": "Unknown",
                "players": 0,
                "max_players": 32,
                "players_list": []
            }
    
    def parse_csstats(self, filepath):
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
            print("⚠️  Stats file too small or empty")
            return []
        
        offset = 2  # Skip header
        player_count = 0
        
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
                name = data[offset:offset+name_len].rstrip(b'\\0').decode('utf-8', errors='ignore')
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
                steamid = data[offset:offset+steamid_len].rstrip(b'\\0').decode('utf-8', errors='ignore')
                offset += steamid_len
                
                # Read stats (7 integers = 28 bytes)
                if offset + 28 > len(data):
                    break
                
                stats = list(struct.unpack('<7i', data[offset:offset+28]))
                offset += 28
                
                tks, damage, deaths, kills, shots, hits, headshots = stats
                
                # Skip invalid entries
                if kills < 0 or deaths < 0 or not steamid:
                    continue
                
                # Calculate stats
                kd_ratio = round(kills / deaths, 2) if deaths > 0 else float(kills)
                
                player_count += 1
                
                players.append({
                    'nickname': name,
                    'steamid': steamid,
                    'kills': max(0, kills),
                    'deaths': max(0, deaths),
                    'headshots': max(0, headshots),
                    'kd_ratio': kd_ratio
                })
                
            except Exception as e:
                break
        
        print(f"📊 Found {player_count} players in stats file")
        
        # Sort by kills
        players.sort(key=lambda x: x['kills'], reverse=True)
        return players
    
    def parse_ban_logs(self, log_dir):
        """Parse ban history logs"""
        if not os.path.exists(log_dir):
            print(f"⚠️  Ban logs directory not found: {log_dir}")
            return []
        
        log_files = glob.glob(f"{log_dir}/BAN_HISTORY_*.log")
        
        if not log_files:
            print(f"⚠️  No BAN_HISTORY log files found in {log_dir}")
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
                            expire_match = re.search(r'Ban time is up for: .+ \\[([^\\]]+)\\]', line)
                            if expire_match:
                                unbanned_steamids.add(expire_match.group(1))
                        
                        # Check for ban
                        elif 'banned' in line and '||' in line:
                            pattern = r'L (\\d{2}/\\d{2}/\\d{4} - \\d{2}:\\d{2}:\\d{2}): (.+?) <([^>]*)> banned (.+?) <([^>]+)> \\|\\| Reason: "([^"]*)" \\|\\| Ban Length: (.+)'
                            match = re.match(pattern, line)
                            if match:
                                timestamp_str, admin_name, admin_steam, player_name, player_steam, reason, duration = match.groups()
                                all_bans.append({
                                    'timestamp': timestamp_str,
                                    'admin_name': admin_name.strip(),
                                    'player_nickname': player_name.strip(),
                                    'steamid': player_steam.strip(),
                                    'reason': reason.strip() if reason.strip() else "Banned",
                                    'duration': duration.strip()
                                })
            except Exception as e:
                print(f"⚠️  Error reading {log_file}: {e}")
                continue
        
        # Filter out unbanned players
        latest_bans = {}
        for ban in all_bans:
            steamid = ban['steamid']
            latest_bans[steamid] = ban
        
        active_bans = [v for k, v in latest_bans.items() if k not in unbanned_steamids]
        
        print(f"🚫 Found {len(active_bans)} active bans")
        
        return active_bans
    
    async def sync_players(self, players):
        """Sync players to database"""
        if not players:
            print("⚠️  No players to sync")
            return
        
        print(f"\\n👥 Syncing {len(players)} players...")
        
        synced = 0
        for player in players:
            try:
                # Update or insert player
                await self.db.players.update_one(
                    {"steamid": player['steamid']},
                    {
                        "$set": {
                            "nickname": player['nickname'],
                            "kills": player['kills'],
                            "deaths": player['deaths'],
                            "headshots": player['headshots'],
                            "kd_ratio": player['kd_ratio'],
                            "last_seen": datetime.now(timezone.utc)
                        }
                    },
                    upsert=True
                )
                synced += 1
            except Exception as e:
                print(f"❌ Error syncing {player['nickname']}: {e}")
        
        print(f"✅ Synced {synced}/{len(players)} players")
    
    async def sync_bans(self, bans):
        """Sync bans to database"""
        print(f"\\n🚫 Syncing {len(bans)} bans...")
        
        if not bans:
            # Clear all bans if no active bans
            await self.db.bans.delete_many({})
            print("✅ No active bans - cleared banlist")
            return
        
        # Clear old bans
        await self.db.bans.delete_many({})
        
        synced = 0
        for ban in bans:
            try:
                # Insert ban
                await self.db.bans.insert_one({
                    "player_nickname": ban['player_nickname'],
                    "steamid": ban['steamid'],
                    "reason": ban['reason'],
                    "admin_name": ban['admin_name'],
                    "duration": ban['duration'],
                    "ban_date": datetime.now(timezone.utc)
                })
                synced += 1
            except Exception as e:
                print(f"❌ Error syncing ban for {ban['player_nickname']}: {e}")
        
        print(f"✅ Synced {synced}/{len(bans)} bans")
    
    async def sync_server_status(self, status):
        """Update server status in cache/memory (optional)"""
        print(f"\\n🖥️  Server Status: {'🟢 ONLINE' if status['online'] else '🔴 OFFLINE'}")
        if status['online']:
            print(f"   Map: {status['map']}")
            print(f"   Players: {status['players']}/{status['max_players']}")
    
    async def run_sync(self):
        """Run complete sync"""
        print("\\n" + "="*60)
        print(f"🔄 Starting sync at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*60)
        
        # 1. Query server status
        server_status = self.query_server_status()
        await self.sync_server_status(server_status)
        
        # 2. Parse and sync player stats
        players = self.parse_csstats(CSSTATS_FILE)
        await self.sync_players(players)
        
        # 3. Parse and sync bans
        bans = self.parse_ban_logs(BAN_LOGS_DIR)
        await self.sync_bans(bans)
        
        print("\\n" + "="*60)
        print("✅ Sync complete!")
        print("="*60)
    
    async def run_continuous(self):
        """Run sync continuously"""
        await self.connect_db()
        
        if CLEAR_OLD_DATA:
            await self.clear_old_data()
        
        print(f"\\n🔄 Starting continuous sync (every {SYNC_INTERVAL} seconds)")
        print("Press Ctrl+C to stop\\n")
        
        while True:
            try:
                await self.run_sync()
                await asyncio.sleep(SYNC_INTERVAL)
            except KeyboardInterrupt:
                print("\\n\\n⏹️  Stopping sync...")
                break
            except Exception as e:
                print(f"\\n❌ Error during sync: {e}")
                await asyncio.sleep(SYNC_INTERVAL)
        
        self.client.close()
    
    async def run_once(self):
        """Run sync once"""
        await self.connect_db()
        
        if CLEAR_OLD_DATA:
            await self.clear_old_data()
        
        await self.run_sync()
        
        self.client.close()

async def main():
    print("""
╔════════════════════════════════════════════════════════════╗
║     CS 1.6 Live Data Sync to Website Database             ║
║     Reads files directly and updates MongoDB               ║
╚════════════════════════════════════════════════════════════╝
""")
    
    print("Configuration:")
    print(f"  MongoDB: {MONGO_URL}")
    print(f"  Database: {DB_NAME}")
    print(f"  CS Server: {CS_SERVER_IP}:{CS_SERVER_PORT}")
    print(f"  Stats File: {CSSTATS_FILE}")
    print(f"  Ban Logs: {BAN_LOGS_DIR}")
    print(f"  Sync Interval: {SYNC_INTERVAL} seconds")
    print()
    
    # Ask user
    mode = input("Run mode? (1) Once (2) Continuous [2]: ").strip() or "2"
    
    syncer = CS16DataSync()
    
    if mode == "1":
        print("\\nRunning once...")
        await syncer.run_once()
    else:
        print("\\nRunning continuously...")
        await syncer.run_continuous()

if __name__ == "__main__":
    asyncio.run(main())
