<?php

namespace App\Repositories\DepartmentTitle\Contracts;

use App\Repositories\Base\Contracts\QueryableRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface DepartmentTitleRepositoryInterface extends QueryableRepositoryInterface
{
    public function getDepartmentTitles(): Collection;

    public function getActiveDepartmentTitles(): Collection;

    public function bulkDelete(array $ids): int;
}

