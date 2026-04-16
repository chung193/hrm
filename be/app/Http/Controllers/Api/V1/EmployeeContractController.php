<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\EmployeeContractStoreRequest;
use App\Http\Requests\Api\V1\EmployeeContractUpdateRequest;
use App\Http\Resources\Api\EmployeeContract\EmployeeContractResource;
use App\Services\Contracts\EmployeeContractServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeContractController extends BaseApiController
{
    public function __construct(
        protected readonly EmployeeContractServiceInterface $employeeContractService
    ) {}

    public function index(): JsonResponse
    {
        $employeeContracts = $this->employeeContractService->getFilteredEmployeeContracts(request());
        return $this->successResponse(EmployeeContractResource::collection($employeeContracts));
    }

    public function all(): JsonResponse
    {
        $employeeContracts = $this->employeeContractService->getAllEmployeeContracts();
        return $this->successResponse(EmployeeContractResource::collection($employeeContracts));
    }

    public function active(): JsonResponse
    {
        $employeeContracts = $this->employeeContractService->getActiveEmployeeContracts();
        return $this->successResponse(EmployeeContractResource::collection($employeeContracts));
    }

    public function show(int $id): JsonResponse
    {
        $employeeContract = $this->employeeContractService->getEmployeeContractById($id);
        return $this->successResponse(new EmployeeContractResource($employeeContract));
    }

    public function store(EmployeeContractStoreRequest $request): JsonResponse
    {
        $employeeContract = $this->employeeContractService->createEmployeeContract($request->validated());
        return $this->createdResponse(new EmployeeContractResource($employeeContract));
    }

    public function update(EmployeeContractUpdateRequest $request, int $id): JsonResponse
    {
        $employeeContract = $this->employeeContractService->updateEmployeeContract($id, $request->validated());
        return $this->successResponse(new EmployeeContractResource($employeeContract));
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->employeeContractService->deleteEmployeeContract($id);

        if ($deleted) {
            return $this->successResponse(['message' => 'Employee contract deleted successfully']);
        }

        return $this->errorMessage('Error deleting employee contract', 500);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:employee_contracts,id',
        ]);

        $count = $this->employeeContractService->deleteEmployeeContracts($validated['ids']);

        return $this->successResponse([
            'message' => "Deleted {$count} employee contracts successfully",
        ]);
    }
}

