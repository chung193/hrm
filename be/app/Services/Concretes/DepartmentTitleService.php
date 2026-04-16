<?php

namespace App\Services\Concretes;

use App\Repositories\DepartmentTitle\Contracts\DepartmentTitleRepositoryInterface;
use App\Services\Base\Concretes\BaseService;
use App\Services\Contracts\DepartmentTitleServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class DepartmentTitleService extends BaseService implements DepartmentTitleServiceInterface
{
    public function __construct(protected DepartmentTitleRepositoryInterface $departmentTitleRepository)
    {
        $this->setRepository($departmentTitleRepository);
    }

    public function getDepartmentTitles(): Collection
    {
        return $this->repository->getFiltered();
    }

    public function getAllDepartmentTitles(): Collection
    {
        $organizationId = $this->resolveOrganizationIdFromAuth();
        $query = $this->repository->query();
        if ($organizationId) {
            $query->whereHas('department', fn($q) => $q->where('organization_id', $organizationId));
        }

        return $query->get();
    }

    public function getFilteredDepartmentTitles(?Request $request = null, int $perPage = 15): LengthAwarePaginator
    {
        $perPage = request('per_page', $perPage);
        $organizationId = $this->resolveOrganizationIdFromAuth();
        $query = $this->repository->query();
        if ($organizationId) {
            $query->whereHas('department', fn($q) => $q->where('organization_id', $organizationId));
        }

        $titles = $query->paginate($perPage, ['*']);
        $titles->getCollection()->load(['department']);

        return $titles;
    }

    public function getDepartmentTitleById(int $id): ?Model
    {
        try {
            return $this->departmentTitleRepository
                ->query()
                ->with(['department'])
                ->when(
                    $this->resolveOrganizationIdFromAuth(),
                    fn($query, $organizationId) => $query->whereHas('department', fn($q) => $q->where('organization_id', $organizationId))
                )
                ->findOrFail($id);
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('Department title not found');
        }
    }

    public function createDepartmentTitle(array $data): Model
    {
        $organizationId = $this->resolveOrganizationIdFromAuth();
        if ($organizationId) {
            $departmentBelongs = \App\Models\Department::query()
                ->where('id', $data['department_id'])
                ->where('organization_id', $organizationId)
                ->exists();

            if (!$departmentBelongs) {
                throw ValidationException::withMessages([
                    'department_id' => 'Department must belong to your organization.',
                ]);
            }
        }

        return $this->repository->create($data);
    }

    public function updateDepartmentTitle(int $id, array $data): Model
    {
        try {
            $title = $this->getDepartmentTitleById($id);
            $organizationId = $this->resolveOrganizationIdFromAuth();
            if ($organizationId && (int) $title->department?->organization_id !== $organizationId) {
                throw ValidationException::withMessages([
                    'organization_id' => 'You cannot update title outside your organization.',
                ]);
            }

            if ($organizationId && !empty($data['department_id'])) {
                $departmentBelongs = \App\Models\Department::query()
                    ->where('id', $data['department_id'])
                    ->where('organization_id', $organizationId)
                    ->exists();

                if (!$departmentBelongs) {
                    throw ValidationException::withMessages([
                        'department_id' => 'Department must belong to your organization.',
                    ]);
                }
            }

            $this->repository->update($id, $data);
            return $this->getDepartmentTitleById($id);
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('Department title not found');
        }
    }

    public function deleteDepartmentTitle(int $id): bool
    {
        try {
            $this->getDepartmentTitleById($id);
            $this->repository->delete($id);
            return true;
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('Department title not found');
        }
    }

    public function deleteDepartmentTitles(array $ids): int
    {
        $organizationId = $this->resolveOrganizationIdFromAuth();
        if ($organizationId) {
            $countInScope = $this->departmentTitleRepository->query()
                ->whereIn('id', $ids)
                ->whereHas('department', fn($q) => $q->where('organization_id', $organizationId))
                ->count();

            if ($countInScope !== count($ids)) {
                throw new ModelNotFoundException('Department titles not found');
            }
        }

        $count = $this->departmentTitleRepository->bulkDelete($ids);
        if ($count === 0) {
            throw new ModelNotFoundException('Department titles not found');
        }

        return $count;
    }

    public function getActiveDepartmentTitles(): Collection
    {
        $organizationId = $this->resolveOrganizationIdFromAuth();
        $query = $this->departmentTitleRepository->query()->where('is_active', true);
        if ($organizationId) {
            $query->whereHas('department', fn($q) => $q->where('organization_id', $organizationId));
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
