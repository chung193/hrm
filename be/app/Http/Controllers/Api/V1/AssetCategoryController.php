<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\AssetCategoryStoreRequest;
use App\Http\Requests\Api\V1\AssetCategoryUpdateRequest;
use App\Http\Resources\Api\AssetCategory\AssetCategoryResource;
use App\Services\Contracts\AssetCategoryServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssetCategoryController extends BaseApiController
{
    public function __construct(protected readonly AssetCategoryServiceInterface $assetCategoryService) {}

    public function index(): JsonResponse
    {
        return $this->successResponse(AssetCategoryResource::collection($this->assetCategoryService->getFilteredAssetCategories(request())));
    }

    public function all(): JsonResponse
    {
        return $this->successResponse(AssetCategoryResource::collection($this->assetCategoryService->getAllAssetCategories()));
    }

    public function active(): JsonResponse
    {
        return $this->successResponse(AssetCategoryResource::collection($this->assetCategoryService->getActiveAssetCategories()));
    }

    public function show(int $asset_category): JsonResponse
    {
        return $this->successResponse(new AssetCategoryResource($this->assetCategoryService->getAssetCategoryById($asset_category)));
    }

    public function store(AssetCategoryStoreRequest $request): JsonResponse
    {
        return $this->createdResponse(new AssetCategoryResource($this->assetCategoryService->createAssetCategory($request->validated())));
    }

    public function update(AssetCategoryUpdateRequest $request, int $asset_category): JsonResponse
    {
        return $this->successResponse(new AssetCategoryResource($this->assetCategoryService->updateAssetCategory($asset_category, $request->validated())));
    }

    public function destroy(int $asset_category): JsonResponse
    {
        $this->assetCategoryService->deleteAssetCategory($asset_category);
        return $this->successResponse(['message' => 'Asset category deleted successfully']);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:asset_categories,id',
        ]);

        $count = $this->assetCategoryService->deleteAssetCategories($validated['ids']);
        return $this->successResponse(['message' => "Deleted {$count} asset categories successfully"]);
    }
}
