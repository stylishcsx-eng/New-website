#!/usr/bin/env python3
"""
CSStats Parser & Sync for shadowzm
Parses csstats.dat and syncs player stats to website

Usage: python3 /home/stats_sync.py
"""
import struct
import requests
import os

# ============ CONFIGURATION ============
# CHANGE THIS to your website URL or domain
WEBSITE_URL = "http://YOUR_VPS_IP"  # or http://yourdomain.com
SECRET = "shadowzm-ban-secret-2024"

# YOUR Pterodactyl volume path
CSST ATS_FILE = "/var/lib/pterodactyl/volumes/d8109667-ac86-4f43-aeb3-5e84ed58df07/cstrike/addons/amxmodx/data/csstats.dat"
# =======================================

def parse_csstats(filepath):
    """Parse csstats.dat binary file (AMX Mod X format)"""
    players = []
    
    try:
        with open(filepath, 'rb') as f:
            data = f.read()
    except FileNotFoundError:
        print(f"Error: File not found: {filepath}")
        return []
    
    if len(data) < 10:
        print(f"Error: File too small ({len(data)} bytes)")
        return []
    
    print(f"File size: {len(data)} bytes")
    
    offset = 0
    player_count = 0
    
    # Read header
    if len(data) >= 2:
        header = struct.unpack('<H', data[0:2])[0]
        print(f"Header/Version: {header}")
        offset = 2
    
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
            
            # Read stats (7 integers = 28 bytes)
            if offset + 28 > len(data):
                remaining = len(data) - offset
                stats = [0] * 7
                if remaining >= 4:
                    num_ints = remaining // 4
                    for i in range(min(num_ints, 7)):
                        stats[i] = struct.unpack('<i', data[offset+i*4:offset+i*4+4])[0]
                offset = len(data)
            else:
                stats = list(struct.unpack('<7i', data[offset:offset+28]))
                offset += 28
            
            tks, damage, deaths, kills, shots, hits, headshots = stats
            
            # Skip invalid entries
            if kills < 0 or deaths < 0:
                continue
            
            player_count += 1
            print(f"  Found: {name} ({steamid}) - K:{kills} D:{deaths} HS:{headshots}")
            
            players.append({
                'nickname': name,
                'steamid': steamid,
                'kills': max(0, kills),
                'deaths': max(0, deaths),
                'headshots': max(0, headshots)
            })
            
        except Exception as e:
            print(f"  Parse error at offset {offset}: {e}")
            break
    
    print(f"\nTotal players found: {player_count}")
    
    # Sort by kills
    players.sort(key=lambda x: x['kills'], reverse=True)
    return players[:100]  # Top 100

def sync_to_website(players):
    """Sync players to website API"""
    synced = 0
    failed = 0
    
    for player in players:
        try:
            response = requests.post(
                f"{WEBSITE_URL}/api/players/webhook",
                json={
                    "secret": SECRET,
                    "nickname": player['nickname'],
                    "steamid": player['steamid'],
                    "kills": player['kills'],
                    "deaths": player['deaths'],
                    "headshots": player['headshots']
                },
                timeout=10
            )
            if response.status_code == 200:
                print(f"✓ Synced: {player['nickname']}")
                synced += 1
            else:
                print(f"✗ Failed: {player['nickname']} - HTTP {response.status_code}")
                failed += 1
        except Exception as e:
            print(f"✗ Error: {player['nickname']} - {e}")
            failed += 1
    
    return synced, failed

def main():
    print("=" * 50)
    print("CSStats Sync Tool for shadowzm")
    print("=" * 50)
    print(f"\nReading: {CSSTATS_FILE}")
    
    if not os.path.exists(CSSTATS_FILE):
        print(f"\nError: Stats file not found!")
        print("Make sure the path is correct.")
        return
    
    players = parse_csstats(CSSTATS_FILE)
    
    if not players:
        print("\nNo players with stats found.")
        return
    
    # Only sync players with actual activity
    active_players = [p for p in players if p['kills'] > 0 or p['deaths'] > 0]
    
    if not active_players:
        print("\nPlayers found but all have 0 kills/deaths.")
        print("Stats will populate as players play on the server.")
        synced, failed = sync_to_website(players)
    else:
        print(f"\n{len(active_players)} players with stats to sync")
        print("\nSyncing to website...")
        synced, failed = sync_to_website(active_players)
    
    print(f"\n{'=' * 50}")
    print(f"Sync Complete!")
    print(f"  Synced: {synced}")
    print(f"  Failed: {failed}")
    print(f"{'=' * 50}")

if __name__ == "__main__":
    main()
