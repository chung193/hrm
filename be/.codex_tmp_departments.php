<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
foreach (App\Models\Department::query()->selectRaw('organization_id, count(*) as total')->groupBy('organization_id')->get() as $row) {
    echo $row->organization_id . ':' . $row->total . PHP_EOL;
}
