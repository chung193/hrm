<?php

namespace App\Repositories\AssetAudit\Concretes;

use App\Models\AssetAudit;
use App\Repositories\AssetAudit\Contracts\AssetAuditRepositoryInterface;
use App\Repositories\Base\Concretes\QueryableRepository;
use Illuminate\Database\Eloquent\Collection;
use Spatie\QueryBuilder\AllowedFilter;

class AssetAuditRepository extends QueryableRepository implements AssetAuditRepositoryInterface
{
    protected function model(): string
    {
        return AssetAudit::class;
    }

    public function getAssetAudits(): Collection
    {
        return $this->getFiltered();
    }

    public function getActiveAssetAudits(): Collection
    {
        return $this->model->whereIn('status', ['planned', 'in_progress'])->get();
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
            AllowedFilter::exact('department_id'),
            'status',
        ];
    }

    public function getAllowedSorts(): array
    {
        return ['id', 'audited_at', 'status', 'created_at', 'updated_at'];
    }

    public function getAllowedIncludes(): array
    {
        return ['department', 'auditedBy', 'items', 'items.asset'];
    }
}
