<?php

namespace App\Services\Contracts;

use App\Services\Base\Contracts\BaseServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface ContractTypeServiceInterface extends BaseServiceInterface
{
    public function getContractTypes(): Collection;

    public function getAllContractTypes(): Collection;

    public function getFilteredContractTypes(?Request $request = null, int $perPage = 15): LengthAwarePaginator;

    public function getContractTypeById(int $id): ?Model;

    public function createContractType(array $data): Model;

    public function updateContractType(int $id, array $data): Model;

    public function deleteContractType(int $id): bool;

    public function deleteContractTypes(array $ids): int;

    public function getActiveContractTypes(): Collection;
}

