<?php

namespace App\Services\Concretes;

use App\Models\Asset;
use App\Repositories\Asset\Contracts\AssetRepositoryInterface;
use App\Services\Base\Concretes\BaseService;
use App\Services\Concerns\ResolvesOrganizationScope;
use App\Services\Contracts\AssetServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection as SupportCollection;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class AssetService extends BaseService implements AssetServiceInterface
{
    use ResolvesOrganizationScope;

    public function __construct(protected AssetRepositoryInterface $assetRepository)
    {
        $this->setRepository($assetRepository);
    }

    public function getAssets(): Collection
    {
        return $this->repository->getFiltered();
    }

    public function getAllAssets(): Collection
    {
        return $this->buildAssetListQuery()->get();
    }

    public function getFilteredAssets(?Request $request = null, int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->buildAssetListQuery($request);
        return $query->paginate(request('per_page', $perPage), ['*']);
    }

    public function getExportAssets(?Request $request = null): Collection
    {
        return $this->buildAssetListQuery($request)->get();
    }

    public function getAssetById(int $id): ?Model
    {
        $query = $this->assetRepository->query()->with([
            'organization',
            'category',
            'department',
            'currentUser.detail',
            'currentAssignment.user',
            'assignments.user',
            'assignments.assignedBy',
            'maintenances',
        ]);
        if ($organizationId = $this->resolveOrganizationIdFromAuth()) {
            $query->where('organization_id', $organizationId);
        }

        return $query->findOrFail($id);
    }

    public function createAsset(array $data): Model
    {
        if ($organizationId = $this->resolveOrganizationIdFromAuth()) {
            $data['organization_id'] = $organizationId;
        }

        $data['qr_code'] = $data['qr_code'] ?? $data['asset_code'];
        /** @var UploadedFile|null $image */
        $image = $data['image'] ?? null;
        $images = $this->normalizeImages($data['images'] ?? []);
        unset($data['qr_image']);
        unset($data['image']);
        unset($data['images']);

        /** @var Asset $asset */
        $asset = $this->repository->create($data);
        $this->syncAssetImages($asset, $image, $images, true);

        return $this->getAssetById($asset->id);
    }

    public function updateAsset(int $id, array $data): Model
    {
        $asset = $this->getAssetById($id);
        if ($organizationId = $this->resolveOrganizationIdFromAuth()) {
            $data['organization_id'] = $organizationId;
        }

        $data['qr_code'] = $data['qr_code'] ?? $data['asset_code'];
        /** @var UploadedFile|null $image */
        $image = $data['image'] ?? null;
        $images = $this->normalizeImages($data['images'] ?? []);
        unset($data['qr_image']);
        unset($data['image']);
        unset($data['images']);

        $this->repository->update($asset->id, $data);
        $asset = $this->getAssetById($id);
        $this->syncAssetImages($asset, $image, $images, false);

        return $this->getAssetById($id);
    }

    public function deleteAsset(int $id): bool
    {
        $asset = $this->getAssetById($id);
        $asset->clearMediaCollection('images');
        return $this->repository->delete($id);
    }

    public function deleteAssets(array $ids): int
    {
        $query = $this->assetRepository->query()->whereIn('id', $ids);
        if ($organizationId = $this->resolveOrganizationIdFromAuth()) {
            $query->where('organization_id', $organizationId);
        }

        if ($query->count() !== count($ids)) {
            throw new ModelNotFoundException('Assets not found');
        }

        Asset::whereIn('id', $ids)->get()->each(fn (Asset $asset) => $asset->clearMediaCollection('images'));

        return $this->assetRepository->bulkDelete($ids);
    }

    public function getActiveAssets(): Collection
    {
        $query = $this->assetRepository->query()->where('is_active', true);
        if ($organizationId = $this->resolveOrganizationIdFromAuth()) {
            $query->where('organization_id', $organizationId);
        }

        return $query->get();
    }

    public function reorderAssetGallery(int $id, array $mediaIds): Model
    {
        /** @var Asset $asset */
        $asset = $this->getAssetById($id);
        $galleryMedia = $asset->getMedia('images');
        $existingIds = $galleryMedia->pluck('id')->map(fn ($mediaId) => (int) $mediaId)->values()->all();
        $normalizedIds = array_values(array_map('intval', $mediaIds));

        sort($existingIds);
        $comparisonIds = $normalizedIds;
        sort($comparisonIds);

        if ($existingIds !== $comparisonIds) {
            throw new ModelNotFoundException('Asset gallery images not found');
        }

        foreach ($normalizedIds as $index => $mediaId) {
            Media::query()
                ->where('id', $mediaId)
                ->where('model_type', Asset::class)
                ->where('model_id', $asset->id)
                ->where('collection_name', 'images')
                ->update(['order_column' => $index + 1]);
        }

        return $this->getAssetById($id);
    }

    public function setPrimaryAssetImage(int $id, int $mediaId): Model
    {
        /** @var Asset $asset */
        $asset = $this->getAssetById($id);
        $galleryMedia = $asset->getMedia('images')->pluck('id')->map(fn ($item) => (int) $item)->values()->all();

        if (!in_array($mediaId, $galleryMedia, true)) {
            throw new ModelNotFoundException('Asset image not found');
        }

        $orderedIds = array_values(array_filter($galleryMedia, fn ($item) => (int) $item !== $mediaId));
        array_unshift($orderedIds, $mediaId);

        return $this->reorderAssetGallery($id, $orderedIds);
    }

    private function syncAssetImages(Asset $asset, ?UploadedFile $image, array $images = [], bool $replace = false): void
    {
        if ($replace && ($image || !empty($images))) {
            $asset->clearMediaCollection('images');
        }

        if ($image) {
            $asset->addMedia($image)->toMediaCollection('images');
        }

        foreach ($images as $uploadedImage) {
            $asset->addMedia($uploadedImage)->toMediaCollection('images');
        }
    }

    private function normalizeImages(mixed $images): array
    {
        if ($images instanceof SupportCollection) {
            return $images->all();
        }

        return is_array($images) ? array_values(array_filter($images, fn ($image) => $image instanceof UploadedFile)) : [];
    }

    private function buildAssetListQuery(?Request $request = null)
    {
        $keyword = $request?->get('keyword', request('keyword'));
        $categoryId = $request?->get('category_id', request('category_id'));
        $departmentId = $request?->get('department_id', request('department_id'));
        $locationStatus = $request?->get('location_status', request('location_status'));
        $conditionStatus = $request?->get('condition_status', request('condition_status'));
        $isActive = $request?->get('is_active', request('is_active'));
        $sortField = $request?->get('sort_field', request('sort_field'));
        $sortDirection = strtolower((string) ($request?->get('sort_direction', request('sort_direction', 'desc'))));
        $query = $this->assetRepository->query()->with(['organization', 'category', 'department', 'currentUser']);

        if ($organizationId = $this->resolveOrganizationIdFromAuth()) {
            $query->where('organization_id', $organizationId);
        }

        if ($keyword) {
            $query->where(function ($q) use ($keyword) {
                $q->where('asset_code', 'like', "%{$keyword}%")
                    ->orWhere('qr_code', 'like', "%{$keyword}%")
                    ->orWhere('name', 'like', "%{$keyword}%")
                    ->orWhere('serial_number', 'like', "%{$keyword}%")
                    ->orWhere('manufacturer', 'like', "%{$keyword}%");
            });
        }

        if ($categoryId) {
            $query->where('category_id', (int) $categoryId);
        }

        if ($departmentId) {
            $query->where('department_id', (int) $departmentId);
        }

        if ($locationStatus) {
            $query->where('location_status', $locationStatus);
        }

        if ($conditionStatus) {
            $query->where('condition_status', $conditionStatus);
        }

        if ($isActive !== null && $isActive !== '') {
            $query->where('is_active', filter_var($isActive, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? ((string) $isActive === '1'));
        }

        $allowedSortFields = ['purchase_date', 'warranty_end_date'];
        if (in_array($sortField, $allowedSortFields, true)) {
            $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');
        } else {
            $query->latest('created_at');
        }

        return $query;
    }
}
