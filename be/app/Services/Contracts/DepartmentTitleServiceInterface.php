<?php

namespace App\Services\Contracts;

use App\Services\Base\Contracts\BaseServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

interface DepartmentTitleServiceInterface extends BaseServiceInterface
{
    public function getDepartmentTitles(): Collection;

    public function getAllDepartmentTitles(): Collection;

    public function getFilteredDepartmentTitles(?Request $request = null, int $perPage = 15): LengthAwarePaginator;

    public function getDepartmentTitleById(int $id): ?Model;

    public function createDepartmentTitle(array $data): Model;

    public function updateDepartmentTitle(int $id, array $data): Model;

    public function deleteDepartmentTitle(int $id): bool;

    public function deleteDepartmentTitles(array $ids): int;

    public function getActiveDepartmentTitles(): Collection;
}

