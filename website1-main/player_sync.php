<?php
/**
 * Player Stats Sync Script for shadowzm: Zombie reverse
 * 
 * PUT THIS FILE ON YOUR GAME SERVER
 * Run it with: php player_sync.php
 * Or set up a cron job: */5 * * * * php /path/to/player_sync.php
 */

// ============ CONFIGURATION ============
$config = [
    // Your website URL
    'website_url' => 'https://frag-tracker.preview.emergentagent.com',
    
    // Secret key (must match the website)
    'secret' => 'shadowzm-ban-secret-2024',
    
    // Your MySQL database settings (from sql.cfg)
    'mysql_host' => '127.0.0.1',
    'mysql_user' => 'root',
    'mysql_pass' => '',
    'mysql_db'   => 'amx',
    
    // Table name for player stats
    // Common names: csstats, csstats2, stats, players
    'stats_table' => 'csstats'
];

// ============ DO NOT EDIT BELOW ============

echo "=== Player Stats Sync Script ===\n";
echo "Connecting to MySQL...\n";

// Connect to MySQL
$conn = new mysqli(
    $config['mysql_host'],
    $config['mysql_user'],
    $config['mysql_pass'],
    $config['mysql_db']
);

if ($conn->connect_error) {
    die("MySQL Connection failed: " . $conn->connect_error . "\n");
}

echo "Connected to MySQL!\n";

// Get player stats from database
// Adjust column names based on your actual table structure
// Common CSStats structure
$sql = "SELECT 
            name as nickname,
            steamid,
            kills,
            deaths,
            hs as headshots
        FROM {$config['stats_table']} 
        WHERE kills > 0
        ORDER BY kills DESC
        LIMIT 100";

$result = $conn->query($sql);

if (!$result) {
    // Try alternative table structure (StatsX)
    echo "Trying alternative query (StatsX)...\n";
    $sql = "SELECT 
                nick as nickname,
                uniqueid as steamid,
                kills,
                deaths,
                headshots
            FROM {$config['stats_table']}
            WHERE kills > 0
            ORDER BY kills DESC
            LIMIT 100";
    $result = $conn->query($sql);
}

if (!$result) {
    // Try another alternative (csstats2)
    echo "Trying csstats2 query...\n";
    $sql = "SELECT 
                name as nickname,
                authid as steamid,
                frags as kills,
                deaths,
                headshots
            FROM {$config['stats_table']}
            WHERE frags > 0
            ORDER BY frags DESC
            LIMIT 100";
    $result = $conn->query($sql);
}

if (!$result) {
    die("Query failed: " . $conn->error . "\nCheck your stats_table name in config.\n");
}

$players_synced = 0;
$players_skipped = 0;

while ($row = $result->fetch_assoc()) {
    // Prepare player data
    $player_data = [
        'secret' => $config['secret'],
        'nickname' => $row['nickname'] ?: 'Unknown',
        'steamid' => $row['steamid'] ?: '',
        'kills' => (int)($row['kills'] ?? 0),
        'deaths' => (int)($row['deaths'] ?? 0),
        'headshots' => (int)($row['headshots'] ?? 0)
    ];
    
    // Skip if no steamid or no kills
    if (empty($player_data['steamid']) || $player_data['kills'] < 1) {
        $players_skipped++;
        continue;
    }
    
    // Send to website
    $ch = curl_init($config['website_url'] . '/api/players/webhook');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($player_data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code == 200) {
        echo "✓ Synced: {$player_data['nickname']} - {$player_data['kills']} kills\n";
        $players_synced++;
    } else {
        echo "✗ Failed: {$player_data['nickname']} - HTTP $http_code\n";
    }
}

$conn->close();

echo "\n=== Sync Complete ===\n";
echo "Synced: $players_synced\n";
echo "Skipped: $players_skipped\n";
?>
