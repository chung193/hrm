<?php

namespace App\Repositories\AssetMaintenance\Concretes;

use App\Models\AssetMaintenance;
use App\Repositories\AssetMaintenance\Contracts\AssetMaintenanceRepositoryInterface;
use App\Repositories\Base\Concretes\QueryableRepository;
use Illuminate\Database\Eloquent\Collection;
use Spatie\QueryBuilder\AllowedFilter;

class AssetMaintenanceRepository extends QueryableRepository implements AssetMaintenanceRepositoryInterface
{
    protected function model(): string
    {
        return AssetMaintenance::class;
    }

    public function getAssetMaintenances(): Collection
    {
        return $this->getFiltered();
    }

    public function getActiveAssetMaintenances(): Collection
    {
        return $this->model->whereIn('status', ['scheduled', 'in_progress'])->get();
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
            'type',
            'status',
            'vendor_name',
            'title',
        ];
    }

    public function getAllowedSorts(): array
    {
        return ['id', 'scheduled_at', 'completed_at', 'next_maintenance_at', 'cost', 'created_at', 'updated_at'];
    }

    public function getAllowedIncludes(): array
    {
        return ['asset'];
    }
}
