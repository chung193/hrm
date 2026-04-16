<?php

namespace App\Repositories\EmployeeContract\Contracts;

use App\Repositories\Base\Contracts\QueryableRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface EmployeeContractRepositoryInterface extends QueryableRepositoryInterface
{
    public function getEmployeeContracts(): Collection;

    public function getActiveEmployeeContracts(): Collection;

    public function bulkDelete(array $ids): int;
}

