<?php

namespace App\Repositories\Organization\Concretes;

use App\Models\Organization;
use App\Repositories\Base\Concretes\QueryableRepository;
use App\Repositories\Organization\Contracts\OrganizationRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Spatie\QueryBuilder\AllowedFilter;

class OrganizationRepository extends QueryableRepository implements OrganizationRepositoryInterface
{
    protected function model(): string
    {
        return Organization::class;
    }

    public function getOrganizations(): Collection
    {
        return $this->getFiltered();
    }

    public function getActiveOrganizations(): Collection
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
            'code',
            'name',
            'is_active',
        ];
    }

    public function getAllowedSorts(): array
    {
        return ['id', 'code', 'name', 'is_active', 'created_at', 'updated_at'];
    }

    public function getAllowedIncludes(): array
    {
        return ['departments'];
    }

    public function getAllowedFields(): array
    {
        return ['id', 'code', 'name', 'is_active', 'created_at', 'updated_at'];
    }
}

