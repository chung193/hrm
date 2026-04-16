<?php

namespace App\Services\Concretes;

use App\Repositories\Organization\Contracts\OrganizationRepositoryInterface;
use App\Services\Base\Concretes\BaseService;
use App\Services\Contracts\OrganizationServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class OrganizationService extends BaseService implements OrganizationServiceInterface
{
    public function __construct(protected OrganizationRepositoryInterface $organizationRepository)
    {
        $this->setRepository($organizationRepository);
    }

    public function getOrganizations(): Collection
    {
        return $this->getAllOrganizations();
    }

    public function getAllOrganizations(): Collection
    {
        $organizationId = $this->resolveOrganizationIdFromAuth();
        $query = $this->repository->query();
        if ($organizationId) {
            $query->where('id', $organizationId);
        }

        return $query->get();
    }

    public function getFilteredOrganizations(?Request $request = null, int $perPage = 15): LengthAwarePaginator
    {
        $perPage = request('per_page', $perPage);
        $organizationId = $this->resolveOrganizationIdFromAuth();
        $query = $this->repository->query();
        if ($organizationId) {
            $query->where('id', $organizationId);
        }

        return $query->paginate($perPage, ['*']);
    }

    public function getOrganizationById(int $id): ?Model
    {
        try {
            return $this->repository
                ->query()
                ->when($this->resolveOrganizationIdFromAuth(), fn($query, $organizationId) => $query->where('id', $organizationId))
                ->findOrFail($id);
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('Organization not found');
        }
    }

    public function createOrganization(array $data): Model
    {
        $organizationId = $this->resolveOrganizationIdFromAuth();
        if ($organizationId && !(Auth::user()?->isAdmin())) {
            throw ValidationException::withMessages([
                'organization_id' => 'You cannot create organization with organization scope.',
            ]);
        }

        return $this->repository->create($data);
    }

    public function updateOrganization(int $id, array $data): Model
    {
        try {
            $organization = $this->getOrganizationById($id);
            $organizationId = $this->resolveOrganizationIdFromAuth();
            if ($organizationId && (int) $organization->id !== $organizationId) {
                throw ValidationException::withMessages([
                    'organization_id' => 'You cannot update another organization.',
                ]);
            }

            return $this->repository->update($id, $data);
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('Organization not found');
        }
    }

    public function deleteOrganization(int $id): bool
    {
        try {
            $this->getOrganizationById($id);
            $this->repository->delete($id);
            return true;
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('Organization not found');
        }
    }

    public function deleteOrganizations(array $ids): int
    {
        $organizationId = $this->resolveOrganizationIdFromAuth();
        if ($organizationId) {
            $countInScope = $this->organizationRepository->query()
                ->whereIn('id', $ids)
                ->where('id', $organizationId)
                ->count();

            if ($countInScope !== count($ids)) {
                throw new ModelNotFoundException('Organizations not found');
            }
        }

        $count = $this->organizationRepository->bulkDelete($ids);
        if ($count === 0) {
            throw new ModelNotFoundException('Organizations not found');
        }

        return $count;
    }

    public function getActiveOrganizations(): Collection
    {
        $organizationId = $this->resolveOrganizationIdFromAuth();
        $query = $this->organizationRepository->query()->where('is_active', true);
        if ($organizationId) {
            $query->where('id', $organizationId);
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
