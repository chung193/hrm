<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\RecruitmentRequestStatusUpdateRequest;
use App\Http\Requests\Api\V1\RecruitmentRequestStoreRequest;
use App\Http\Requests\Api\V1\RecruitmentRequestUpdateRequest;
use App\Http\Resources\Api\Recruitment\RecruitmentRequestResource;
use App\Services\Contracts\RecruitmentRequestServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecruitmentRequestController extends BaseApiController
{
    public function __construct(
        protected readonly RecruitmentRequestServiceInterface $recruitmentRequestService
    ) {}

    public function index(): JsonResponse
    {
        $items = $this->recruitmentRequestService->getFilteredRecruitmentRequests(request());
        return $this->successResponse(RecruitmentRequestResource::collection($items));
    }

    public function all(): JsonResponse
    {
        $items = $this->recruitmentRequestService->getAllRecruitmentRequests();
        return $this->successResponse(RecruitmentRequestResource::collection($items));
    }

    public function active(): JsonResponse
    {
        $items = $this->recruitmentRequestService->getActiveRecruitmentRequests();
        return $this->successResponse(RecruitmentRequestResource::collection($items));
    }

    public function show(int $id): JsonResponse
    {
        $item = $this->recruitmentRequestService->getRecruitmentRequestById($id);
        return $this->successResponse(new RecruitmentRequestResource($item));
    }

    public function store(RecruitmentRequestStoreRequest $request): JsonResponse
    {
        $item = $this->recruitmentRequestService->createRecruitmentRequest($request->validated());
        return $this->createdResponse(new RecruitmentRequestResource($item));
    }

    public function update(RecruitmentRequestUpdateRequest $request, int $id): JsonResponse
    {
        $item = $this->recruitmentRequestService->updateRecruitmentRequest($id, $request->validated());
        return $this->successResponse(new RecruitmentRequestResource($item));
    }

    public function receive(int $id): JsonResponse
    {
        $item = $this->recruitmentRequestService->markAsReceived($id);
        return $this->successResponse(new RecruitmentRequestResource($item));
    }

    public function updateStatus(RecruitmentRequestStatusUpdateRequest $request, int $id): JsonResponse
    {
        $item = $this->recruitmentRequestService->updateRecruitmentStatus($id, $request->validated());
        return $this->successResponse(new RecruitmentRequestResource($item));
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->recruitmentRequestService->deleteRecruitmentRequest($id);

        if ($deleted) {
            return $this->successResponse(['message' => 'Recruitment request deleted successfully']);
        }

        return $this->errorMessage('Error deleting recruitment request', 500);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:recruitment_requests,id',
        ]);

        $count = $this->recruitmentRequestService->deleteRecruitmentRequests($validated['ids']);

        return $this->successResponse([
            'message' => "Deleted {$count} recruitment requests successfully",
        ]);
    }
}

