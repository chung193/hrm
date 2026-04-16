<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
echo json_encode([
  'organizations' => App\Models\Organization::count(),
  'departments' => App\Models\Department::count(),
  'titles' => App\Models\DepartmentTitle::count(),
  'users' => App\Models\User::count(),
], JSON_UNESCAPED_SLASHES);
