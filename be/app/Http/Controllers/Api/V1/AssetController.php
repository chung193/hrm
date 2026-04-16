<?php

namespace App\Http\Controllers\Api\V1;

use App\Exports\AssetExport;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\AssetStoreRequest;
use App\Http\Requests\Api\V1\AssetUpdateRequest;
use App\Http\Resources\Api\Asset\AssetResource;
use App\Services\Contracts\AssetServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class AssetController extends BaseApiController
{
    public function __construct(protected readonly AssetServiceInterface $assetService) {}

    public function index(): JsonResponse
    {
        return $this->successResponse(AssetResource::collection($this->assetService->getFilteredAssets(request())));
    }

    public function all(): JsonResponse
    {
        return $this->successResponse(AssetResource::collection($this->assetService->getAllAssets()));
    }

    public function active(): JsonResponse
    {
        return $this->successResponse(AssetResource::collection($this->assetService->getActiveAssets()));
    }

    public function show(int $asset): JsonResponse
    {
        return $this->successResponse(new AssetResource($this->assetService->getAssetById($asset)));
    }

    public function store(AssetStoreRequest $request): JsonResponse
    {
        return $this->createdResponse(new AssetResource($this->assetService->createAsset($request->validated())));
    }

    public function update(AssetUpdateRequest $request, int $asset): JsonResponse
    {
        return $this->successResponse(new AssetResource($this->assetService->updateAsset($asset, $request->validated())));
    }

    public function reorderGallery(Request $request, int $asset): JsonResponse
    {
        $validated = $request->validate([
            'media_ids' => ['required', 'array', 'min:1'],
            'media_ids.*' => ['integer', 'distinct'],
        ]);

        return $this->successResponse(new AssetResource($this->assetService->reorderAssetGallery($asset, $validated['media_ids'])));
    }

    public function setPrimaryImage(Request $request, int $asset): JsonResponse
    {
        $validated = $request->validate([
            'media_id' => ['required', 'integer'],
        ]);

        return $this->successResponse(new AssetResource($this->assetService->setPrimaryAssetImage($asset, (int) $validated['media_id'])));
    }

    public function export(Request $request)
    {
        return Excel::download(new AssetExport($this->assetService->getExportAssets($request)), 'assets.xlsx');
    }

    public function destroy(int $asset): JsonResponse
    {
        $this->assetService->deleteAsset($asset);
        return $this->successResponse(['message' => 'Asset deleted successfully']);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:assets,id',
        ]);

        $count = $this->assetService->deleteAssets($validated['ids']);
        return $this->successResponse(['message' => "Deleted {$count} assets successfully"]);
    }
}
