<?php

namespace App\Repositories\Asset\Concretes;

use App\Models\Asset;
use App\Repositories\Asset\Contracts\AssetRepositoryInterface;
use App\Repositories\Base\Concretes\QueryableRepository;
use Illuminate\Database\Eloquent\Collection;
use Spatie\QueryBuilder\AllowedFilter;

class AssetRepository extends QueryableRepository implements AssetRepositoryInterface
{
    protected function model(): string
    {
        return Asset::class;
    }

    public function getAssets(): Collection
    {
        return $this->getFiltered();
    }

    public function getActiveAssets(): Collection
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
            AllowedFilter::exact('category_id'),
            AllowedFilter::exact('department_id'),
            AllowedFilter::exact('current_user_id'),
            AllowedFilter::exact('is_active'),
            'asset_code',
            'qr_code',
            'name',
            'serial_number',
            'condition_status',
            'location_status',
            'maintenance_status',
            'disposal_status',
        ];
    }

    public function getAllowedSorts(): array
    {
        return ['id', 'asset_code', 'name', 'purchase_date', 'purchase_price', 'warranty_end_date', 'created_at', 'updated_at'];
    }

    public function getAllowedIncludes(): array
    {
        return ['organization', 'category', 'department', 'currentUser', 'currentAssignment', 'assignments', 'maintenances'];
    }
}
