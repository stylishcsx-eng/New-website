#!/usr/bin/env python3
"""
Standalone CS 1.6 Stats API Server
Reads directly from server files and provides REST API
No database dependency - reads files in real-time
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import a2s
import struct
import glob
import re
from datetime import datetime
from typing import List, Dict, Optional
import os

app = FastAPI(title="CS 1.6 Stats API", version="1.0.0")

# CORS - Allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ CONFIGURATION ============
CS_SERVER_IP = "82.22.174.126"
CS_SERVER_PORT = 27016

# YOUR Pterodactyl volume path
CSSTATS_FILE = "/var/lib/pterodactyl/volumes/d8109667-ac86-4f43-aeb3-5e84ed58df07/cstrike/addons/amxmodx/data/csstats.dat"
BAN_LOGS_DIR = "/var/lib/pterodactyl/volumes/d8109667-ac86-4f43-aeb3-5e84ed58df07/cstrike/addons/amxmodx/logs"
# =======================================

def query_cs_server():
    """Query CS 1.6 server using A2S protocol"""
    try:
        address = (CS_SERVER_IP, CS_SERVER_PORT)
        
        # Get server info
        info = a2s.info(address, timeout=5.0)
        
        # Get players
        players = []
        try:
            players_response = a2s.players(address, timeout=5.0)
            players = [
                {
                    "name": p.name,
                    "score": p.score,
                    "duration": round(p.duration, 2)
                }
                for p in players_response
            ]
        except:
            pass
        
        return {
            "online": True,
            "server_name": info.server_name,
            "map": info.map_name,
            "players": info.player_count,
            "max_players": info.max_players,
            "game": info.game,
            "players_list": players
        }
    except Exception as e:
        return {
            "online": False,
            "error": str(e)
        }

def parse_csstats(filepath):
    """Parse csstats.dat file"""
    players = []
    
    try:
        with open(filepath, 'rb') as f:
            data = f.read()
    except FileNotFoundError:
        return []
    
    if len(data) < 10:
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
            if kills < 0 or deaths < 0:
                continue
            
            # Calculate K/D ratio
            kd_ratio = round(kills / deaths, 2) if deaths > 0 else float(kills)
            
            # Calculate accuracy
            accuracy = round((hits / shots * 100), 2) if shots > 0 else 0
            
            players.append({
                'rank': 0,  # Will be set after sorting
                'nickname': name,
                'steamid': steamid,
                'kills': max(0, kills),
                'deaths': max(0, deaths),
                'headshots': max(0, headshots),
                'kd_ratio': kd_ratio,
                'accuracy': accuracy,
                'damage': max(0, damage),
                'hits': max(0, hits),
                'shots': max(0, shots)
            })
            
        except Exception as e:
            break
    
    # Sort by kills and assign ranks
    players.sort(key=lambda x: x['kills'], reverse=True)
    for idx, player in enumerate(players):
        player['rank'] = idx + 1
    
    return players

def parse_ban_logs(log_dir):
    """Parse ban history logs"""
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
            continue
    
    # Filter out unbanned players
    latest_bans = {}
    for ban in all_bans:
        steamid = ban['steamid']
        latest_bans[steamid] = ban
    
    active_bans = [v for k, v in latest_bans.items() if k not in unbanned_steamids]
    
    return active_bans

# ============ API ENDPOINTS ============

@app.get("/")
async def root():
    """API Information"""
    return {
        "name": "CS 1.6 Stats API",
        "version": "1.0.0",
        "endpoints": {
            "server_status": "/server-status",
            "rankings": "/rankings",
            "bans": "/bans",
            "stats": "/stats"
        }
    }

@app.get("/server-status")
async def get_server_status():
    """Get live CS 1.6 server status"""
    return query_cs_server()

@app.get("/rankings")
async def get_rankings(limit: int = 50):
    """Get player rankings from csstats.dat"""
    if not os.path.exists(CSSTATS_FILE):
        raise HTTPException(status_code=404, detail="Stats file not found")
    
    players = parse_csstats(CSSTATS_FILE)
    
    return {
        "total": len(players),
        "showing": min(limit, len(players)),
        "players": players[:limit]
    }

@app.get("/rankings/top")
async def get_top_rankings(limit: int = 15):
    """Get top N players"""
    return await get_rankings(limit)

@app.get("/rankings/player/{steamid}")
async def get_player_stats(steamid: str):
    """Get specific player stats by SteamID"""
    players = parse_csstats(CSSTATS_FILE)
    
    for player in players:
        if player['steamid'] == steamid:
            return player
    
    raise HTTPException(status_code=404, detail="Player not found")

@app.get("/bans")
async def get_bans():
    """Get active bans from logs"""
    if not os.path.exists(BAN_LOGS_DIR):
        raise HTTPException(status_code=404, detail="Ban logs directory not found")
    
    bans = parse_ban_logs(BAN_LOGS_DIR)
    
    return {
        "total": len(bans),
        "bans": bans
    }

@app.get("/bans/{steamid}")
async def get_player_ban(steamid: str):
    """Check if a specific player is banned"""
    bans = parse_ban_logs(BAN_LOGS_DIR)
    
    for ban in bans:
        if ban['steamid'] == steamid:
            return {
                "banned": True,
                "ban_info": ban
            }
    
    return {
        "banned": False
    }

@app.get("/stats")
async def get_overall_stats():
    """Get overall server statistics"""
    server = query_cs_server()
    players = parse_csstats(CSSTATS_FILE)
    bans = parse_ban_logs(BAN_LOGS_DIR)
    
    total_kills = sum(p['kills'] for p in players)
    total_deaths = sum(p['deaths'] for p in players)
    total_headshots = sum(p['headshots'] for p in players)
    
    return {
        "server": {
            "online": server.get('online', False),
            "current_players": server.get('players', 0),
            "max_players": server.get('max_players', 0),
            "current_map": server.get('map', 'Unknown')
        },
        "statistics": {
            "total_players": len(players),
            "total_bans": len(bans),
            "total_kills": total_kills,
            "total_deaths": total_deaths,
            "total_headshots": total_headshots
        },
        "top_player": players[0] if players else None
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "server": "online" if query_cs_server().get('online') else "offline",
        "stats_file": "found" if os.path.exists(CSSTATS_FILE) else "missing",
        "ban_logs": "found" if os.path.exists(BAN_LOGS_DIR) else "missing"
    }

if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("CS 1.6 Standalone Stats API Server")
    print("=" * 60)
    print(f"Server: {CS_SERVER_IP}:{CS_SERVER_PORT}")
    print(f"Stats File: {CSSTATS_FILE}")
    print(f"Ban Logs: {BAN_LOGS_DIR}")
    print("=" * 60)
    print("Starting API server on http://0.0.0.0:8002")
    print("API Documentation: http://localhost:8002/docs")
    print("=" * 60)
    
    uvicorn.run(app, host="0.0.0.0", port=8002)
