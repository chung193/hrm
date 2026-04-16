<?php

namespace App\Repositories\AssetMaintenance\Contracts;

use App\Repositories\Base\Contracts\QueryableRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface AssetMaintenanceRepositoryInterface extends QueryableRepositoryInterface
{
    public function getAssetMaintenances(): Collection;

    public function getActiveAssetMaintenances(): Collection;

    public function bulkDelete(array $ids): int;
}
