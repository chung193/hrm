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

class OrganizationService extends BaseService implements OrganizationServiceInterface
{
    public function __construct(protected OrganizationRepositoryInterface $organizationRepository)
    {
        $this->setRepository($organizationRepository);
    }

    public function getOrganizations(): Collection
    {
        return $this->repository->getFiltered();
    }

    public function getAllOrganizations(): Collection
    {
        return $this->repository->all();
    }

    public function getFilteredOrganizations(?Request $request = null, int $perPage = 15): LengthAwarePaginator
    {
        return $this->repository->paginateFiltered($perPage, ['*'], ['code', 'name']);
    }

    public function getOrganizationById(int $id): ?Model
    {
        try {
            return $this->repository->findOrFail($id);
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('Organization not found');
        }
    }

    public function createOrganization(array $data): Model
    {
        return $this->repository->create($data);
    }

    public function updateOrganization(int $id, array $data): Model
    {
        try {
            return $this->repository->update($id, $data);
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('Organization not found');
        }
    }

    public function deleteOrganization(int $id): bool
    {
        try {
            $this->repository->delete($id);
            return true;
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('Organization not found');
        }
    }

    public function deleteOrganizations(array $ids): int
    {
        $count = $this->organizationRepository->bulkDelete($ids);
        if ($count === 0) {
            throw new ModelNotFoundException('Organizations not found');
        }

        return $count;
    }

    public function getActiveOrganizations(): Collection
    {
        return $this->organizationRepository->getActiveOrganizations();
    }
}

