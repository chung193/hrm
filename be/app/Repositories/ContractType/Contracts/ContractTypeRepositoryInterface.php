<?php

namespace App\Repositories\ContractType\Contracts;

use App\Repositories\Base\Contracts\QueryableRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

interface ContractTypeRepositoryInterface extends QueryableRepositoryInterface
{
    public function getContractTypes(): Collection;

    public function getActiveContractTypes(): Collection;

    public function bulkDelete(array $ids): int;
}

