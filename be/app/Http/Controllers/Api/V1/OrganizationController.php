<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\OrganizationStoreRequest;
use App\Http\Requests\Api\V1\OrganizationUpdateRequest;
use App\Http\Resources\Api\Organization\OrganizationResource;
use App\Services\Contracts\OrganizationServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrganizationController extends BaseApiController
{
    public function __construct(
        protected readonly OrganizationServiceInterface $organizationService
    ) {}

    public function index(): JsonResponse
    {
        $organizations = $this->organizationService->getFilteredOrganizations(request());
        return $this->successResponse(OrganizationResource::collection($organizations));
    }

    public function all(): JsonResponse
    {
        $organizations = $this->organizationService->getAllOrganizations();
        return $this->successResponse(OrganizationResource::collection($organizations));
    }

    public function active(): JsonResponse
    {
        $organizations = $this->organizationService->getActiveOrganizations();
        return $this->successResponse(OrganizationResource::collection($organizations));
    }

    public function show(int $id): JsonResponse
    {
        $organization = $this->organizationService->getOrganizationById($id);
        return $this->successResponse(new OrganizationResource($organization));
    }

    public function store(OrganizationStoreRequest $request): JsonResponse
    {
        $organization = $this->organizationService->createOrganization($request->validated());
        return $this->createdResponse(new OrganizationResource($organization));
    }

    public function update(OrganizationUpdateRequest $request, int $id): JsonResponse
    {
        $organization = $this->organizationService->updateOrganization($id, $request->validated());
        return $this->successResponse(new OrganizationResource($organization));
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->organizationService->deleteOrganization($id);

        if ($deleted) {
            return $this->successResponse(['message' => 'Organization deleted successfully']);
        }

        return $this->errorMessage('Error deleting organization', 500);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:organizations,id',
        ]);

        $count = $this->organizationService->deleteOrganizations($validated['ids']);

        return $this->successResponse([
            'message' => "Deleted {$count} organizations successfully",
        ]);
    }
}

