<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$assets = App\Models\Asset::query()->get(['id', 'qr_code', 'asset_code'])->map(fn($asset) => [
    'id' => $asset->id,
    'value' => $asset->qr_code ?: $asset->asset_code,
])->values();
file_put_contents(__DIR__ . '/.codex_asset_qr_values.json', $assets->toJson(JSON_PRETTY_PRINT));
