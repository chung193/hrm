<?php

namespace App\Services\Concretes;

use App\Models\Asset;
use App\Models\AssetAssignment;
use App\Models\User;
use App\Repositories\AssetAssignment\Contracts\AssetAssignmentRepositoryInterface;
use App\Repositories\Asset\Contracts\AssetRepositoryInterface;
use App\Services\Base\Concretes\BaseService;
use App\Services\Concerns\ResolvesOrganizationScope;
use App\Services\Contracts\AssetAssignmentServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AssetAssignmentService extends BaseService implements AssetAssignmentServiceInterface
{
    use ResolvesOrganizationScope;

    public function __construct(
        protected AssetAssignmentRepositoryInterface $assetAssignmentRepository,
        protected AssetRepositoryInterface $assetRepository
    ) {
        $this->setRepository($assetAssignmentRepository);
    }

    public function getAssetAssignments(): Collection
    {
        return $this->repository->getFiltered();
    }

    public function getAllAssetAssignments(): Collection
    {
        $query = $this->assetAssignmentRepository->query()->with(['asset', 'user', 'department', 'assignedBy']);
        if ($organizationId = $this->resolveOrganizationIdFromAuth()) {
            $query->where('organization_id', $organizationId);
        }

        return $query->get();
    }

    public function getFilteredAssetAssignments(?Request $request = null, int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->assetAssignmentRepository->query()->with(['asset', 'user', 'department', 'assignedBy']);
        if ($organizationId = $this->resolveOrganizationIdFromAuth()) {
            $query->where('organization_id', $organizationId);
        }

        $keyword = request('keyword');
        if ($keyword) {
            $query->where(function ($q) use ($keyword) {
                $q->whereHas('asset', fn ($assetQuery) => $assetQuery
                    ->where('asset_code', 'like', "%{$keyword}%")
                    ->orWhere('name', 'like', "%{$keyword}%"))
                    ->orWhereHas('user', fn ($userQuery) => $userQuery
                        ->where('name', 'like', "%{$keyword}%")
                        ->orWhere('email', 'like', "%{$keyword}%"));
            });
        }

        return $query->paginate(request('per_page', $perPage), ['*']);
    }

    public function getAssetAssignmentById(int $id): ?Model
    {
        $query = $this->assetAssignmentRepository->query()->with(['asset', 'user', 'department', 'assignedBy']);
        if ($organizationId = $this->resolveOrganizationIdFromAuth()) {
            $query->where('organization_id', $organizationId);
        }

        return $query->findOrFail($id);
    }

    public function createAssetAssignment(array $data): Model
    {
        return DB::transaction(function () use ($data) {
            $organizationId = $this->resolveOrganizationIdFromAuth();
            if ($organizationId) {
                $data['organization_id'] = $organizationId;
            }

            $asset = $this->findAssetInScope((int) $data['asset_id'], $organizationId);
            if ($asset->current_assignment_id && ($data['status'] ?? 'assigned') === 'assigned') {
                throw ValidationException::withMessages([
                    'asset_id' => 'Asset is currently assigned. Return it before reassigning.',
                ]);
            }

            $data['assigned_by_user_id'] = Auth::id();
            $data['status'] = $data['status'] ?? 'assigned';
            $data['assignment_type'] = $data['assignment_type'] ?? 'assignment';

            if (empty($data['department_id']) && !empty($data['user_id'])) {
                $data['department_id'] = optional(optional(User::find($data['user_id']))->detail)->department_id;
            }

            /** @var AssetAssignment $assignment */
            $assignment = $this->repository->create($data);
            $this->syncAssetFromAssignment($asset, $assignment);

            return $this->getAssetAssignmentById($assignment->id);
        });
    }

    public function updateAssetAssignment(int $id, array $data): Model
    {
        return DB::transaction(function () use ($id, $data) {
            /** @var AssetAssignment $assignment */
            $assignment = $this->getAssetAssignmentById($id);
            $this->repository->update($assignment->id, $data);
            $assignment = $this->getAssetAssignmentById($id);
            $asset = $this->findAssetInScope((int) $assignment->asset_id, $this->resolveOrganizationIdFromAuth());
            $this->syncAssetFromAssignment($asset, $assignment);

            return $assignment;
        });
    }

    public function returnAssetAssignment(int $id, array $data): Model
    {
        return DB::transaction(function () use ($id, $data) {
            /** @var AssetAssignment $assignment */
            $assignment = $this->getAssetAssignmentById($id);
            $payload = array_merge($data, [
                'status' => 'returned',
                'returned_at' => $data['returned_at'] ?? now(),
            ]);

            $this->repository->update($assignment->id, $payload);
            $assignment = $this->getAssetAssignmentById($id);
            $asset = $this->findAssetInScope((int) $assignment->asset_id, $this->resolveOrganizationIdFromAuth());

            $asset->update([
                'current_user_id' => null,
                'current_assignment_id' => null,
                'location_status' => $data['location_status'] ?? 'storage',
                'condition_status' => $data['condition_status'] ?? $asset->condition_status,
            ]);

            return $assignment;
        });
    }

    public function deleteAssetAssignment(int $id): bool
    {
        /** @var AssetAssignment $assignment */
        $assignment = $this->getAssetAssignmentById($id);
        $asset = Asset::find($assignment->asset_id);
        if ($asset && (int) $asset->current_assignment_id === (int) $assignment->id) {
            $asset->update([
                'current_user_id' => null,
                'current_assignment_id' => null,
                'location_status' => 'storage',
            ]);
        }

        return $this->repository->delete($id);
    }

    public function deleteAssetAssignments(array $ids): int
    {
        $query = $this->assetAssignmentRepository->query()->whereIn('id', $ids);
        if ($organizationId = $this->resolveOrganizationIdFromAuth()) {
            $query->where('organization_id', $organizationId);
        }

        if ($query->count() !== count($ids)) {
            throw new ModelNotFoundException('Asset assignments not found');
        }

        return $this->assetAssignmentRepository->bulkDelete($ids);
    }

    public function getActiveAssetAssignments(): Collection
    {
        $query = $this->assetAssignmentRepository->query()->where('status', 'assigned');
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

    private function syncAssetFromAssignment(Asset $asset, AssetAssignment $assignment): void
    {
        if ($assignment->status === 'returned' || $assignment->returned_at) {
            $asset->update([
                'current_user_id' => null,
                'current_assignment_id' => null,
                'location_status' => 'storage',
            ]);

            return;
        }

        $asset->update([
            'current_user_id' => $assignment->user_id,
            'current_assignment_id' => $assignment->id,
            'department_id' => $assignment->department_id ?: $asset->department_id,
            'location_status' => 'in_use',
        ]);
    }
}
