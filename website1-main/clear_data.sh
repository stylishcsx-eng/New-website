#!/bin/bash
# ============================================
# Clear Dummy Data from MongoDB
# Run this on your VPS to remove test data
# ============================================

echo "=== Clearing dummy data from shadowzm database ==="

# Check if mongosh is available
if command -v mongosh &> /dev/null; then
    MONGO_CMD="mongosh"
elif command -v mongo &> /dev/null; then
    MONGO_CMD="mongo"
else
    echo "Error: MongoDB shell not found. Install with: apt install mongodb-clients"
    echo ""
    echo "Alternative: Run this Python script instead:"
    echo "python3 /home/clear_data.py"
    exit 1
fi

# Clear bans and players collections
$MONGO_CMD shadowzm --eval '
    print("Clearing bans collection...");
    db.bans.deleteMany({});
    print("Bans cleared: " + db.bans.countDocuments({}) + " remaining");
    
    print("Clearing players collection...");
    db.players.deleteMany({});
    print("Players cleared: " + db.players.countDocuments({}) + " remaining");
    
    print("");
    print("=== Done! Dummy data cleared ===");
'

echo ""
echo "Now refresh your website to see empty banlist and rankings."
echo "Then run the sync scripts to populate with real data."
