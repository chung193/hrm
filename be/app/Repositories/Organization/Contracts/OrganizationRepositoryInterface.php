<?php

namespace App\Repositories\Organization\Contracts;

use App\Repositories\Base\Contracts\QueryableRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface OrganizationRepositoryInterface extends QueryableRepositoryInterface
{
    public function getOrganizations(): Collection;

    public function getActiveOrganizations(): Collection;

    public function bulkDelete(array $ids): int;
}

