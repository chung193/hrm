<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\AssetAuditStoreRequest;
use App\Http\Requests\Api\V1\AssetAuditUpdateRequest;
use App\Http\Resources\Api\AssetAudit\AssetAuditResource;
use App\Services\Contracts\AssetAuditServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssetAuditController extends BaseApiController
{
    public function __construct(protected readonly AssetAuditServiceInterface $assetAuditService) {}

    public function index(): JsonResponse
    {
        return $this->successResponse(AssetAuditResource::collection($this->assetAuditService->getFilteredAssetAudits(request())));
    }

    public function all(): JsonResponse
    {
        return $this->successResponse(AssetAuditResource::collection($this->assetAuditService->getAllAssetAudits()));
    }

    public function active(): JsonResponse
    {
        return $this->successResponse(AssetAuditResource::collection($this->assetAuditService->getActiveAssetAudits()));
    }

    public function show(int $asset_audit): JsonResponse
    {
        return $this->successResponse(new AssetAuditResource($this->assetAuditService->getAssetAuditById($asset_audit)));
    }

    public function store(AssetAuditStoreRequest $request): JsonResponse
    {
        return $this->createdResponse(new AssetAuditResource($this->assetAuditService->createAssetAudit($request->validated())));
    }

    public function update(AssetAuditUpdateRequest $request, int $asset_audit): JsonResponse
    {
        return $this->successResponse(new AssetAuditResource($this->assetAuditService->updateAssetAudit($asset_audit, $request->validated())));
    }

    public function destroy(int $asset_audit): JsonResponse
    {
        $this->assetAuditService->deleteAssetAudit($asset_audit);
        return $this->successResponse(['message' => 'Asset audit deleted successfully']);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:asset_audits,id',
        ]);

        $count = $this->assetAuditService->deleteAssetAudits($validated['ids']);
        return $this->successResponse(['message' => "Deleted {$count} asset audits successfully"]);
    }
}
