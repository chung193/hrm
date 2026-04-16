<?php

namespace App\Services\Contracts;

use App\Services\Base\Contracts\BaseServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface AssetMaintenanceServiceInterface extends BaseServiceInterface
{
    public function getAssetMaintenances(): Collection;

    public function getAllAssetMaintenances(): Collection;

    public function getFilteredAssetMaintenances(?Request $request = null, int $perPage = 15): LengthAwarePaginator;

    public function getAssetMaintenanceById(int $id): ?Model;

    public function createAssetMaintenance(array $data): Model;

    public function updateAssetMaintenance(int $id, array $data): Model;

    public function deleteAssetMaintenance(int $id): bool;

    public function deleteAssetMaintenances(array $ids): int;

    public function getActiveAssetMaintenances(): Collection;
}
