<?php

namespace App\Services\Concretes;

use App\Repositories\EmployeeContract\Contracts\EmployeeContractRepositoryInterface;
use App\Services\Base\Concretes\BaseService;
use App\Services\Contracts\EmployeeContractServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class EmployeeContractService extends BaseService implements EmployeeContractServiceInterface
{
    public function __construct(protected EmployeeContractRepositoryInterface $employeeContractRepository)
    {
        $this->setRepository($employeeContractRepository);
    }

    public function getEmployeeContracts(): Collection
    {
        return $this->repository->getFiltered();
    }

    public function getAllEmployeeContracts(): Collection
    {
        $organizationId = $this->resolveOrganizationIdFromAuth();
        $query = $this->repository->query();
        if ($organizationId) {
            $query->whereHas('user.detail', fn($q) => $q->where('organization_id', $organizationId));
        }

        return $query->get();
    }

    public function getFilteredEmployeeContracts(?Request $request = null, int $perPage = 15): LengthAwarePaginator
    {
        $perPage = request('per_page', $perPage);
        $organizationId = $this->resolveOrganizationIdFromAuth();
        $query = $this->repository->query();
        if ($organizationId) {
            $query->whereHas('user.detail', fn($q) => $q->where('organization_id', $organizationId));
        }

        $contracts = $query->paginate($perPage, ['*']);
        $contracts->getCollection()->load(['user', 'contractType']);

        return $contracts;
    }

    public function getEmployeeContractById(int $id): ?Model
    {
        try {
            return $this->employeeContractRepository
                ->query()
                ->with(['user', 'contractType'])
                ->when(
                    $this->resolveOrganizationIdFromAuth(),
                    fn($query, $organizationId) => $query->whereHas('user.detail', fn($q) => $q->where('organization_id', $organizationId))
                )
                ->findOrFail($id);
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('Employee contract not found');
        }
    }

    public function createEmployeeContract(array $data): Model
    {
        return DB::transaction(function () use ($data) {
            if (!empty($data['is_active']) && !empty($data['user_id'])) {
                $this->employeeContractRepository
                    ->query()
                    ->where('user_id', $data['user_id'])
                    ->where('is_active', true)
                    ->update(['is_active' => false]);
            }

            $contract = $this->repository->create($data);
            return $contract->load(['user', 'contractType']);
        });
    }

    public function updateEmployeeContract(int $id, array $data): Model
    {
        try {
            return DB::transaction(function () use ($id, $data) {
                $contract = $this->employeeContractRepository->findOrFail($id);
                $nextUserId = (int) ($data['user_id'] ?? $contract->user_id);

                if (!empty($data['is_active'])) {
                    $this->employeeContractRepository
                        ->query()
                        ->where('user_id', $nextUserId)
                        ->where('id', '!=', $id)
                        ->where('is_active', true)
                        ->update(['is_active' => false]);
                }

                $this->repository->update($id, $data);
                return $this->getEmployeeContractById($id);
            });
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('Employee contract not found');
        }
    }

    public function deleteEmployeeContract(int $id): bool
    {
        try {
            $this->getEmployeeContractById($id);
            $this->repository->delete($id);
            return true;
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('Employee contract not found');
        }
    }

    public function deleteEmployeeContracts(array $ids): int
    {
        $organizationId = $this->resolveOrganizationIdFromAuth();
        if ($organizationId) {
            $countInScope = $this->employeeContractRepository->query()
                ->whereIn('id', $ids)
                ->whereHas('user.detail', fn($q) => $q->where('organization_id', $organizationId))
                ->count();

            if ($countInScope !== count($ids)) {
                throw new ModelNotFoundException('Employee contracts not found');
            }
        }

        $count = $this->employeeContractRepository->bulkDelete($ids);
        if ($count === 0) {
            throw new ModelNotFoundException('Employee contracts not found');
        }

        return $count;
    }

    public function getActiveEmployeeContracts(): Collection
    {
        $organizationId = $this->resolveOrganizationIdFromAuth();
        $query = $this->employeeContractRepository->query()->where('is_active', true);
        if ($organizationId) {
            $query->whereHas('user.detail', fn($q) => $q->where('organization_id', $organizationId));
        }

        return $query->get();
    }

    private function resolveOrganizationIdFromAuth(): ?int
    {
        $authUser = Auth::user()?->loadMissing('detail');
        $requestedOrganizationId = (int) request('organization_id', 0);
        $userOrganizationId = (int) ($authUser?->detail?->organization_id ?? 0);

        if ($userOrganizationId > 0) {
            if ($requestedOrganizationId > 0 && $requestedOrganizationId !== $userOrganizationId && !$authUser?->isAdmin()) {
                throw ValidationException::withMessages([
                    'organization_id' => 'You cannot access another organization.',
                ]);
            }

            return $requestedOrganizationId > 0 ? $requestedOrganizationId : $userOrganizationId;
        }

        if ($requestedOrganizationId > 0 && $authUser?->isAdmin()) {
            return $requestedOrganizationId;
        }

        return null;
    }
}
