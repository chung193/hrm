<?php

namespace App\Services\Contracts;

use App\Services\Base\Contracts\BaseServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface AssetServiceInterface extends BaseServiceInterface
{
    public function getAssets(): Collection;

    public function getAllAssets(): Collection;

    public function getFilteredAssets(?Request $request = null, int $perPage = 15): LengthAwarePaginator;

    public function getExportAssets(?Request $request = null): Collection;

    public function getAssetById(int $id): ?Model;

    public function createAsset(array $data): Model;

    public function updateAsset(int $id, array $data): Model;

    public function deleteAsset(int $id): bool;

    public function deleteAssets(array $ids): int;

    public function getActiveAssets(): Collection;

    public function reorderAssetGallery(int $id, array $mediaIds): Model;

    public function setPrimaryAssetImage(int $id, int $mediaId): Model;
}
