<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\AssetAssignmentReturnRequest;
use App\Http\Requests\Api\V1\AssetAssignmentStoreRequest;
use App\Http\Requests\Api\V1\AssetAssignmentUpdateRequest;
use App\Http\Resources\Api\AssetAssignment\AssetAssignmentResource;
use App\Services\Contracts\AssetAssignmentServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssetAssignmentController extends BaseApiController
{
    public function __construct(protected readonly AssetAssignmentServiceInterface $assetAssignmentService) {}

    public function index(): JsonResponse
    {
        return $this->successResponse(AssetAssignmentResource::collection($this->assetAssignmentService->getFilteredAssetAssignments(request())));
    }

    public function all(): JsonResponse
    {
        return $this->successResponse(AssetAssignmentResource::collection($this->assetAssignmentService->getAllAssetAssignments()));
    }

    public function active(): JsonResponse
    {
        return $this->successResponse(AssetAssignmentResource::collection($this->assetAssignmentService->getActiveAssetAssignments()));
    }

    public function show(int $asset_assignment): JsonResponse
    {
        return $this->successResponse(new AssetAssignmentResource($this->assetAssignmentService->getAssetAssignmentById($asset_assignment)));
    }

    public function store(AssetAssignmentStoreRequest $request): JsonResponse
    {
        return $this->createdResponse(new AssetAssignmentResource($this->assetAssignmentService->createAssetAssignment($request->validated())));
    }

    public function update(AssetAssignmentUpdateRequest $request, int $asset_assignment): JsonResponse
    {
        return $this->successResponse(new AssetAssignmentResource($this->assetAssignmentService->updateAssetAssignment($asset_assignment, $request->validated())));
    }

    public function returnAsset(AssetAssignmentReturnRequest $request, int $asset_assignment): JsonResponse
    {
        return $this->successResponse(new AssetAssignmentResource($this->assetAssignmentService->returnAssetAssignment($asset_assignment, $request->validated())));
    }

    public function requestRecall(Request $request, int $asset_assignment): JsonResponse
    {
        $validated = $request->validate([
            'recall_note' => ['nullable', 'string', 'max:1000'],
        ]);

        return $this->successResponse(new AssetAssignmentResource($this->assetAssignmentService->requestRecall($asset_assignment, $validated)));
    }

    public function destroy(int $asset_assignment): JsonResponse
    {
        $this->assetAssignmentService->deleteAssetAssignment($asset_assignment);
        return $this->successResponse(['message' => 'Asset assignment deleted successfully']);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:asset_assignments,id',
        ]);

        $count = $this->assetAssignmentService->deleteAssetAssignments($validated['ids']);
        return $this->successResponse(['message' => "Deleted {$count} asset assignments successfully"]);
    }
}
