<?php

namespace App\Services\Concretes;

use App\Models\Asset;
use App\Models\AssetAudit;
use App\Repositories\AssetAudit\Contracts\AssetAuditRepositoryInterface;
use App\Repositories\Asset\Contracts\AssetRepositoryInterface;
use App\Services\Base\Concretes\BaseService;
use App\Services\Concerns\ResolvesOrganizationScope;
use App\Services\Contracts\AssetAuditServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AssetAuditService extends BaseService implements AssetAuditServiceInterface
{
    use ResolvesOrganizationScope;

    public function __construct(
        protected AssetAuditRepositoryInterface $assetAuditRepository,
        protected AssetRepositoryInterface $assetRepository
    ) {
        $this->setRepository($assetAuditRepository);
    }

    public function getAssetAudits(): Collection
    {
        return $this->repository->getFiltered();
    }

    public function getAllAssetAudits(): Collection
    {
        $query = $this->assetAuditRepository->query()->with(['department', 'auditedBy', 'items.asset']);
        if ($organizationId = $this->resolveOrganizationIdFromAuth()) {
            $query->where('organization_id', $organizationId);
        }

        return $query->get();
    }

    public function getFilteredAssetAudits(?Request $request = null, int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->assetAuditRepository->query()->with(['department', 'auditedBy', 'items.asset']);
        if ($organizationId = $this->resolveOrganizationIdFromAuth()) {
            $query->where('organization_id', $organizationId);
        }

        $status = $request?->get('status', request('status'));
        $mismatchOnly = $request?->get('mismatch_only', request('mismatch_only'));

        if ($status) {
            $query->where('status', $status);
        }

        if ($mismatchOnly !== null && $mismatchOnly !== '') {
            $enabled = filter_var($mismatchOnly, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? ((string) $mismatchOnly === '1');
            if ($enabled) {
                $query->whereHas('items', fn ($itemQuery) => $itemQuery->where('result_status', 'mismatch'));
            }
        }

        return $query->paginate(request('per_page', $perPage), ['*']);
    }

    public function getAssetAuditById(int $id): ?Model
    {
        $query = $this->assetAuditRepository->query()->with(['department', 'auditedBy', 'items.asset']);
        if ($organizationId = $this->resolveOrganizationIdFromAuth()) {
            $query->where('organization_id', $organizationId);
        }

        return $query->findOrFail($id);
    }

    public function createAssetAudit(array $data): Model
    {
        return DB::transaction(function () use ($data) {
            $organizationId = $this->resolveOrganizationIdFromAuth();
            if ($organizationId) {
                $data['organization_id'] = $organizationId;
            }

            $items = $data['items'] ?? [];
            unset($data['items']);
            $data['audited_by_user_id'] = Auth::id();

            /** @var AssetAudit $audit */
            $audit = $this->repository->create($data);
            $summary = $this->syncAuditItems($audit, $items, $organizationId);
            $audit->update(['summary' => $summary]);

            return $this->getAssetAuditById($audit->id);
        });
    }

    public function updateAssetAudit(int $id, array $data): Model
    {
        return DB::transaction(function () use ($id, $data) {
            /** @var AssetAudit $audit */
            $audit = $this->getAssetAuditById($id);
            $items = $data['items'] ?? null;
            unset($data['items']);

            $this->repository->update($audit->id, $data);
            $audit = $this->getAssetAuditById($id);

            if (is_array($items)) {
                $audit->items()->delete();
                $summary = $this->syncAuditItems($audit, $items, $this->resolveOrganizationIdFromAuth());
                $audit->update(['summary' => $summary]);
            }

            return $this->getAssetAuditById($audit->id);
        });
    }

    public function deleteAssetAudit(int $id): bool
    {
        $this->getAssetAuditById($id);
        return $this->repository->delete($id);
    }

    public function deleteAssetAudits(array $ids): int
    {
        $query = $this->assetAuditRepository->query()->whereIn('id', $ids);
        if ($organizationId = $this->resolveOrganizationIdFromAuth()) {
            $query->where('organization_id', $organizationId);
        }

        if ($query->count() !== count($ids)) {
            throw new ModelNotFoundException('Asset audits not found');
        }

        return $this->assetAuditRepository->bulkDelete($ids);
    }

    public function getActiveAssetAudits(): Collection
    {
        $query = $this->assetAuditRepository->query()->whereIn('status', ['planned', 'in_progress']);
        if ($organizationId = $this->resolveOrganizationIdFromAuth()) {
            $query->where('organization_id', $organizationId);
        }

        return $query->get();
    }

    private function syncAuditItems(AssetAudit $audit, array $items, ?int $organizationId): array
    {
        $summary = [
            'total' => 0,
            'matched' => 0,
            'mismatch' => 0,
            'missing' => 0,
            'found' => 0,
        ];

        foreach ($items as $item) {
            /** @var Asset $asset */
            $asset = $this->assetRepository->query()
                ->when($organizationId, fn ($query) => $query->where('organization_id', $organizationId))
                ->findOrFail((int) $item['asset_id']);

            $expected = $item['expected_location_status'] ?? $asset->location_status;
            $actual = $item['actual_location_status'] ?? $expected;
            $result = $item['result_status'] ?? ($expected === $actual ? 'matched' : 'mismatch');

            $audit->items()->create([
                'asset_id' => $asset->id,
                'expected_location_status' => $expected,
                'actual_location_status' => $actual,
                'result_status' => $result,
                'notes' => $item['notes'] ?? null,
                'metadata' => $item['metadata'] ?? null,
            ]);

            $asset->update([
                'last_audited_at' => $audit->audited_at,
                'location_status' => $actual,
            ]);

            $summary['total']++;
            if (isset($summary[$result])) {
                $summary[$result]++;
            }
        }

        return $summary;
    }
}
