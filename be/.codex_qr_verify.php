<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo json_encode([
    'assets_total' => App\Models\Asset::count(),
    'assets_with_qr_image' => App\Models\Asset::whereNotNull('qr_image')->count(),
], JSON_PRETTY_PRINT);
