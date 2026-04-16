<?php

namespace App\Repositories\Department\Concretes;

use App\Models\Department;
use App\Repositories\Base\Concretes\QueryableRepository;
use App\Repositories\Department\Contracts\DepartmentRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Spatie\QueryBuilder\AllowedFilter;

class DepartmentRepository extends QueryableRepository implements DepartmentRepositoryInterface
{
    protected function model(): string
    {
        return Department::class;
    }

    public function getDepartments(): Collection
    {
        return $this->getFiltered();
    }

    public function getActiveDepartments(): Collection
    {
        return $this->model->where('is_active', true)->get();
    }

    public function bulkDelete(array $ids): int
    {
        return $this->model->whereIn('id', $ids)->delete();
    }

    public function getAllowedFilters(): array
    {
        return [
            AllowedFilter::exact('id'),
            AllowedFilter::exact('organization_id'),
            'code',
            'name',
            'is_active',
        ];
    }

    public function getAllowedSorts(): array
    {
        return ['id', 'organization_id', 'code', 'name', 'is_active', 'created_at', 'updated_at'];
    }

    public function getAllowedIncludes(): array
    {
        return ['organization', 'titles'];
    }

    public function getAllowedFields(): array
    {
        return ['id', 'organization_id', 'code', 'name', 'is_active', 'created_at', 'updated_at'];
    }
}
