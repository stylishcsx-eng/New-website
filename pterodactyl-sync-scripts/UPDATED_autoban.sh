#!/bin/bash
# ============================================
# Auto Ban Sync for Advanced Bans Plugin
# Watches BAN_HISTORY logs and syncs to website
# ============================================

# ============ CONFIGURATION ============
# CHANGE THIS to your website URL or domain
WEBSITE_URL="http://YOUR_VPS_IP"  # or http://yourdomain.com
SECRET="shadowzm-ban-secret-2024"

# YOUR Pterodactyl volume path
LOG_DIR="/var/lib/pterodactyl/volumes/d8109667-ac86-4f43-aeb3-5e84ed58df07/cstrike/addons/amxmodx/logs"
# =======================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${GREEN}=== shadowzm Auto Ban Sync ===${NC}"
echo "Website: $WEBSITE_URL"
echo "Log dir: $LOG_DIR"
echo ""

# Function to send ban to website
send_ban() {
    local player="$1"
    local steamid="$2"
    local reason="$3"
    local admin="$4"
    local duration="$5"
    
    echo -e "${YELLOW}[NEW BAN DETECTED]${NC}"
    echo "  Player: $player"
    echo "  SteamID: $steamid"
    echo "  Reason: $reason"
    echo "  Admin: $admin"
    echo "  Duration: $duration"
    
    response=$(curl -s -X POST "$WEBSITE_URL/api/bans/webhook" \
        -H "Content-Type: application/json" \
        -d "{
            \"secret\": \"$SECRET\",
            \"player_nickname\": \"$player\",
            \"steamid\": \"$steamid\",
            \"reason\": \"$reason\",
            \"admin_name\": \"$admin\",
            \"duration\": \"$duration\"
        }")
    
    if echo "$response" | grep -q "message"; then
        echo -e "${GREEN}  ✓ Synced to website${NC}"
    else
        echo -e "${RED}  ✗ Failed: $response${NC}"
    fi
    echo ""
}

# Function to remove ban from website (when unbanned)
remove_ban() {
    local steamid="$1"
    local player="$2"
    
    echo -e "${CYAN}[UNBAN DETECTED]${NC}"
    echo "  Player: $player"
    echo "  SteamID: $steamid"
    
    response=$(curl -s -X DELETE "$WEBSITE_URL/api/bans/webhook/$steamid?secret=$SECRET")
    
    if echo "$response" | grep -q "message"; then
        echo -e "${GREEN}  ✓ Removed from website${NC}"
    else
        echo -e "${YELLOW}  Note: $response${NC}"
    fi
    echo ""
}

# Check if log directory exists
if [ ! -d "$LOG_DIR" ]; then
    echo -e "${RED}Error: Log directory not found: $LOG_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}Watching for ban events in BAN_HISTORY logs...${NC}"
echo "(Press Ctrl+C to stop)"
echo ""

# Watch BAN_HISTORY log files
tail -F "$LOG_DIR"/BAN_HISTORY_*.log 2>/dev/null | while read line; do
    
    # Check for new ban
    if echo "$line" | grep -q "banned.*||.*Reason:.*||.*Ban Length:"; then
        
        # Extract admin name
        admin=$(echo "$line" | sed -n 's/.*: \([^<]*\) <[^>]*> banned.*/\1/p' | xargs)
        
        # Extract player name
        player=$(echo "$line" | sed -n 's/.*banned \([^<]*\) <.*/\1/p' | xargs)
        
        # Extract player steamid
        steamid=$(echo "$line" | sed -n 's/.*banned [^<]* <\([^>]*\)>.*/\1/p')
        
        # Extract reason
        reason=$(echo "$line" | sed -n 's/.*Reason: "\([^"]*\)".*/\1/p')
        
        # Extract duration
        duration=$(echo "$line" | sed -n 's/.*Ban Length: \(.*\)/\1/p')
        
        # If we got all the data, send it
        if [ -n "$player" ] && [ -n "$steamid" ]; then
            # Default values if empty
            [ -z "$reason" ] && reason="Banned"
            [ -z "$admin" ] && admin="Server"
            [ -z "$duration" ] && duration="Permanent"
            
            send_ban "$player" "$steamid" "$reason" "$admin" "$duration"
        fi
    fi
    
    # Check for unban
    if echo "$line" | grep -q "unbanned"; then
        player=$(echo "$line" | sed -n 's/.*unbanned \([^<]*\) <.*/\1/p' | xargs)
        steamid=$(echo "$line" | sed -n 's/.*unbanned [^<]* <\([^>]*\)>.*/\1/p')
        
        if [ -n "$steamid" ]; then
            remove_ban "$steamid" "$player"
        fi
    fi
    
    # Check for ban expiry
    if echo "$line" | grep -q "Ban time is up"; then
        player=$(echo "$line" | sed -n 's/.*Ban time is up for: \([^[]*\) \[.*/\1/p' | xargs)
        steamid=$(echo "$line" | sed -n 's/.*\[\([^\]]*\)\].*/\1/p')
        
        if [ -n "$steamid" ]; then
            remove_ban "$steamid" "$player"
        fi
    fi
    
done
