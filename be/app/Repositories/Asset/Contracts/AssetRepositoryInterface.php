<?php

namespace App\Repositories\Asset\Contracts;

use App\Repositories\Base\Contracts\QueryableRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface AssetRepositoryInterface extends QueryableRepositoryInterface
{
    public function getAssets(): Collection;

    public function getActiveAssets(): Collection;

    public function bulkDelete(array $ids): int;
}
