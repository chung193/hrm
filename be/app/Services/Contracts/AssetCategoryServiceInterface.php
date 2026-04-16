<?php

namespace App\Services\Contracts;

use App\Services\Base\Contracts\BaseServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface AssetCategoryServiceInterface extends BaseServiceInterface
{
    public function getAssetCategories(): Collection;

    public function getAllAssetCategories(): Collection;

    public function getFilteredAssetCategories(?Request $request = null, int $perPage = 15): LengthAwarePaginator;

    public function getAssetCategoryById(int $id): ?Model;

    public function createAssetCategory(array $data): Model;

    public function updateAssetCategory(int $id, array $data): Model;

    public function deleteAssetCategory(int $id): bool;

    public function deleteAssetCategories(array $ids): int;

    public function getActiveAssetCategories(): Collection;
}
