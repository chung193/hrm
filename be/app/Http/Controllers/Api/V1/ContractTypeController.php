<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\ContractTypeStoreRequest;
use App\Http\Requests\Api\V1\ContractTypeUpdateRequest;
use App\Http\Resources\Api\ContractType\ContractTypeResource;
use App\Services\Contracts\ContractTypeServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContractTypeController extends BaseApiController
{
    public function __construct(
        protected readonly ContractTypeServiceInterface $contractTypeService
    ) {}

    public function index(): JsonResponse
    {
        $contractTypes = $this->contractTypeService->getFilteredContractTypes(request());
        return $this->successResponse(ContractTypeResource::collection($contractTypes));
    }

    public function all(): JsonResponse
    {
        $contractTypes = $this->contractTypeService->getAllContractTypes();
        return $this->successResponse(ContractTypeResource::collection($contractTypes));
    }

    public function active(): JsonResponse
    {
        $contractTypes = $this->contractTypeService->getActiveContractTypes();
        return $this->successResponse(ContractTypeResource::collection($contractTypes));
    }

    public function show(int $id): JsonResponse
    {
        $contractType = $this->contractTypeService->getContractTypeById($id);
        return $this->successResponse(new ContractTypeResource($contractType));
    }

    public function store(ContractTypeStoreRequest $request): JsonResponse
    {
        $contractType = $this->contractTypeService->createContractType($request->validated());
        return $this->createdResponse(new ContractTypeResource($contractType));
    }

    public function update(ContractTypeUpdateRequest $request, int $id): JsonResponse
    {
        $contractType = $this->contractTypeService->updateContractType($id, $request->validated());
        return $this->successResponse(new ContractTypeResource($contractType));
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->contractTypeService->deleteContractType($id);

        if ($deleted) {
            return $this->successResponse(['message' => 'Contract type deleted successfully']);
        }

        return $this->errorMessage('Error deleting contract type', 500);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:contract_types,id',
        ]);

        $count = $this->contractTypeService->deleteContractTypes($validated['ids']);

        return $this->successResponse([
            'message' => "Deleted {$count} contract types successfully",
        ]);
    }
}

