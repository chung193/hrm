<?php

namespace App\Repositories\AssetAssignment\Contracts;

use App\Repositories\Base\Contracts\QueryableRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface AssetAssignmentRepositoryInterface extends QueryableRepositoryInterface
{
    public function getAssetAssignments(): Collection;

    public function getActiveAssetAssignments(): Collection;

    public function bulkDelete(array $ids): int;
}
