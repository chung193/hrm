<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$rows = json_decode(file_get_contents(__DIR__ . '/.codex_asset_qr_images.json'), true) ?: [];
foreach ($rows as $row) {
    App\Models\Asset::where('id', $row['id'])->update(['qr_image' => $row['qr_image'] ?? null]);
}
