<?php

namespace App\Services\Contracts;

use App\Services\Base\Contracts\BaseServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface AssetAuditServiceInterface extends BaseServiceInterface
{
    public function getAssetAudits(): Collection;

    public function getAllAssetAudits(): Collection;

    public function getFilteredAssetAudits(?Request $request = null, int $perPage = 15): LengthAwarePaginator;

    public function getAssetAuditById(int $id): ?Model;

    public function createAssetAudit(array $data): Model;

    public function updateAssetAudit(int $id, array $data): Model;

    public function deleteAssetAudit(int $id): bool;

    public function deleteAssetAudits(array $ids): int;

    public function getActiveAssetAudits(): Collection;
}
