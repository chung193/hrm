<?php

namespace App\Repositories\Department\Contracts;

use App\Repositories\Base\Contracts\QueryableRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface DepartmentRepositoryInterface extends QueryableRepositoryInterface
{
    public function getDepartments(): Collection;

    public function getActiveDepartments(): Collection;

    public function bulkDelete(array $ids): int;
}

