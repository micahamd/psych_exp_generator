<?php
/**
 * PEG Results Server Save Script
 * 
 * This script receives JSON experiment data from the Psychology Experiment Generator
 * and saves it to the server filesystem.
 * 
 * Expected endpoint: /experiments/save_peg_results.php
 * Method: POST
 * Content-Type: application/json
 * 
 * Response format:
 * {
 *   "status": "success|error",
 *   "message": "Description of result",
 *   "filename": "saved_filename.json" (on success)
 * }
 */

// Set CORS headers to allow cross-origin requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Method not allowed. Only POST requests are accepted.'
    ]);
    exit();
}

// Get the raw POST data
$input = file_get_contents('php://input');

// Validate that we received data
if (empty($input)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'No data received.'
    ]);
    exit();
}

// Decode JSON data
$data = json_decode($input, true);

// Check for JSON decode errors
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid JSON data: ' . json_last_error_msg()
    ]);
    exit();
}

// Validate required fields
$required_fields = ['experimentId', 'timestamp', 'trials'];
foreach ($required_fields as $field) {
    if (!isset($data[$field])) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => "Missing required field: $field"
        ]);
        exit();
    }
}

// Validate experiment ID format
if (!preg_match('/^exp_[a-zA-Z0-9]+$/', $data['experimentId'])) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid experiment ID format.'
    ]);
    exit();
}

// Validate that trials is an array
if (!is_array($data['trials'])) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Trials data must be an array.'
    ]);
    exit();
}

// Create results directory if it doesn't exist
$upload_dir = '../experiment_results/';
if (!is_dir($upload_dir)) {
    if (!mkdir($upload_dir, 0755, true)) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to create results directory.'
        ]);
        exit();
    }
}

// Generate filename with timestamp and experiment ID
$timestamp = date('Ymd_His');
$experiment_id = preg_replace('/[^a-zA-Z0-9_]/', '', $data['experimentId']);
$filename = "experiment_data_{$timestamp}_{$experiment_id}.json";
$filepath = $upload_dir . $filename;

// Ensure filename is unique (in case of simultaneous requests)
$counter = 1;
$base_filepath = $filepath;
while (file_exists($filepath)) {
    $filepath = str_replace('.json', "_{$counter}.json", $base_filepath);
    $counter++;
}

// Add server-side metadata
$data['serverTimestamp'] = date('c'); // ISO 8601 format
$data['serverInfo'] = [
    'php_version' => PHP_VERSION,
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown'
];

// Convert data back to JSON with pretty formatting
$json_output = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

// Check for JSON encode errors
if ($json_output === false) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to encode data as JSON: ' . json_last_error_msg()
    ]);
    exit();
}

// Write file to disk
if (file_put_contents($filepath, $json_output) === false) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to save data to file.'
    ]);
    exit();
}

// Log successful save (optional - uncomment if logging is desired)
// error_log("PEG: Successfully saved experiment data to $filepath");

// Return success response
http_response_code(200);
echo json_encode([
    'status' => 'success',
    'message' => 'Experiment data saved successfully.',
    'filename' => basename($filepath),
    'timestamp' => date('c'),
    'trials_count' => count($data['trials'])
]);

?>
