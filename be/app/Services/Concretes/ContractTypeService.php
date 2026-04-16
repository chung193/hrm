<?php

namespace App\Services\Concretes;

use App\Repositories\ContractType\Contracts\ContractTypeRepositoryInterface;
use App\Services\Base\Concretes\BaseService;
use App\Services\Contracts\ContractTypeServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class ContractTypeService extends BaseService implements ContractTypeServiceInterface
{
    public function __construct(protected ContractTypeRepositoryInterface $contractTypeRepository)
    {
        $this->setRepository($contractTypeRepository);
    }

    public function getContractTypes(): Collection
    {
        return $this->getAllContractTypes();
    }

    public function getAllContractTypes(): Collection
    {
        $organizationId = $this->resolveOrganizationIdFromAuth();
        $query = $this->repository->query();
        $query->where('organization_id', $organizationId);

        return $query->get();
    }

    public function getFilteredContractTypes(?Request $request = null, int $perPage = 15): LengthAwarePaginator
    {
        $perPage = request('per_page', $perPage);
        $organizationId = $this->resolveOrganizationIdFromAuth();
        $query = $this->repository->query();
        $query->where('organization_id', $organizationId);

        return $query->paginate($perPage, ['*']);
    }

    public function getContractTypeById(int $id): ?Model
    {
        try {
            $organizationId = $this->resolveOrganizationIdFromAuth();
            return $this->repository
                ->query()
                ->where('organization_id', $organizationId)
                ->findOrFail($id);
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('Contract type not found');
        }
    }

    public function createContractType(array $data): Model
    {
        $organizationId = $this->resolveOrganizationIdFromAuth();
        $data['organization_id'] = $organizationId;

        return $this->repository->create($data);
    }

    public function updateContractType(int $id, array $data): Model
    {
        try {
            $item = $this->getContractTypeById($id);
            $organizationId = $this->resolveOrganizationIdFromAuth();
            if ((int) $item->organization_id !== $organizationId) {
                throw ValidationException::withMessages([
                    'organization_id' => 'You cannot update contract type outside your organization.',
                ]);
            }

            $data['organization_id'] = $organizationId;

            return $this->repository->update($id, $data);
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('Contract type not found');
        }
    }

    public function deleteContractType(int $id): bool
    {
        try {
            $this->getContractTypeById($id);
            $this->repository->delete($id);
            return true;
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('Contract type not found');
        }
    }

    public function deleteContractTypes(array $ids): int
    {
        $organizationId = $this->resolveOrganizationIdFromAuth();
        $countInScope = $this->contractTypeRepository
            ->query()
            ->whereIn('id', $ids)
            ->where('organization_id', $organizationId)
            ->count();

        if ($countInScope !== count($ids)) {
            throw new ModelNotFoundException('Contract types not found');
        }

        $count = $this->contractTypeRepository->bulkDelete($ids);
        if ($count === 0) {
            throw new ModelNotFoundException('Contract types not found');
        }

        return $count;
    }

    public function getActiveContractTypes(): Collection
    {
        $organizationId = $this->resolveOrganizationIdFromAuth();
        $query = $this->contractTypeRepository
            ->query()
            ->where('is_active', true)
            ->where('organization_id', $organizationId);

        return $query->get();
    }

    private function resolveOrganizationIdFromAuth(): ?int
    {
        $authUser = Auth::user()?->loadMissing('detail');
        $requestedOrganizationId = (int) request('organization_id', 0);
        $userOrganizationId = (int) ($authUser?->detail?->organization_id ?? 0);
        $isAdmin = (bool) $authUser?->isAdmin();

        if ($isAdmin) {
            if ($requestedOrganizationId > 0) {
                return $requestedOrganizationId;
            }

            throw ValidationException::withMessages([
                'organization_id' => 'Organization context is required.',
            ]);
        }

        if ($userOrganizationId > 0) {
            if ($requestedOrganizationId > 0 && $requestedOrganizationId !== $userOrganizationId) {
                throw ValidationException::withMessages([
                    'organization_id' => 'You cannot access another organization.',
                ]);
            }

            return $requestedOrganizationId > 0 ? $requestedOrganizationId : $userOrganizationId;
        }

        throw ValidationException::withMessages([
            'organization_id' => 'Organization context is required.',
        ]);
    }
}
