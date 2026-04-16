<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\DepartmentStoreRequest;
use App\Http\Requests\Api\V1\DepartmentUpdateRequest;
use App\Http\Resources\Api\Department\DepartmentResource;
use App\Services\Contracts\DepartmentServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartmentController extends BaseApiController
{
    public function __construct(
        protected readonly DepartmentServiceInterface $departmentService
    ) {}

    public function index(): JsonResponse
    {
        $departments = $this->departmentService->getFilteredDepartments(request());
        return $this->successResponse(DepartmentResource::collection($departments));
    }

    public function all(): JsonResponse
    {
        $departments = $this->departmentService->getAllDepartments();
        return $this->successResponse(DepartmentResource::collection($departments));
    }

    public function active(): JsonResponse
    {
        $departments = $this->departmentService->getActiveDepartments();
        return $this->successResponse(DepartmentResource::collection($departments));
    }

    public function show(int $id): JsonResponse
    {
        $department = $this->departmentService->getDepartmentById($id);
        return $this->successResponse(new DepartmentResource($department));
    }

    public function store(DepartmentStoreRequest $request): JsonResponse
    {
        $department = $this->departmentService->createDepartment($request->validated());
        return $this->createdResponse(new DepartmentResource($department));
    }

    public function update(DepartmentUpdateRequest $request, int $id): JsonResponse
    {
        $department = $this->departmentService->updateDepartment($id, $request->validated());
        return $this->successResponse(new DepartmentResource($department));
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->departmentService->deleteDepartment($id);

        if ($deleted) {
            return $this->successResponse(['message' => 'Department deleted successfully']);
        }

        return $this->errorMessage('Error deleting department', 500);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:departments,id',
        ]);

        $count = $this->departmentService->deleteDepartments($validated['ids']);

        return $this->successResponse([
            'message' => "Deleted {$count} departments successfully",
        ]);
    }
}

