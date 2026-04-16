<?php

namespace App\Repositories\ContractType\Concretes;

use App\Models\ContractType;
use App\Repositories\Base\Concretes\QueryableRepository;
use App\Repositories\ContractType\Contracts\ContractTypeRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Spatie\QueryBuilder\AllowedFilter;

class ContractTypeRepository extends QueryableRepository implements ContractTypeRepositoryInterface
{
    protected function model(): string
    {
        return ContractType::class;
    }

    public function getContractTypes(): Collection
    {
        return $this->getFiltered();
    }

    public function getActiveContractTypes(): Collection
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
            AllowedFilter::exact('is_probation'),
            AllowedFilter::exact('is_indefinite'),
            'code',
            'name',
            'duration_months',
            'is_active',
        ];
    }

    public function getAllowedSorts(): array
    {
        return [
            'id',
            'organization_id',
            'code',
            'name',
            'duration_months',
            'is_probation',
            'is_indefinite',
            'is_active',
            'created_at',
            'updated_at',
        ];
    }

    public function getAllowedIncludes(): array
    {
        return ['organization', 'employeeContracts'];
    }

    public function getAllowedFields(): array
    {
        return [
            'id',
            'organization_id',
            'code',
            'name',
            'duration_months',
            'is_probation',
            'is_indefinite',
            'is_active',
            'created_at',
            'updated_at',
        ];
    }
}
