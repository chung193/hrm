<?php

namespace App\Services\Concretes;

use App\Repositories\AssetCategory\Contracts\AssetCategoryRepositoryInterface;
use App\Services\Base\Concretes\BaseService;
use App\Services\Concerns\ResolvesOrganizationScope;
use App\Services\Contracts\AssetCategoryServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class AssetCategoryService extends BaseService implements AssetCategoryServiceInterface
{
    use ResolvesOrganizationScope;

    public function __construct(protected AssetCategoryRepositoryInterface $assetCategoryRepository)
    {
        $this->setRepository($assetCategoryRepository);
    }

    public function getAssetCategories(): Collection
    {
        return $this->repository->getFiltered();
    }

    public function getAllAssetCategories(): Collection
    {
        $query = $this->assetCategoryRepository->query()->with(['organization', 'parent']);
        if ($organizationId = $this->resolveOrganizationIdFromAuth()) {
            $query->where('organization_id', $organizationId);
        }

        return $query->get();
    }

    public function getFilteredAssetCategories(?Request $request = null, int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->assetCategoryRepository->query()->with(['organization', 'parent']);
        if ($organizationId = $this->resolveOrganizationIdFromAuth()) {
            $query->where('organization_id', $organizationId);
        }

        $keyword = request('keyword');
        if ($keyword) {
            $query->where(function ($q) use ($keyword) {
                $q->where('code', 'like', "%{$keyword}%")
                    ->orWhere('name', 'like', "%{$keyword}%");
            });
        }

        return $query->paginate(request('per_page', $perPage), ['*']);
    }

    public function getAssetCategoryById(int $id): ?Model
    {
        $query = $this->assetCategoryRepository->query()->with(['organization', 'parent', 'children']);
        if ($organizationId = $this->resolveOrganizationIdFromAuth()) {
            $query->where('organization_id', $organizationId);
        }

        return $query->findOrFail($id);
    }

    public function createAssetCategory(array $data): Model
    {
        if ($organizationId = $this->resolveOrganizationIdFromAuth()) {
            $data['organization_id'] = $organizationId;
        }

        return $this->repository->create($data);
    }

    public function updateAssetCategory(int $id, array $data): Model
    {
        $category = $this->getAssetCategoryById($id);
        if ($organizationId = $this->resolveOrganizationIdFromAuth()) {
            $data['organization_id'] = $organizationId;
        }

        $this->repository->update($category->id, $data);
        return $this->getAssetCategoryById($id);
    }

    public function deleteAssetCategory(int $id): bool
    {
        $this->getAssetCategoryById($id);
        return $this->repository->delete($id);
    }

    public function deleteAssetCategories(array $ids): int
    {
        $query = $this->assetCategoryRepository->query()->whereIn('id', $ids);
        if ($organizationId = $this->resolveOrganizationIdFromAuth()) {
            $query->where('organization_id', $organizationId);
        }

        if ($query->count() !== count($ids)) {
            throw new ModelNotFoundException('Asset categories not found');
        }

        return $this->assetCategoryRepository->bulkDelete($ids);
    }

    public function getActiveAssetCategories(): Collection
    {
        $query = $this->assetCategoryRepository->query()->where('is_active', true);
        if ($organizationId = $this->resolveOrganizationIdFromAuth()) {
            $query->where('organization_id', $organizationId);
        }

        return $query->get();
    }
}
