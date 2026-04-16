<?php

namespace App\Services\Contracts;

use App\Services\Base\Contracts\BaseServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface EmployeeContractServiceInterface extends BaseServiceInterface
{
    public function getEmployeeContracts(): Collection;

    public function getAllEmployeeContracts(): Collection;

    public function getFilteredEmployeeContracts(?Request $request = null, int $perPage = 15): LengthAwarePaginator;

    public function getEmployeeContractById(int $id): ?Model;

    public function createEmployeeContract(array $data): Model;

    public function updateEmployeeContract(int $id, array $data): Model;

    public function deleteEmployeeContract(int $id): bool;

    public function deleteEmployeeContracts(array $ids): int;

    public function getActiveEmployeeContracts(): Collection;
}

