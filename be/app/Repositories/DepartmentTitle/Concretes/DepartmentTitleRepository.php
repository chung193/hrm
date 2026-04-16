<?php

namespace App\Repositories\DepartmentTitle\Concretes;

use App\Models\DepartmentTitle;
use App\Repositories\Base\Concretes\QueryableRepository;
use App\Repositories\DepartmentTitle\Contracts\DepartmentTitleRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Spatie\QueryBuilder\AllowedFilter;

class DepartmentTitleRepository extends QueryableRepository implements DepartmentTitleRepositoryInterface
{
    protected function model(): string
    {
        return DepartmentTitle::class;
    }

    public function getDepartmentTitles(): Collection
    {
        return $this->getFiltered();
    }

    public function getActiveDepartmentTitles(): Collection
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
            AllowedFilter::exact('department_id'),
            'code',
            'name',
            'is_active',
            AllowedFilter::exact('can_request_recruitment'),
            AllowedFilter::exact('can_approve_leave'),
        ];
    }

    public function getAllowedSorts(): array
    {
        return ['id', 'department_id', 'code', 'name', 'is_active', 'can_request_recruitment', 'can_approve_leave', 'created_at', 'updated_at'];
    }

    public function getAllowedIncludes(): array
    {
        return ['department'];
    }

    public function getAllowedFields(): array
    {
        return ['id', 'department_id', 'code', 'name', 'is_active', 'can_request_recruitment', 'can_approve_leave', 'created_at', 'updated_at'];
    }
}
