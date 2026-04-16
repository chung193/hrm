<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\DepartmentTitleStoreRequest;
use App\Http\Requests\Api\V1\DepartmentTitleUpdateRequest;
use App\Http\Resources\Api\DepartmentTitle\DepartmentTitleResource;
use App\Services\Contracts\DepartmentTitleServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartmentTitleController extends BaseApiController
{
    public function __construct(
        protected readonly DepartmentTitleServiceInterface $departmentTitleService
    ) {}

    public function index(): JsonResponse
    {
        $titles = $this->departmentTitleService->getFilteredDepartmentTitles(request());
        return $this->successResponse(DepartmentTitleResource::collection($titles));
    }

    public function all(): JsonResponse
    {
        $titles = $this->departmentTitleService->getAllDepartmentTitles();
        return $this->successResponse(DepartmentTitleResource::collection($titles));
    }

    public function active(): JsonResponse
    {
        $titles = $this->departmentTitleService->getActiveDepartmentTitles();
        return $this->successResponse(DepartmentTitleResource::collection($titles));
    }

    public function show(int $id): JsonResponse
    {
        $title = $this->departmentTitleService->getDepartmentTitleById($id);
        return $this->successResponse(new DepartmentTitleResource($title));
    }

    public function store(DepartmentTitleStoreRequest $request): JsonResponse
    {
        $title = $this->departmentTitleService->createDepartmentTitle($request->validated());
        return $this->createdResponse(new DepartmentTitleResource($title));
    }

    public function update(DepartmentTitleUpdateRequest $request, int $id): JsonResponse
    {
        $title = $this->departmentTitleService->updateDepartmentTitle($id, $request->validated());
        return $this->successResponse(new DepartmentTitleResource($title));
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->departmentTitleService->deleteDepartmentTitle($id);

        if ($deleted) {
            return $this->successResponse(['message' => 'Department title deleted successfully']);
        }

        return $this->errorMessage('Error deleting department title', 500);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:department_titles,id',
        ]);

        $count = $this->departmentTitleService->deleteDepartmentTitles($validated['ids']);

        return $this->successResponse([
            'message' => "Deleted {$count} department titles successfully",
        ]);
    }
}

