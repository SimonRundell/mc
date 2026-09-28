<?php
/**
 * Shared CORS handler, included first by every endpoint in this API.
 *
 * Reflects the request Origin back when it is localhost on any port, so the
 * Vite dev server is accepted regardless of which port it happens to be
 * running on. Also answers OPTIONS preflight requests directly.
 */

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (preg_match('/^https?:\/\/localhost(:\d+)?$/', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
