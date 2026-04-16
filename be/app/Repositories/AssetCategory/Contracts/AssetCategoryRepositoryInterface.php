<?php

namespace App\Repositories\AssetCategory\Contracts;

use App\Repositories\Base\Contracts\QueryableRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface AssetCategoryRepositoryInterface extends QueryableRepositoryInterface
{
    public function getAssetCategories(): Collection;

    public function getActiveAssetCategories(): Collection;

    public function bulkDelete(array $ids): int;
}
