<?php
require_once __DIR__ . '/cors.php';

/**
 * Top-ten high score list, persisted as a flat JSON file (no database for
 * this project). Supports:
 *   GET  -> returns the current top ten, sorted by score descending.
 *   POST -> accepts { name, score, ruleName, turns }, inserts, re-sorts,
 *           trims to ten entries, and persists the result.
 */

const HIGHSCORES_PATH = __DIR__ . '/../data/highscores.json';
const MAX_ENTRIES = 10;
const MAX_NAME_LENGTH = 40;

/**
 * Reads the high score file, returning an empty list if it is missing or
 * corrupt rather than failing the request.
 *
 * @return array{scores: array}
 */
function readHighScores(): array
{
    if (!file_exists(HIGHSCORES_PATH)) {
        return ['scores' => []];
    }

    $raw = file_get_contents(HIGHSCORES_PATH);
    $decoded = json_decode($raw, true);

    if (!is_array($decoded) || !isset($decoded['scores']) || !is_array($decoded['scores'])) {
        return ['scores' => []];
    }

    return $decoded;
}

/**
 * Writes the high score file using an exclusive lock so concurrent
 * submissions can't clobber each other.
 */
function writeHighScores(array $data): void
{
    $handle = fopen(HIGHSCORES_PATH, 'c+');
    if ($handle === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Could not open high score file.']);
        exit();
    }

    flock($handle, LOCK_EX);
    ftruncate($handle, 0);
    rewind($handle);
    fwrite($handle, json_encode($data, JSON_PRETTY_PRINT));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $data = readHighScores();
    $scores = $data['scores'];
    usort($scores, fn($a, $b) => ($b['score'] ?? 0) <=> ($a['score'] ?? 0));

    echo json_encode(['scores' => array_slice($scores, 0, MAX_ENTRIES)]);
    exit();
}

if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);

    if (!is_array($body)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid request body.']);
        exit();
    }

    $name = trim((string)($body['name'] ?? ''));
    $score = $body['score'] ?? null;
    $ruleName = trim((string)($body['ruleName'] ?? ''));
    $turns = $body['turns'] ?? null;

    if ($name === '' || !is_numeric($score) || !is_numeric($turns)) {
        http_response_code(400);
        echo json_encode(['error' => 'name, score and turns are required.']);
        exit();
    }

    $name = substr($name, 0, MAX_NAME_LENGTH);

    $entry = [
        'name' => $name,
        'score' => (int)$score,
        'ruleName' => substr($ruleName, 0, 120),
        'turns' => (int)$turns,
        'achievedAt' => date('c'),
    ];

    $data = readHighScores();
    $data['scores'][] = $entry;
    usort($data['scores'], fn($a, $b) => ($b['score'] ?? 0) <=> ($a['score'] ?? 0));
    $data['scores'] = array_slice($data['scores'], 0, MAX_ENTRIES);

    writeHighScores($data);

    echo json_encode(['scores' => $data['scores']]);
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed.']);
