<?php

namespace App\Repositories\AssetCategory\Concretes;

use App\Models\AssetCategory;
use App\Repositories\AssetCategory\Contracts\AssetCategoryRepositoryInterface;
use App\Repositories\Base\Concretes\QueryableRepository;
use Illuminate\Database\Eloquent\Collection;
use Spatie\QueryBuilder\AllowedFilter;

class AssetCategoryRepository extends QueryableRepository implements AssetCategoryRepositoryInterface
{
    protected function model(): string
    {
        return AssetCategory::class;
    }

    public function getAssetCategories(): Collection
    {
        return $this->getFiltered();
    }

    public function getActiveAssetCategories(): Collection
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
            AllowedFilter::exact('parent_id'),
            'code',
            'name',
            'is_active',
        ];
    }

    public function getAllowedSorts(): array
    {
        return ['id', 'organization_id', 'parent_id', 'code', 'name', 'is_active', 'created_at', 'updated_at'];
    }

    public function getAllowedIncludes(): array
    {
        return ['organization', 'parent', 'children'];
    }
}
