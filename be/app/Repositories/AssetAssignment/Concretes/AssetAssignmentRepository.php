<?php

namespace App\Repositories\AssetAssignment\Concretes;

use App\Models\AssetAssignment;
use App\Repositories\AssetAssignment\Contracts\AssetAssignmentRepositoryInterface;
use App\Repositories\Base\Concretes\QueryableRepository;
use Illuminate\Database\Eloquent\Collection;
use Spatie\QueryBuilder\AllowedFilter;

class AssetAssignmentRepository extends QueryableRepository implements AssetAssignmentRepositoryInterface
{
    protected function model(): string
    {
        return AssetAssignment::class;
    }

    public function getAssetAssignments(): Collection
    {
        return $this->getFiltered();
    }

    public function getActiveAssetAssignments(): Collection
    {
        return $this->model->where('status', 'assigned')->get();
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
            AllowedFilter::exact('asset_id'),
            AllowedFilter::exact('user_id'),
            AllowedFilter::exact('department_id'),
            'assignment_type',
            'status',
        ];
    }

    public function getAllowedSorts(): array
    {
        return ['id', 'assigned_at', 'due_back_at', 'returned_at', 'status', 'created_at', 'updated_at'];
    }

    public function getAllowedIncludes(): array
    {
        return ['asset', 'user', 'department', 'assignedBy'];
    }
}
