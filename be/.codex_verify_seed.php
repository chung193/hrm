<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
echo json_encode([
  'users' => App\Models\User::count(),
  'user_details' => App\Models\UserDetail::count(),
  'per_department' => App\Models\UserDetail::query()->selectRaw('department_id, count(*) as total')->groupBy('department_id')->orderBy('department_id')->get()->map(fn($r) => ['department_id' => $r->department_id, 'total' => $r->total])->all(),
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
