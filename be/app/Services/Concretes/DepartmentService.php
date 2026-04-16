<?php

namespace App\Services\Concretes;

use App\Repositories\Department\Contracts\DepartmentRepositoryInterface;
use App\Services\Base\Concretes\BaseService;
use App\Services\Contracts\DepartmentServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class DepartmentService extends BaseService implements DepartmentServiceInterface
{
    public function __construct(protected DepartmentRepositoryInterface $departmentRepository)
    {
        $this->setRepository($departmentRepository);
    }

    public function getDepartments(): Collection
    {
        return $this->repository->getFiltered();
    }

    public function getAllDepartments(): Collection
    {
        $organizationId = $this->resolveOrganizationIdFromAuth();
        $query = $this->repository->query();
        if ($organizationId) {
            $query->where('organization_id', $organizationId);
        }

        return $query->get();
    }

    public function getFilteredDepartments(?Request $request = null, int $perPage = 15): LengthAwarePaginator
    {
        $perPage = request('per_page', $perPage);
        $organizationId = $this->resolveOrganizationIdFromAuth();
        $query = $this->repository->query();
        if ($organizationId) {
            $query->where('organization_id', $organizationId);
        }

        $departments = $query->paginate($perPage, ['*']);
        $departments->getCollection()->load(['organization']);

        return $departments;
    }

    public function getDepartmentById(int $id): ?Model
    {
        try {
            return $this->departmentRepository
                ->query()
                ->with(['organization'])
                ->when($this->resolveOrganizationIdFromAuth(), fn($query, $organizationId) => $query->where('organization_id', $organizationId))
                ->findOrFail($id);
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('Department not found');
        }
    }

    public function createDepartment(array $data): Model
    {
        $organizationId = $this->resolveOrganizationIdFromAuth();
        if ($organizationId) {
            $data['organization_id'] = $organizationId;
        }

        return $this->repository->create($data);
    }

    public function updateDepartment(int $id, array $data): Model
    {
        try {
            $department = $this->getDepartmentById($id);
            $organizationId = $this->resolveOrganizationIdFromAuth();
            if ($organizationId && (int) $department->organization_id !== $organizationId) {
                throw ValidationException::withMessages([
                    'organization_id' => 'You cannot update department outside your organization.',
                ]);
            }

            if ($organizationId) {
                $data['organization_id'] = $organizationId;
            }

            $this->repository->update($id, $data);
            return $this->getDepartmentById($id);
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('Department not found');
        }
    }

    public function deleteDepartment(int $id): bool
    {
        try {
            $this->getDepartmentById($id);
            $this->repository->delete($id);
            return true;
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('Department not found');
        }
    }

    public function deleteDepartments(array $ids): int
    {
        $organizationId = $this->resolveOrganizationIdFromAuth();
        if ($organizationId) {
            $countInScope = $this->departmentRepository->query()
                ->whereIn('id', $ids)
                ->where('organization_id', $organizationId)
                ->count();

            if ($countInScope !== count($ids)) {
                throw new ModelNotFoundException('Departments not found');
            }
        }

        $count = $this->departmentRepository->bulkDelete($ids);
        if ($count === 0) {
            throw new ModelNotFoundException('Departments not found');
        }

        return $count;
    }

    public function getActiveDepartments(): Collection
    {
        $organizationId = $this->resolveOrganizationIdFromAuth();
        $query = $this->departmentRepository->query()->where('is_active', true);
        if ($organizationId) {
            $query->where('organization_id', $organizationId);
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
