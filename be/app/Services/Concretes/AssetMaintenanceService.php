<?php

namespace App\Services\Concretes;

use App\Models\Asset;
use App\Repositories\Asset\Contracts\AssetRepositoryInterface;
use App\Repositories\AssetMaintenance\Contracts\AssetMaintenanceRepositoryInterface;
use App\Services\Base\Concretes\BaseService;
use App\Services\Concerns\ResolvesOrganizationScope;
use App\Services\Contracts\AssetMaintenanceServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class AssetMaintenanceService extends BaseService implements AssetMaintenanceServiceInterface
{
    use ResolvesOrganizationScope;

    public function __construct(
        protected AssetMaintenanceRepositoryInterface $assetMaintenanceRepository,
        protected AssetRepositoryInterface $assetRepository
    ) {
        $this->setRepository($assetMaintenanceRepository);
    }

    public function getAssetMaintenances(): Collection
    {
        return $this->repository->getFiltered();
    }

    public function getAllAssetMaintenances(): Collection
    {
        $query = $this->assetMaintenanceRepository->query()->with(['asset']);
        if ($organizationId = $this->resolveOrganizationIdFromAuth()) {
            $query->where('organization_id', $organizationId);
        }

        return $query->get();
    }

    public function getFilteredAssetMaintenances(?Request $request = null, int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->assetMaintenanceRepository->query()->with(['asset']);
        if ($organizationId = $this->resolveOrganizationIdFromAuth()) {
            $query->where('organization_id', $organizationId);
        }

        $keyword = $request?->get('keyword', request('keyword'));
        $status = $request?->get('status', request('status'));
        $type = $request?->get('type', request('type'));
        if ($keyword) {
            $query->where(function ($q) use ($keyword) {
                $q->where('title', 'like', "%{$keyword}%")
                    ->orWhere('vendor_name', 'like', "%{$keyword}%")
                    ->orWhereHas('asset', fn ($assetQuery) => $assetQuery
                        ->where('asset_code', 'like', "%{$keyword}%")
                        ->orWhere('name', 'like', "%{$keyword}%"));
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($type) {
            $query->where('type', $type);
        }

        return $query->paginate(request('per_page', $perPage), ['*']);
    }

    public function getAssetMaintenanceById(int $id): ?Model
    {
        $query = $this->assetMaintenanceRepository->query()->with(['asset']);
        if ($organizationId = $this->resolveOrganizationIdFromAuth()) {
            $query->where('organization_id', $organizationId);
        }

        return $query->findOrFail($id);
    }

    public function createAssetMaintenance(array $data): Model
    {
        return DB::transaction(function () use ($data) {
            $organizationId = $this->resolveOrganizationIdFromAuth();
            if ($organizationId) {
                $data['organization_id'] = $organizationId;
            }

            $maintenance = $this->repository->create($data);
            $asset = $this->findAssetInScope((int) $maintenance->asset_id, $organizationId);
            $this->syncAssetFromMaintenance($asset, $maintenance);

            return $this->getAssetMaintenanceById($maintenance->id);
        });
    }

    public function updateAssetMaintenance(int $id, array $data): Model
    {
        return DB::transaction(function () use ($id, $data) {
            $maintenance = $this->getAssetMaintenanceById($id);
            $this->repository->update($maintenance->id, $data);
            $maintenance = $this->getAssetMaintenanceById($id);
            $asset = $this->findAssetInScope((int) $maintenance->asset_id, $this->resolveOrganizationIdFromAuth());
            $this->syncAssetFromMaintenance($asset, $maintenance);

            return $maintenance;
        });
    }

    public function deleteAssetMaintenance(int $id): bool
    {
        $this->getAssetMaintenanceById($id);
        return $this->repository->delete($id);
    }

    public function deleteAssetMaintenances(array $ids): int
    {
        $query = $this->assetMaintenanceRepository->query()->whereIn('id', $ids);
        if ($organizationId = $this->resolveOrganizationIdFromAuth()) {
            $query->where('organization_id', $organizationId);
        }

        if ($query->count() !== count($ids)) {
            throw new ModelNotFoundException('Asset maintenances not found');
        }

        return $this->assetMaintenanceRepository->bulkDelete($ids);
    }

    public function getActiveAssetMaintenances(): Collection
    {
        $query = $this->assetMaintenanceRepository->query()->whereIn('status', ['scheduled', 'in_progress']);
        if ($organizationId = $this->resolveOrganizationIdFromAuth()) {
            $query->where('organization_id', $organizationId);
        }

        return $query->get();
    }

    private function findAssetInScope(int $assetId, ?int $organizationId): Asset
    {
        return $this->assetRepository->query()
            ->when($organizationId, fn ($query) => $query->where('organization_id', $organizationId))
            ->findOrFail($assetId);
    }

    private function syncAssetFromMaintenance(Asset $asset, Model $maintenance): void
    {
        if ($maintenance->status === 'in_progress') {
            $asset->update([
                'maintenance_status' => 'in_progress',
                'location_status' => 'maintenance',
            ]);

            return;
        }

        if ($maintenance->status === 'completed') {
            $asset->update([
                'maintenance_status' => 'completed',
                'location_status' => $asset->current_user_id ? 'in_use' : 'storage',
            ]);

            return;
        }

        $asset->update([
            'maintenance_status' => $maintenance->status === 'scheduled' ? 'scheduled' : 'normal',
        ]);
    }
}
