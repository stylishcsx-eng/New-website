<?php
/**
 * Ban Sync Script for shadowzm: Zombie reverse
 * 
 * PUT THIS FILE ON YOUR GAME SERVER
 * Run it with: php ban_sync.php
 * Or set up a cron job: */5 * * * * php /path/to/ban_sync.php
 */

// ============ CONFIGURATION ============
$config = [
    // Your website URL
    'website_url' => 'https://cs-server-sync.preview.emergentagent.com',
    
    // Secret key (must match the website)
    'secret' => 'shadowzm-ban-secret-2024',
    
    // Your MySQL database settings (from sql.cfg)
    'mysql_host' => '127.0.0.1',
    'mysql_user' => 'root',
    'mysql_pass' => '',
    'mysql_db'   => 'amx',
    
    // Table name for bans (check your database)
    // Common names: amx_bans, bans, amxbans
    'bans_table' => 'amx_bans'
];

// ============ DO NOT EDIT BELOW ============

echo "=== Ban Sync Script ===\n";
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

// Get bans from database
// Adjust column names based on your actual table structure
$sql = "SELECT 
            player_nick as nickname,
            player_id as steamid,
            ban_reason as reason,
            admin_nick as admin_name,
            ban_length as duration,
            ban_created as created
        FROM {$config['bans_table']} 
        WHERE (expired = 0 OR ban_length = 0)
        ORDER BY ban_created DESC";

$result = $conn->query($sql);

if (!$result) {
    // Try alternative table structure (some AMX setups differ)
    echo "Trying alternative query...\n";
    $sql = "SELECT 
                name as nickname,
                authid as steamid,
                reason,
                admin as admin_name,
                length as duration,
                created
            FROM {$config['bans_table']}
            ORDER BY created DESC";
    $result = $conn->query($sql);
}

if (!$result) {
    die("Query failed: " . $conn->error . "\nCheck your bans_table name in config.\n");
}

$bans_synced = 0;
$bans_skipped = 0;

while ($row = $result->fetch_assoc()) {
    // Format duration
    $duration = $row['duration'];
    if ($duration == 0) {
        $duration = 'Permanent';
    } else {
        $duration = $duration . ' min';
    }
    
    // Prepare ban data
    $ban_data = [
        'secret' => $config['secret'],
        'player_nickname' => $row['nickname'] ?: 'Unknown',
        'steamid' => $row['steamid'] ?: '',
        'reason' => $row['reason'] ?: 'No reason',
        'admin_name' => $row['admin_name'] ?: 'Server',
        'duration' => $duration
    ];
    
    // Skip if no steamid
    if (empty($ban_data['steamid'])) {
        $bans_skipped++;
        continue;
    }
    
    // Send to website
    $ch = curl_init($config['website_url'] . '/api/bans/webhook');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($ban_data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code == 200) {
        echo "✓ Synced: {$ban_data['player_nickname']} ({$ban_data['steamid']})\n";
        $bans_synced++;
    } else {
        echo "✗ Failed: {$ban_data['player_nickname']} - HTTP $http_code\n";
    }
}

$conn->close();

echo "\n=== Sync Complete ===\n";
echo "Synced: $bans_synced\n";
echo "Skipped: $bans_skipped\n";
?>
