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

class ContractTypeService extends BaseService implements ContractTypeServiceInterface
{
    public function __construct(protected ContractTypeRepositoryInterface $contractTypeRepository)
    {
        $this->setRepository($contractTypeRepository);
    }

    public function getContractTypes(): Collection
    {
        return $this->repository->getFiltered();
    }

    public function getAllContractTypes(): Collection
    {
        return $this->repository->all();
    }

    public function getFilteredContractTypes(?Request $request = null, int $perPage = 15): LengthAwarePaginator
    {
        return $this->repository->paginateFiltered($perPage, ['*'], ['code', 'name']);
    }

    public function getContractTypeById(int $id): ?Model
    {
        try {
            return $this->repository->findOrFail($id);
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('Contract type not found');
        }
    }

    public function createContractType(array $data): Model
    {
        return $this->repository->create($data);
    }

    public function updateContractType(int $id, array $data): Model
    {
        try {
            return $this->repository->update($id, $data);
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('Contract type not found');
        }
    }

    public function deleteContractType(int $id): bool
    {
        try {
            $this->repository->delete($id);
            return true;
        } catch (ModelNotFoundException) {
            throw new ModelNotFoundException('Contract type not found');
        }
    }

    public function deleteContractTypes(array $ids): int
    {
        $count = $this->contractTypeRepository->bulkDelete($ids);
        if ($count === 0) {
            throw new ModelNotFoundException('Contract types not found');
        }

        return $count;
    }

    public function getActiveContractTypes(): Collection
    {
        return $this->contractTypeRepository->getActiveContractTypes();
    }
}

