<?php

namespace App\Repositories\AssetAudit\Contracts;

use App\Repositories\Base\Contracts\QueryableRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface AssetAuditRepositoryInterface extends QueryableRepositoryInterface
{
    public function getAssetAudits(): Collection;

    public function getActiveAssetAudits(): Collection;

    public function bulkDelete(array $ids): int;
}
