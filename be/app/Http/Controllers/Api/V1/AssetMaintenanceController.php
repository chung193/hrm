<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\AssetMaintenanceStoreRequest;
use App\Http\Requests\Api\V1\AssetMaintenanceUpdateRequest;
use App\Http\Resources\Api\AssetMaintenance\AssetMaintenanceResource;
use App\Services\Contracts\AssetMaintenanceServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssetMaintenanceController extends BaseApiController
{
    public function __construct(protected readonly AssetMaintenanceServiceInterface $assetMaintenanceService) {}

    public function index(): JsonResponse
    {
        return $this->successResponse(AssetMaintenanceResource::collection($this->assetMaintenanceService->getFilteredAssetMaintenances(request())));
    }

    public function all(): JsonResponse
    {
        return $this->successResponse(AssetMaintenanceResource::collection($this->assetMaintenanceService->getAllAssetMaintenances()));
    }

    public function active(): JsonResponse
    {
        return $this->successResponse(AssetMaintenanceResource::collection($this->assetMaintenanceService->getActiveAssetMaintenances()));
    }

    public function show(int $asset_maintenance): JsonResponse
    {
        return $this->successResponse(new AssetMaintenanceResource($this->assetMaintenanceService->getAssetMaintenanceById($asset_maintenance)));
    }

    public function store(AssetMaintenanceStoreRequest $request): JsonResponse
    {
        return $this->createdResponse(new AssetMaintenanceResource($this->assetMaintenanceService->createAssetMaintenance($request->validated())));
    }

    public function update(AssetMaintenanceUpdateRequest $request, int $asset_maintenance): JsonResponse
    {
        return $this->successResponse(new AssetMaintenanceResource($this->assetMaintenanceService->updateAssetMaintenance($asset_maintenance, $request->validated())));
    }

    public function destroy(int $asset_maintenance): JsonResponse
    {
        $this->assetMaintenanceService->deleteAssetMaintenance($asset_maintenance);
        return $this->successResponse(['message' => 'Asset maintenance deleted successfully']);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:asset_maintenances,id',
        ]);

        $count = $this->assetMaintenanceService->deleteAssetMaintenances($validated['ids']);
        return $this->successResponse(['message' => "Deleted {$count} asset maintenances successfully"]);
    }
}
