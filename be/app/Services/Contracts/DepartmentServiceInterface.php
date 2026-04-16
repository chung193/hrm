<?php

namespace App\Services\Contracts;

use App\Services\Base\Contracts\BaseServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface DepartmentServiceInterface extends BaseServiceInterface
{
    public function getDepartments(): Collection;

    public function getAllDepartments(): Collection;

    public function getFilteredDepartments(?Request $request = null, int $perPage = 15): LengthAwarePaginator;

    public function getDepartmentById(int $id): ?Model;

    public function createDepartment(array $data): Model;

    public function updateDepartment(int $id, array $data): Model;

    public function deleteDepartment(int $id): bool;

    public function deleteDepartments(array $ids): int;

    public function getActiveDepartments(): Collection;
}

