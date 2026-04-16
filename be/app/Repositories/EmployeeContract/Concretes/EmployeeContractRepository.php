<?php

namespace App\Repositories\EmployeeContract\Concretes;

use App\Models\EmployeeContract;
use App\Repositories\Base\Concretes\QueryableRepository;
use App\Repositories\EmployeeContract\Contracts\EmployeeContractRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Spatie\QueryBuilder\AllowedFilter;

class EmployeeContractRepository extends QueryableRepository implements EmployeeContractRepositoryInterface
{
    protected function model(): string
    {
        return EmployeeContract::class;
    }

    public function getEmployeeContracts(): Collection
    {
        return $this->getFiltered();
    }

    public function getActiveEmployeeContracts(): Collection
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
            AllowedFilter::exact('user_id'),
            AllowedFilter::exact('contract_type_id'),
            AllowedFilter::exact('status'),
            'contract_no',
            'is_active',
        ];
    }

    public function getAllowedSorts(): array
    {
        return [
            'id',
            'user_id',
            'contract_type_id',
            'contract_no',
            'start_date',
            'end_date',
            'signed_date',
            'status',
            'is_active',
            'created_at',
            'updated_at',
        ];
    }

    public function getAllowedIncludes(): array
    {
        return ['user', 'contractType'];
    }

    public function getAllowedFields(): array
    {
        return [
            'id',
            'user_id',
            'contract_type_id',
            'contract_no',
            'start_date',
            'end_date',
            'signed_date',
            'status',
            'note',
            'is_active',
            'created_at',
            'updated_at',
        ];
    }
}

